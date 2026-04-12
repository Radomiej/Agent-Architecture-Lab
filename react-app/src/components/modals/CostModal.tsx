import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalBase } from './ModalBase'
import { useCanvasStore } from '../../store/canvasStore'
import { useCostStore, type CostSummary, type CtxSummary } from '../../store/costStore'
import { AD_MAP } from '../../data/agents'
import { ModelBadge } from '../primitives/ModelBadge'
import { PhaseChip } from '../primitives/PhaseChip'
import type { ModelType } from '../../types'

type Tab = 'overview' | 'breakdown' | 'whatif'

const MODEL_COLORS: Record<ModelType, string> = {
  opus: '#F59E0B',
  sonnet: '#8B5CF6',
  haiku: '#34D399',
}

export const CostModal: React.FC = () => {
  const { t } = useTranslation()
  const nodes = useCanvasStore((s) => s.nodes)
  const { getCostSummary, getContextSummary } = useCostStore()
  const [tab, setTab] = useState<Tab>('overview')
  const [sortCol, setSortCol] = useState<'agent' | 'p50'>('p50')
  const [inputMult, setInputMult] = useState(1)
  const [outputMult, setOutputMult] = useState(1)

  const cost = useMemo(() => getCostSummary(nodes), [nodes, getCostSummary])
  const ctx = useMemo(() => getContextSummary(nodes), [nodes, getContextSummary])

  const sortedAgents = useMemo(() => {
    const arr = [...cost.perAgent]
    if (sortCol === 'p50') return arr.sort((a, b) => b.p50 - a.p50)
    return arr.sort((a, b) => {
      const na = AD_MAP.get(a.agentId)?.name ?? a.agentId
      const nb = AD_MAP.get(b.agentId)?.name ?? b.agentId
      return na.localeCompare(nb)
    })
  }, [cost.perAgent, sortCol])

  const totalAgents = Object.values(cost.modelMix).reduce((a, b) => a + b, 0)

  // Donut segments (CSS conic-gradient)
  const conicGradient = useMemo(() => {
    if (!totalAgents) return 'var(--bg-card)'
    const op = (cost.modelMix.opus / totalAgents) * 100
    const so = (cost.modelMix.sonnet / totalAgents) * 100
    return `conic-gradient(${MODEL_COLORS.opus} 0% ${op}%, ${MODEL_COLORS.sonnet} ${op}% ${op + so}%, ${MODEL_COLORS.haiku} ${op + so}% 100%)`
  }, [cost.modelMix, totalAgents])

  const tabStyle = (active: Tab): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
    background: tab === active ? 'rgba(167,139,250,0.15)' : 'transparent',
    color: tab === active ? '#A78BFA' : 'var(--t3)',
    transition: 'all 0.15s',
  })

  return (
    <ModalBase modalId="cost" title={t('cost.center', 'Cost Command Center')} width={760}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '12px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button style={tabStyle('overview')} onClick={() => setTab('overview')}>{t('cost.overview')}</button>
        <button style={tabStyle('breakdown')} onClick={() => setTab('breakdown')}>{t('cost.breakdown')}</button>
        <button style={tabStyle('whatif')} onClick={() => setTab('whatif')}>{t('cost.whatif')}</button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {tab === 'overview' && (
          <OverviewTab cost={cost} ctx={ctx} conicGradient={conicGradient} totalAgents={totalAgents} />
        )}
        {tab === 'breakdown' && (
          <BreakdownTab agents={sortedAgents} sortCol={sortCol} onSort={setSortCol} totalP50={cost.p50} totalP90={cost.p90} />
        )}
        {tab === 'whatif' && (
          <WhatifTab cost={cost} inputMult={inputMult} setInputMult={setInputMult} outputMult={outputMult} setOutputMult={setOutputMult} />
        )}
      </div>
    </ModalBase>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{
  cost: CostSummary
  ctx: CtxSummary
  conicGradient: string
  totalAgents: number
}> = ({ cost, ctx, conicGradient, totalAgents }) => (
  <div>
    {/* KPI cards */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
      <KpiCard label="Cost p50" value={`$${cost.p50Fmt}`} sub={`p90: $${cost.p90Fmt}`} color="#34D399" />
      <KpiCard label="Tokens" value={cost.tokInFmt} sub={`out: ${cost.tokOutFmt}`} color="#60A5FA" />
      <KpiCard label="Context max" value={`${Math.round(ctx.maxPct * 100)}%`} sub={`${ctx.overTargetCount} over 50% target`} color="#FBBF24" />
    </div>

    {/* Model mix */}
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      {/* Donut */}
      <div style={{
        width: 100, height: 100, flexShrink: 0,
        borderRadius: '50%',
        background: conicGradient,
        boxShadow: 'inset 0 0 0 28px var(--bg-panel)',
      }} aria-label="Model mix donut chart" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {(['opus', 'sonnet', 'haiku'] as ModelType[]).map(m => (
          <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: MODEL_COLORS[m], flexShrink: 0 }} />
            <span style={{ color: MODEL_COLORS[m], fontWeight: 600, width: 52 }}>{m.charAt(0).toUpperCase() + m.slice(1)}</span>
            <span style={{ color: 'var(--t2)' }}>
              {cost.modelMix[m]}x ({totalAgents ? Math.round((cost.modelMix[m] / totalAgents) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ── Breakdown Tab ─────────────────────────────────────────────────────────────

const BreakdownTab: React.FC<{
  agents: CostSummary['perAgent']
  sortCol: 'agent' | 'p50'
  onSort: (col: 'agent' | 'p50') => void
  totalP50: number
  totalP90: number
}> = ({ agents, sortCol, onSort, totalP50, totalP90 }) => {
  const { t } = useTranslation()
  return (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <Th onClick={() => onSort('agent')} active={sortCol === 'agent'}>{t('cost.tableAgent')}</Th>
          <Th>{t('sidebar.model')}</Th>
          <Th>{t('sidebar.phase')}</Th>
          <Th onClick={() => onSort('p50')} active={sortCol === 'p50'}>{t('cost.tableP50')}</Th>
          <Th>{t('cost.p90')}</Th>
        </tr>
      </thead>
      <tbody>
        {agents.map((a) => {
          const def = AD_MAP.get(a.agentId)
          return (
            <tr key={a.nodeId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding: '6px 8px', color: 'var(--t1)' }}>{def?.name ?? a.agentId}</td>
              <td style={{ padding: '6px 8px' }}><ModelBadge model={a.model} small /></td>
              <td style={{ padding: '6px 8px' }}>{def && <PhaseChip phase={def.phase} small />}</td>
              <td style={{ padding: '6px 8px', color: '#F59E0B', fontFamily: 'var(--ff-mono)', fontWeight: 600 }}>${a.p50.toFixed(3)}</td>
              <td style={{ padding: '6px 8px', color: 'var(--t3)', fontFamily: 'var(--ff-mono)' }}>${a.p90.toFixed(3)}</td>
            </tr>
          )
        })}
        {/* Footer total */}
        <tr style={{ borderTop: '2px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
          <td colSpan={3} style={{ padding: '8px', color: 'var(--t2)', fontWeight: 700 }}>TOTAL</td>
          <td style={{ padding: '8px', color: '#F59E0B', fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>${totalP50.toFixed(3)}</td>
          <td style={{ padding: '8px', color: 'var(--t3)', fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>${totalP90.toFixed(3)}</td>
        </tr>
      </tbody>
    </table>
    {agents.length === 0 && (
      <p style={{ textAlign: 'center', color: 'var(--t4)', padding: '32px', fontSize: '13px' }}>No agents on canvas</p>
    )}
  </div>
  )
}

// ── What-if Tab ───────────────────────────────────────────────────────────────

const WhatifTab: React.FC<{
  cost: CostSummary
  inputMult: number; setInputMult: (v: number) => void
  outputMult: number; setOutputMult: (v: number) => void
}> = ({ cost, inputMult, setInputMult, outputMult, setOutputMult }) => {
  const adjusted = cost.p50 * ((inputMult + outputMult) / 2)
  const scenarios = [
    { label: 'Current', value: cost.p50, color: '#60A5FA' },
    { label: 'All Opus', value: cost.p50 * 3.5, color: '#F59E0B' },
    { label: 'All Sonnet', value: cost.p50 * 1.2, color: '#8B5CF6' },
    { label: 'All Haiku', value: cost.p50 * 0.3, color: '#34D399' },
  ]
  const maxVal = Math.max(...scenarios.map(s => s.value), 0.001)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SliderRow label="Input tokens multiplier" value={inputMult} min={0.5} max={2} step={0.1} onChange={setInputMult} />
        <SliderRow label="Output tokens multiplier" value={outputMult} min={0.5} max={2} step={0.1} onChange={setOutputMult} />
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', fontSize: '13px', color: 'var(--t1)' }}>
          Adjusted p50: <strong style={{ color: '#A78BFA' }}>${adjusted.toFixed(3)}</strong>
        </div>
      </div>

      {/* Scenario bars */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Model Scenarios</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {scenarios.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
              <span style={{ width: 70, color: 'var(--t2)', flexShrink: 0 }}>{s.label}</span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--bg-card)' }}>
                <div style={{ width: `${(s.value / maxVal) * 100}%`, height: '100%', borderRadius: 4, background: s.color, transition: 'width 0.3s' }} />
              </div>
              <span style={{ width: 60, textAlign: 'right', fontFamily: 'var(--ff-mono)', color: s.color, fontWeight: 600 }}>${s.value.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const KpiCard: React.FC<{ label: string; value: string; sub: string; color: string }> = ({ label, value, sub, color }) => (
  <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t4)', marginBottom: '6px' }}>{label}</div>
    <div style={{ fontSize: '22px', fontWeight: 800, color, fontFamily: 'var(--ff-mono)' }}>{value}</div>
    <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: '2px' }}>{sub}</div>
  </div>
)

const Th: React.FC<{ children: React.ReactNode; onClick?: () => void; active?: boolean }> = ({ children, onClick, active }) => (
  <th
    style={{
      padding: '8px', textAlign: 'left', color: active ? '#A78BFA' : 'var(--t3)',
      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      cursor: onClick ? 'pointer' : 'default', userSelect: 'none',
    }}
    onClick={onClick}
  >
    {children}{active ? ' ↓' : ''}
  </th>
)

const SliderRow: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }> = ({ label, value, min, max, step, onChange }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--t2)', marginBottom: '4px' }}>
      <span>{label}</span><span style={{ fontFamily: 'var(--ff-mono)', color: '#A78BFA' }}>{value.toFixed(1)}×</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))}
      style={{ width: '100%', accentColor: '#A78BFA' }} />
  </div>
)
