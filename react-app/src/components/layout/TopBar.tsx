import React from 'react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '../../store/uiStore'
import { useSimulationStore } from '../../store/simulationStore'
import { useCanvasStore } from '../../store/canvasStore'
import { useCostStore } from '../../store/costStore'
import { useLLMStore } from '../../store/llmStore'

export const TopBar: React.FC = () => {
  const { t } = useTranslation()
  const { theme, toggleTheme, lang, toggleLang, openModal } = useUiStore()
  const { isRunning, start, stop, debugPanelOpen, toggleDebugPanel } = useSimulationStore()
  const nodes = useCanvasStore((s) => s.nodes)
  const getCostSummary = useCostStore((s) => s.getCostSummary)
  const getContextSummary = useCostStore((s) => s.getContextSummary)
  const { debugMode, apiKey } = useLLMStore()

  const cost = getCostSummary(nodes)
  const ctx = getContextSummary(nodes)

  const sevColor = (sev: string) => {
    if (sev === 'safe') return '#34D399'
    if (sev === 'warn') return '#FBBF24'
    if (sev === 'high') return '#60A5FA'
    return '#F87171'
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        height: '48px',
        padding: '0 16px',
        background: 'var(--bg-panel, rgba(15,15,24,0.85))',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* App Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
          Agent Architecture
        </span>
        <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(167,139,250,0.15)', color: '#A78BFA', fontWeight: 600 }}>
          v32.16
        </span>
        {apiKey && (
          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(52,211,153,0.12)', color: '#34D399', fontWeight: 600 }}>
            LLM ✓
          </span>
        )}
      </div>

      {/* Cost HUD */}
      {nodes.length > 0 && (
        <button
          onClick={() => openModal('cost')}
          aria-label={t('cost.center', 'Cost Command Center')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1px',
            background: 'var(--glass-hud-bg)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '0',
            overflow: 'hidden',
            height: '28px',
          }}
        >
          <HudCell label={t('cost.title', 'KOSZT')} value={`${cost.p50Fmt}–${cost.p90Fmt}`} color={sevColor(cost.severity)} />
          <HudCell label="TOK" value={`${cost.tokInFmt}/${cost.tokOutFmt}`} color="var(--t3)" />
          <HudCell label="CTX" value={`${Math.round(ctx.maxPct * 100)}%`} color={sevColor(ctx.severity)} />
        </button>
      )}

      <div style={{ flex: 1 }} />

      {/* Debug panel toggle — visible only when debugMode is on */}
      {debugMode && (
        <button
          onClick={toggleDebugPanel}
          aria-label="Toggle LLM Debug Panel"
          title="Toggle LLM Debug Panel (D)"
          style={{
            ...iconBtnStyle,
            background: debugPanelOpen ? 'rgba(251,191,36,0.15)' : 'none',
            color: debugPanelOpen ? '#FBBF24' : 'var(--t3)',
          }}
        >
          🐛
        </button>
      )}

      {/* Mermaid Export */}
      <button
        onClick={() => openModal('mermaid')}
        title="Export Mermaid"
        style={iconBtnStyle}
        aria-label="Export Mermaid diagram"
      >
        ⬡
      </button>

      {/* Settings */}
      <button
        onClick={() => openModal('settings')}
        title="LLM Settings (,)"
        aria-label="LLM Settings"
        style={iconBtnStyle}
      >
        ⚙
      </button>

      {/* Sim toggle */}
      <button
        onClick={() => isRunning ? stop() : start()}
        aria-label={isRunning ? t('simulation.stop', 'Stop') : t('simulation.start', 'Symulacja')}
        style={{
          ...iconBtnStyle,
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 600,
          background: isRunning
            ? 'rgba(248,113,113,0.15)'
            : 'rgba(52,211,153,0.15)',
          color: isRunning ? '#F87171' : '#34D399',
          border: `1px solid ${isRunning ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {isRunning ? '■' : '▶'} {isRunning ? t('simulation.stop', 'Stop') : t('simulation.start', 'Symulacja')}
      </button>

      {/* Lang toggle */}
      <button
        onClick={toggleLang}
        aria-label={`Language: ${lang.toUpperCase()}`}
        style={iconBtnStyle}
      >
        {lang.toUpperCase()}
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label={`Theme: ${theme}`}
        style={iconBtnStyle}
      >
        {theme === 'dark' ? '☀' : '🌙'}
      </button>
    </header>
  )
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: '6px',
  fontSize: '13px',
  color: 'var(--t2)',
  transition: 'background 0.15s',
  display: 'flex',
  alignItems: 'center',
}

const HudCell: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2px 10px',
      borderRight: '1px solid var(--border)',
      minWidth: '60px',
    }}
  >
    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--t4)' }}>{label}</span>
    <span style={{ fontSize: '11px', fontWeight: 600, color, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{value}</span>
  </div>
)
