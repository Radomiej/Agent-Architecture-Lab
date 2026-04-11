import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '../../store/uiStore'
import { usePresetStore } from '../../store/presetStore'
import { AD, PCAT, PHASES } from '../../data/agents'
import { AgentIcon } from '../primitives/AgentIcon'
import { PhaseChip } from '../primitives/PhaseChip'
import { getAgentColor, getPresetColor } from '../../data/agentColors'

const SIDEBAR_WIDTH = 260

export const LeftSidebar: React.FC = () => {
  const { t } = useTranslation()
  const { sidebarTab, setSidebarTab, agentPaletteSearch, setSearch, selectAgent, selectPreset, theme } = useUiStore()
  const { customAgents, savedConfigs } = usePresetStore()

  const allAgents = useMemo(() => [...AD, ...customAgents], [customAgents])

  const filteredAgents = useMemo(() => {
    const q = agentPaletteSearch.toLowerCase()
    if (!q) return allAgents
    return allAgents.filter((a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || a.cat.toLowerCase().includes(q))
  }, [allAgents, agentPaletteSearch])

  const groupedAgents = useMemo(() => {
    const groups: Record<string, typeof filteredAgents> = {}
    for (const a of filteredAgents) {
      if (!groups[a.cat]) groups[a.cat] = []
      groups[a.cat].push(a)
    }
    return groups
  }, [filteredAgents])

  return (
    <aside
      style={{
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_WIDTH,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border)',
        height: '100%',
        overflow: 'hidden',
      }}
      aria-label="Left sidebar"
    >
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {(['agents', 'presets', 'saved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSidebarTab(tab)}
            role="tab"
            aria-selected={sidebarTab === tab}
            style={{
              flex: 1,
              padding: '10px 4px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: sidebarTab === tab ? 'var(--accent1)' : 'var(--t3)',
              borderBottom: sidebarTab === tab ? '2px solid var(--accent1)' : '2px solid transparent',
              transition: 'color 0.15s',
            }}
          >
            {tab === 'agents' ? t('nav.agents', 'Agenci') : tab === 'presets' ? t('nav.presets', 'Presety') : t('nav.saved', 'Zapisane')}
          </button>
        ))}
      </div>

      {/* Search */}
      {(sidebarTab === 'agents' || sidebarTab === 'presets') && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <input
            type="search"
            value={agentPaletteSearch}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={sidebarTab === 'agents' ? 'Szukaj agenta...' : 'Szukaj presetu...'}
            aria-label="Szukaj"
            style={{
              width: '100%',
              padding: '6px 10px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--t1)',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {sidebarTab === 'agents' && (
          <AgentList groups={groupedAgents} onSelect={selectAgent} theme={theme} />
        )}
        {sidebarTab === 'presets' && (
          <PresetList onSelect={selectPreset} theme={theme} search={agentPaletteSearch} />
        )}
        {sidebarTab === 'saved' && (
          <SavedList configs={savedConfigs} />
        )}
      </div>
    </aside>
  )
}

const AgentList: React.FC<{
  groups: Record<string, typeof AD>
  onSelect: (id: string) => void
  theme: 'dark' | 'light'
}> = ({ groups, onSelect, theme }) => {
  const phaseColorMap = Object.fromEntries(PHASES.map((p) => [p.id, p.color]))

  return (
    <>
      {Object.entries(groups).map(([cat, agents]) => {
        const phaseId = agents[0]?.phase
        const catColor = phaseColorMap[phaseId] ?? '#8089A0'
        return (
          <div key={cat}>
            <div
              style={{
                padding: '6px 12px 4px',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: catColor,
              }}
            >
              {cat}
            </div>
            {agents.map((agent) => {
              const color = getAgentColor(agent.id, theme)
              return (
                <div
                  key={agent.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(agent.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(agent.id)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('agent-id', agent.id)
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    cursor: 'grab',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--state-hover)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '8px',
                      background: `rgba(${hexToRgb(color)},0.15)`,
                      border: `1px solid rgba(${hexToRgb(color)},0.3)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AgentIcon id={agent.id} size={16} color={color} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {agent.model.toUpperCase()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </>
  )
}

const PresetList: React.FC<{
  onSelect: (id: string) => void
  theme: 'dark' | 'light'
  search: string
}> = ({ onSelect, theme, search }) => {
  return (
    <>
      {PCAT.map((cat) => {
        const filtered = cat.ids.filter((id) => !search || id.toLowerCase().includes(search.toLowerCase()))
        if (filtered.length === 0) return null
        return (
          <div key={cat.name}>
            <div style={{ padding: '6px 12px 4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t3)' }}>
              {cat.name}
            </div>
            {filtered.map((id) => {
              const color = getPresetColor(id, theme)
              const label = id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
              return (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', cursor: 'pointer' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--state-hover)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </>
  )
}

const SavedList: React.FC<{ configs: { name: string; data: unknown }[] }> = ({ configs }) => {
  if (configs.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--t3)', fontSize: '12px' }}>
        Brak zapisanych konfiguracji
      </div>
    )
  }
  return (
    <>
      {configs.map((cfg) => (
        <div
          key={cfg.name}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}
        >
          <span style={{ fontSize: '12px', color: 'var(--t1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {cfg.name}
          </span>
          <PhaseChip phase="strategy" small />
        </div>
      ))}
    </>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
