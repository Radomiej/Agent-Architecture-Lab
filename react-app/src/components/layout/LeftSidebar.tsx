import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '../../store/uiStore'
import { usePresetStore } from '../../store/presetStore'
import { useCanvasStore } from '../../store/canvasStore'
import { AD, AD_MAP, PCAT, PHASES } from '../../data/agents'
import { PRESET_MAP } from '../../data/presets'
import { AgentIcon } from '../primitives/AgentIcon'
import { PhaseChip } from '../primitives/PhaseChip'
import { getAgentColor, getPresetColor } from '../../data/agentColors'

export const LeftSidebar: React.FC = () => {
  const { t } = useTranslation()
  const { sidebarTab, setSidebarTab, agentPaletteSearch, setSearch, selectAgent, selectPreset, theme } = useUiStore()
  const { customAgents, savedConfigs } = usePresetStore()
  const loadPreset = useCanvasStore((s) => s.loadPreset)

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
      className="flex flex-col h-full overflow-hidden w-full"
      aria-label="Left sidebar"
    >
      {/* Tabs */}
      <div className="flex shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        {(['agents', 'presets', 'saved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSidebarTab(tab)}
            role="tab"
            aria-selected={sidebarTab === tab}
            className="flex-1 py-2.5 px-1 border-0 bg-transparent cursor-pointer text-[11px] font-semibold uppercase tracking-widest transition-colors"
            style={{
              color: sidebarTab === tab ? 'var(--accent1)' : 'var(--t3)',
              borderBottom: sidebarTab === tab ? '2px solid var(--accent1)' : '2px solid transparent',
            }}
          >
            {tab === 'agents' ? t('nav.agents', 'Agenci') : tab === 'presets' ? t('nav.presets', 'Presety') : t('nav.saved', 'Zapisane')}
          </button>
        ))}
      </div>

      {/* Search */}
      {(sidebarTab === 'agents' || sidebarTab === 'presets') && (
        <div className="px-2.5 py-2 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <input
            type="search"
            value={agentPaletteSearch}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={sidebarTab === 'agents' ? t('sidebar.searchAgents', 'Search agents...') : t('sidebar.searchPresets', 'Search presets...')}
            aria-label={t('sidebar.search', 'Search')}
            className="w-full px-2.5 py-1.5 rounded-md text-xs outline-none box-border"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--t1)',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-1">
        {sidebarTab === 'agents' && (
          <AgentList groups={groupedAgents} onSelect={selectAgent} theme={theme} />
        )}
        {sidebarTab === 'presets' && (
          <PresetList onSelect={(id) => { selectPreset(id); const p = PRESET_MAP.get(id); if (p) loadPreset(p) }} theme={theme} search={agentPaletteSearch} />
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
              className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-[0.06em]"
              style={{ color: catColor }}
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
                  className="flex items-center gap-2 px-3 py-1.5 cursor-grab transition-colors hover:bg-[var(--state-hover)] focus-visible:outline-none focus-visible:bg-[var(--state-focus)]"
                >
                  <div
                    className="flex items-center justify-center shrink-0 rounded-lg"
                    style={{
                      width: 30,
                      height: 30,
                      background: `rgba(${hexToRgb(color)},0.15)`,
                      border: `1px solid rgba(${hexToRgb(color)},0.3)`,
                    }}
                  >
                    <AgentIcon id={agent.id} size={16} color={color} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: 'var(--t1)' }}>{agent.name}</div>
                    <div className="text-[10px] truncate" style={{ color: 'var(--t3)' }}>{agent.model.toUpperCase()}</div>
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

const MODEL_DOT_COLORS: Record<string, string> = {
  opus: '#F59E0B',
  sonnet: '#8B5CF6',
  haiku: '#34D399',
}

const PresetList: React.FC<{
  onSelect: (id: string) => void
  theme: 'dark' | 'light'
  search: string
}> = ({ onSelect, theme, search }) => {
  const { t: tPresets } = useTranslation('presets')

  return (
    <>
      {PCAT.map((cat) => {
        const filtered = cat.ids.filter((id) => !search || id.toLowerCase().includes(search.toLowerCase()))
        if (filtered.length === 0) return null
        return (
          <div key={cat.name}>
            <div className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--t3)' }}>
              {cat.name}
            </div>
            {filtered.map((id) => {
              const color = getPresetColor(id, theme)
              const preset = PRESET_MAP.get(id)
              const nodeCount = preset?.nodes.length ?? 0
              const fallbackName = id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
              const name: string = tPresets(`${id}.name`, { defaultValue: fallbackName })
              const mid: string = tPresets(`${id}.mid`, { defaultValue: preset?.desc ?? '' })
              const isNew = preset?.tier === 'new'

              // Derive model mix from preset nodes
              const modelMix: Record<string, number> = {}
              if (preset) {
                for (const n of preset.nodes) {
                  const model = n.m ?? AD_MAP.get(n.id)?.model ?? 'sonnet'
                  modelMix[model] = (modelMix[model] ?? 0) + 1
                }
              }

              return (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(id)}
                  className="flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-[var(--state-hover)] focus-visible:outline-none focus-visible:bg-[var(--state-focus)]"
                >
                  {/* Preset icon */}
                  <div
                    className="flex items-center justify-center shrink-0 rounded-lg mt-0.5"
                    style={{
                      width: 30,
                      height: 30,
                      background: `rgba(${hexToRgb(color)},0.15)`,
                      border: `1px solid rgba(${hexToRgb(color)},0.3)`,
                    }}
                  >
                    <AgentIcon id={id} size={16} color={color} isPreset />
                  </div>

                  {/* Text content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold truncate" style={{ color: 'var(--t1)' }}>{name}</span>
                      {isNew && (
                        <span
                          className="shrink-0 text-[8px] font-bold uppercase leading-none rounded px-1 py-[2px]"
                          style={{ color: '#34D399', background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.3)' }}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {/* Agent count badge */}
                      <span className="text-[10px] font-semibold shrink-0" style={{ color: 'var(--t3)' }}>
                        {nodeCount}
                      </span>
                      {/* Model mix dots */}
                      <span className="flex items-center gap-px shrink-0">
                        {Object.entries(modelMix).map(([model, count]) => (
                          <span key={model} className="flex items-center gap-px" title={`${count} ${model}`}>
                            {Array.from({ length: count }).map((_, i) => (
                              <span
                                key={i}
                                className="inline-block rounded-full"
                                style={{ width: 5, height: 5, background: MODEL_DOT_COLORS[model] ?? '#8089A0' }}
                              />
                            ))}
                          </span>
                        ))}
                      </span>
                    </div>
                    {mid && (
                      <div className="text-[10px] leading-tight mt-0.5 line-clamp-2" style={{ color: 'var(--t3)' }}>
                        {mid}
                      </div>
                    )}
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

const SavedList: React.FC<{ configs: { name: string; data: unknown }[] }> = ({ configs }) => {
  const { t } = useTranslation()
  if (configs.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--t3)' }}>
        {t('sidebar.noSaved', 'No saved configurations')}
      </div>
    )
  }
  return (
    <>
      {configs.map((cfg) => (
        <div
          key={cfg.name}
          className="flex items-center gap-2 px-3 py-2"
        >
          <span className="text-xs flex-1 truncate" style={{ color: 'var(--t1)' }}>
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

