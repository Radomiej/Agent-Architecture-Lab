import React from 'react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '../../store/uiStore'
import { AD_MAP } from '../../data/agents'
import { PRESET_MAP } from '../../data/presets'
import { AgentIcon } from '../primitives/AgentIcon'
import { PhaseChip } from '../primitives/PhaseChip'
import { ModelBadge } from '../primitives/ModelBadge'
import { VerdictPanel } from '../primitives/VerdictPanel'
import { getAgentColor, getPresetColor } from '../../data/agentColors'
import { useSimulationStore } from '../../store/simulationStore'

export const RightSidebar: React.FC = () => {
  const { selectedAgentId, selectedPresetId, theme } = useUiStore()
  const { messages, isRunning, phase } = useSimulationStore()

  if (!selectedAgentId && !selectedPresetId) {
    return (
      <aside
        className="flex flex-col h-full overflow-hidden w-full"
        aria-label="Right sidebar"
      >
        <EmptyState />
        <SimulationTimeline messages={messages} isRunning={isRunning} phase={phase} />
      </aside>
    )
  }

  return (
    <aside className="flex flex-col h-full overflow-hidden w-full" aria-label="Agent/preset details">
      {selectedAgentId && <AgentDetail id={selectedAgentId} theme={theme} />}
      {selectedPresetId && <PresetDetail id={selectedPresetId} />}
      <SimulationTimeline messages={messages} isRunning={isRunning} phase={phase} />
    </aside>
  )
}

const EmptyState: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center text-xs" style={{ color: 'var(--t4)' }}>
      <span className="text-3xl opacity-30">⬡</span>
      <span>{t('sidebar.emptyHint')}</span>
    </div>
  )
}

const AgentDetail: React.FC<{ id: string; theme: 'dark' | 'light' }> = ({ id, theme }) => {
  const { t } = useTranslation()
  const { t: tAgents } = useTranslation('agents')
  const agent = AD_MAP.get(id)
  if (!agent) return null

  const color = getAgentColor(id, theme)

  const agentName: string = tAgents(`${id}.name`, { defaultValue: agent.name })
  const mid: string = tAgents(`${id}.mid`, { defaultValue: '' })
  const green = tAgents(`${id}.green`, { returnObjects: true, defaultValue: [] }) as string[]
  const red = tAgents(`${id}.red`, { returnObjects: true, defaultValue: [] }) as string[]

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Header */}
      <div className="flex gap-3 items-start mb-4">
        <div
          className="flex items-center justify-center shrink-0 rounded-xl"
          style={{
            width: 48,
            height: 48,
            background: `rgba(${hexToRgb(color)},0.15)`,
            border: `1px solid rgba(${hexToRgb(color)},0.3)`,
          }}
        >
          <AgentIcon id={id} size={24} color={color} />
        </div>
        <div className="min-w-0">
          <h2 className="m-0 text-base font-bold" style={{ color: 'var(--t1)' }}>{agentName}</h2>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            <PhaseChip phase={agent.phase} small />
            <ModelBadge model={agent.model} small />
          </div>
        </div>
      </div>

      {/* Key competencies (mid) */}
      {mid && (
        <Section label={t('sidebar.role')}>
          <p className="m-0 text-xs leading-relaxed" style={{ color: 'var(--t2)' }}>{mid}</p>
        </Section>
      )}

      {/* Tools */}
      <Section label={t('sidebar.tools')}>
        <div className="flex flex-wrap gap-1">
          {agent.tools.split(',').map((tool) => (
            <span key={tool.trim()} className="px-2 py-0.5 rounded text-[11px]" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--t2)' }}>
              {tool.trim()}
            </span>
          ))}
        </div>
      </Section>

      {/* Verdict panel: when to use / when not to use */}
      {(green.length > 0 || red.length > 0) && (
        <VerdictPanel
          green={green}
          red={red}
          greenLabel={t('sidebar.whenToUse')}
          redLabel={t('sidebar.whenNotToUse')}
        />
      )}
    </div>
  )
}

const MODEL_COLORS: Record<string, { color: string; rgb: string }> = {
  opus:   { color: '#F59E0B', rgb: '245,158,11' },
  sonnet: { color: '#8B5CF6', rgb: '139,92,246' },
  haiku:  { color: '#34D399', rgb: '52,211,153' },
}

const PresetDetail: React.FC<{ id: string }> = ({ id }) => {
  const { t } = useTranslation()
  const { t: tPresets } = useTranslation('presets')
  const theme = useUiStore((s) => s.theme)
  const color = getPresetColor(id, theme)
  const preset = PRESET_MAP.get(id)

  const fallbackName = id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const name: string = tPresets(`${id}.name`, { defaultValue: fallbackName })
  const mid: string = tPresets(`${id}.mid`, { defaultValue: '' })
  const green = tPresets(`${id}.green`, { returnObjects: true, defaultValue: [] }) as string[]
  const red = tPresets(`${id}.red`, { returnObjects: true, defaultValue: [] }) as string[]

  // Derive model mix
  const modelMix: Record<string, number> = {}
  if (preset) {
    for (const n of preset.nodes) {
      const model = n.m ?? AD_MAP.get(n.id)?.model ?? 'sonnet'
      modelMix[model] = (modelMix[model] ?? 0) + 1
    }
  }
  const nodeCount = preset?.nodes.length ?? 0

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Header with icon */}
      <div className="flex gap-3 items-start mb-4">
        <div
          className="flex items-center justify-center shrink-0 rounded-xl"
          style={{
            width: 48,
            height: 48,
            background: `rgba(${hexToRgb(color)},0.15)`,
            border: `1px solid rgba(${hexToRgb(color)},0.3)`,
          }}
        >
          <AgentIcon id={id} size={24} color={color} isPreset />
        </div>
        <div className="min-w-0">
          <h2 className="m-0 text-base font-bold" style={{ color: 'var(--t1)' }}>{name}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[11px] font-semibold" style={{ color: 'var(--t3)' }}>
              {nodeCount} {nodeCount === 1 ? 'agent' : t('sidebar.agents', 'agents')}
            </span>
            {/* Model mix chips */}
            {Object.entries(modelMix).map(([model, count]) => {
              const cfg = MODEL_COLORS[model]
              if (!cfg) return null
              return (
                <span
                  key={model}
                  className="inline-flex items-center gap-1 rounded-full text-[10px] font-semibold px-1.5 py-px"
                  style={{
                    color: cfg.color,
                    background: `rgba(${cfg.rgb},0.12)`,
                    border: `1px solid rgba(${cfg.rgb},0.25)`,
                  }}
                >
                  <span className="inline-block rounded-full" style={{ width: 5, height: 5, background: cfg.color }} />
                  {count} {model.charAt(0).toUpperCase() + model.slice(1)}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {mid && (
        <p className="m-0 mb-3 text-xs leading-relaxed" style={{ color: 'var(--t3)' }}>{mid}</p>
      )}

      {/* Agent list */}
      {preset && preset.nodes.length > 0 && (
        <Section label={t('sidebar.composition', 'Composition')}>
          <div className="flex flex-col gap-1">
            {preset.nodes.map((n, idx) => {
              const agentDef = AD_MAP.get(n.id)
              const agentModel = n.m ?? agentDef?.model ?? 'sonnet'
              const agentColor = getAgentColor(n.id, theme)
              return (
                <div key={`${n.id}-${idx}`} className="flex items-center gap-2">
                  <div
                    className="flex items-center justify-center shrink-0 rounded"
                    style={{
                      width: 20,
                      height: 20,
                      background: `rgba(${hexToRgb(agentColor)},0.12)`,
                    }}
                  >
                    <AgentIcon id={n.id} size={12} color={agentColor} />
                  </div>
                  <span className="text-[11px] flex-1 truncate" style={{ color: 'var(--t1)' }}>
                    {agentDef?.name ?? n.id}
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase"
                    style={{ color: MODEL_COLORS[agentModel]?.color ?? 'var(--t4)' }}
                  >
                    {agentModel}
                  </span>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {(green.length > 0 || red.length > 0) && (
        <VerdictPanel
          green={green}
          red={red}
          greenLabel={t('sidebar.whenToUse')}
          redLabel={t('sidebar.whenNotToUse')}
        />
      )}
      {green.length === 0 && red.length === 0 && !mid && (
        <p className="m-0 text-xs" style={{ color: 'var(--t3)' }}>
          {t('sidebar.presetNoData', { defaultValue: 'No detailed data available for this preset.' })}
        </p>
      )}
    </div>
  )
}

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-3">
    <div className="text-[10px] font-bold uppercase tracking-[0.06em] mb-1.5" style={{ color: 'var(--t4)' }}>
      {label}
    </div>
    {children}
  </div>
)

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

const SimulationTimeline: React.FC<{ messages: Array<{ agentId: string; text: string; timestamp: number; phase?: string }>; isRunning: boolean; phase: string }> = ({ messages, isRunning, phase }) => {
  const { t } = useTranslation()
  if (!isRunning && messages.length === 0) return null

  const recent = [...messages].slice(-10).reverse()

  return (
    <section
      className="shrink-0 border-t px-3 py-2"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-input)' }}
      aria-label="Dialog Timeline"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--t4)' }}>
          Dialog Timeline
        </span>
        <span className="text-[10px]" style={{ color: isRunning ? '#34D399' : 'var(--t4)' }}>
          {isRunning ? `LIVE · ${phase}` : 'IDLE'}
        </span>
      </div>

      <div className="max-h-40 overflow-y-auto flex flex-col gap-1 pr-1">
        {recent.length === 0 && (
          <div className="text-[11px]" style={{ color: 'var(--t4)' }}>
            {t('sidebar.noMessages', 'No simulation messages.')}
          </div>
        )}

        {recent.map((msg, idx) => {
          const agent = AD_MAP.get(msg.agentId)
          const phaseLabel = msg.phase ? `[${msg.phase}] ` : ''
          return (
            <div key={`${msg.timestamp}-${idx}`} className="text-[11px] leading-snug" style={{ color: 'var(--t2)' }}>
              <span style={{ color: 'var(--t4)' }}>{phaseLabel}</span>
              <span className="font-semibold" style={{ color: 'var(--t1)' }}>{agent?.name ?? msg.agentId}</span>
              <span>: {msg.text}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

