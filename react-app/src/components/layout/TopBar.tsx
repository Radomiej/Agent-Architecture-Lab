import React from 'react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '../../store/uiStore'
import { useSimulationStore } from '../../store/simulationStore'
import { useCanvasStore } from '../../store/canvasStore'
import { useCostStore } from '../../store/costStore'
import { useLLMStore } from '../../store/llmStore'
import { cn } from '../../utils/cn'

export const TopBar: React.FC = () => {
  const { t } = useTranslation()
  const { theme, toggleTheme, lang, toggleLang, openModal, setLeftDrawer, leftDrawerOpen } = useUiStore()
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
      className="flex items-center gap-2 md:gap-3 h-12 px-3 md:px-4 shrink-0 relative z-[100]"
      style={{
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        className="md:hidden btn-ghost-app shrink-0"
        onClick={() => setLeftDrawer(!leftDrawerOpen)}
        aria-label="Toggle sidebar menu"
      >
        ☰
      </button>

      {/* App Title */}
      <div className="flex items-center gap-2 mr-1 md:mr-2 shrink-0">
        <span className="text-base font-bold tracking-tight whitespace-nowrap hidden sm:inline" style={{ color: 'var(--t1)' }}>
          Agent Architecture
        </span>
        <span className="text-base font-bold tracking-tight whitespace-nowrap sm:hidden" style={{ color: 'var(--t1)' }}>
          AA
        </span>
        <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(167,139,250,0.15)', color: '#A78BFA' }}>
          v33
        </span>
        {apiKey && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold hidden sm:inline" style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399' }}>
            LLM ✓
          </span>
        )}
      </div>

      {/* Cost HUD */}
      {nodes.length > 0 && (
        <button
          onClick={() => openModal('cost')}
          aria-label={t('cost.center', 'Cost Command Center')}
          className="flex items-center gap-0 rounded-md overflow-hidden cursor-pointer h-7 shrink-0"
          style={{
            background: 'var(--glass-hud-bg)',
            border: '1px solid var(--border)',
            padding: 0,
          }}
        >
          <HudCell label={t('cost.title', 'KOSZT')} value={`${cost.p50Fmt}–${cost.p90Fmt}`} color={sevColor(cost.severity)} />
          <HudCell label="TOK" value={`${cost.tokInFmt}/${cost.tokOutFmt}`} color="var(--t3)" />
          <HudMixCell mix={cost.modelMix} />
          <HudCell label="CTX" value={`${Math.round(ctx.maxPct * 100)}%`} color={sevColor(ctx.severity)} />
        </button>
      )}

      <div className="flex-1" />

      {/* Debug panel toggle */}
      {debugMode && (
        <button
          onClick={toggleDebugPanel}
          aria-label="Toggle LLM Debug Panel"
          title="Toggle LLM Debug Panel (D)"
          className={cn('btn-ghost-app', debugPanelOpen && 'text-amber-400')}
          style={{ color: debugPanelOpen ? '#FBBF24' : undefined, background: debugPanelOpen ? 'rgba(251,191,36,0.15)' : undefined }}
        >
          🐛
        </button>
      )}

      {/* Mermaid Export */}
      <button onClick={() => openModal('mermaid')} title="Export Mermaid" className="btn-ghost-app" aria-label="Export Mermaid diagram">
        ⬡
      </button>

      {/* Settings */}
      <button onClick={() => openModal('settings')} title="LLM Settings (,)" className="btn-ghost-app" aria-label="LLM Settings">
        ⚙
      </button>

      {/* Sim toggle */}
      <button
        onClick={() => isRunning ? stop() : start()}
        aria-label={isRunning ? t('simulation.stop', 'Stop') : t('simulation.start', 'Symulacja')}
        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border"
        style={{
          background: isRunning ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
          color: isRunning ? '#F87171' : '#34D399',
          borderColor: isRunning ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)',
          cursor: 'pointer',
        }}
      >
        <span>{isRunning ? '■' : '▶'}</span>
        <span className="hidden sm:inline">{isRunning ? t('simulation.stop', 'Stop') : t('simulation.start', 'Symulacja')}</span>
      </button>

      {/* Lang toggle */}
      <button onClick={toggleLang} aria-label={`Language: ${lang.toUpperCase()}`} className="btn-ghost-app hidden sm:flex">
        {lang.toUpperCase()}
      </button>

      {/* Theme toggle */}
      <button onClick={toggleTheme} aria-label={`Theme: ${theme}`} className="btn-ghost-app">
        {theme === 'dark' ? '☀' : '🌙'}
      </button>
    </header>
  )
}

const HudCell: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div
    className="flex flex-col items-center px-2.5 py-0.5 min-w-[56px]"
    style={{ borderRight: '1px solid var(--border)' }}
  >
    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--t4)' }}>{label}</span>
    <span className="text-[11px] font-semibold leading-tight whitespace-nowrap" style={{ color }}>{value}</span>
  </div>
)

const MIX_COLORS: Record<string, { color: string; label: string }> = {
  opus:   { color: '#F59E0B', label: 'O' },
  sonnet: { color: '#8B5CF6', label: 'S' },
  haiku:  { color: '#34D399', label: 'H' },
}

const HudMixCell: React.FC<{ mix: Record<string, number> }> = ({ mix }) => (
  <div
    className="flex flex-col items-center px-2 py-0.5 min-w-[48px]"
    style={{ borderRight: '1px solid var(--border)' }}
  >
    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--t4)' }}>MIX</span>
    <span className="flex items-center gap-1">
      {Object.entries(MIX_COLORS).map(([model, cfg]) => {
        const count = mix[model] ?? 0
        if (count === 0) return null
        return (
          <span key={model} className="flex items-center gap-px">
            <span className="inline-block rounded-full" style={{ width: 5, height: 5, background: cfg.color }} />
            <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>{count}{cfg.label}</span>
          </span>
        )
      })}
    </span>
  </div>
)
