import React from 'react'
import { useUiStore } from '../../store/uiStore'
import { AD_MAP } from '../../data/agents'
import { AgentIcon } from '../primitives/AgentIcon'
import { PhaseChip } from '../primitives/PhaseChip'
import { ModelBadge } from '../primitives/ModelBadge'
import { VerdictPanel } from '../primitives/VerdictPanel'
import { getAgentColor } from '../../data/agentColors'
import { AGENT_KNOWLEDGE } from '../../data/agentKnowledge'

export const RightSidebar: React.FC = () => {
  const { selectedAgentId, selectedPresetId, theme } = useUiStore()

  if (!selectedAgentId && !selectedPresetId) {
    return (
      <aside
        className="flex flex-col h-full overflow-hidden w-full"
        aria-label="Right sidebar"
      >
        <EmptyState />
      </aside>
    )
  }

  return (
    <aside className="flex flex-col h-full overflow-hidden w-full" aria-label="Agent/preset details">
      {selectedAgentId && <AgentDetail id={selectedAgentId} theme={theme} />}
      {selectedPresetId && <PresetDetail id={selectedPresetId} />}
    </aside>
  )
}

const EmptyState: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center text-xs" style={{ color: 'var(--t4)' }}>
    <span className="text-3xl opacity-30">⬡</span>
    <span>Kliknij agenta lub preset aby zobaczyc szczegoly</span>
  </div>
)

const AgentDetail: React.FC<{ id: string; theme: 'dark' | 'light' }> = ({ id, theme }) => {
  const agent = AD_MAP.get(id)
  if (!agent) return null

  const color = getAgentColor(id, theme)
  const knowledge = AGENT_KNOWLEDGE[id]

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
          <h2 className="m-0 text-base font-bold" style={{ color: 'var(--t1)' }}>{agent.name}</h2>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            <PhaseChip phase={agent.phase} small />
            <ModelBadge model={agent.model} small />
          </div>
        </div>
      </div>

      {/* Role */}
      <Section label="ROLA">
        <p className="m-0 text-xs leading-relaxed" style={{ color: 'var(--t2)' }}>{agent.role}</p>
      </Section>

      {/* Tools */}
      <Section label="NARZEDZIA">
        <div className="flex flex-wrap gap-1">
          {agent.tools.split(',').map((tool) => (
            <span key={tool.trim()} className="px-2 py-0.5 rounded text-[11px]" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--t2)' }}>
              {tool.trim()}
            </span>
          ))}
        </div>
      </Section>

      {/* Knowledge */}
      {knowledge && (
        <>
          <Section label="CO ROBI">
            <ul className="m-0 p-0 list-none flex flex-col gap-1">
              {knowledge.does.map((item, i) => (
                <li key={i} className="flex gap-1.5 text-xs" style={{ color: 'var(--t2)' }}>
                  <span className="shrink-0" style={{ color: '#34D399' }}>✓</span>{item}
                </li>
              ))}
            </ul>
          </Section>

          <Section label="CZEGO NIE ROBI">
            <ul className="m-0 p-0 list-none flex flex-col gap-1">
              {knowledge.doesNot.map((item, i) => (
                <li key={i} className="flex gap-1.5 text-xs" style={{ color: 'var(--t2)' }}>
                  <span className="shrink-0" style={{ color: '#F87171' }}>✗</span>{item}
                </li>
              ))}
            </ul>
          </Section>

          <VerdictPanel green={knowledge.does} red={knowledge.doesNot} />
        </>
      )}
    </div>
  )
}

const PresetDetail: React.FC<{ id: string }> = ({ id }) => {
  const label = id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="m-0 mb-3 text-base font-bold" style={{ color: 'var(--t1)' }}>{label}</h2>
      <p className="m-0 text-xs" style={{ color: 'var(--t3)' }}>
        Szczegoly presetu beda dostepne po zaladowaniu danych z i18n.
      </p>
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

