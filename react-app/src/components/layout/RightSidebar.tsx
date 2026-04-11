import React from 'react'
import { useUiStore } from '../../store/uiStore'
import { AD_MAP } from '../../data/agents'
import { AgentIcon } from '../primitives/AgentIcon'
import { PhaseChip } from '../primitives/PhaseChip'
import { ModelBadge } from '../primitives/ModelBadge'
import { VerdictPanel } from '../primitives/VerdictPanel'
import { getAgentColor } from '../../data/agentColors'
import { AGENT_KNOWLEDGE } from '../../data/agentKnowledge'

const SIDEBAR_WIDTH = 300

export const RightSidebar: React.FC = () => {
  const { selectedAgentId, selectedPresetId, theme } = useUiStore()

  if (!selectedAgentId && !selectedPresetId) {
    return (
      <aside
        style={sidebarStyle}
        aria-label="Right sidebar"
      >
        <EmptyState />
      </aside>
    )
  }

  return (
    <aside style={sidebarStyle} aria-label="Agent/preset details">
      {selectedAgentId && <AgentDetail id={selectedAgentId} theme={theme} />}
      {selectedPresetId && <PresetDetail id={selectedPresetId} />}
    </aside>
  )
}

const sidebarStyle: React.CSSProperties = {
  width: SIDEBAR_WIDTH,
  minWidth: SIDEBAR_WIDTH,
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg-panel)',
  borderLeft: '1px solid var(--border)',
  height: '100%',
  overflow: 'hidden',
}

const EmptyState: React.FC = () => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--t4)',
      fontSize: '12px',
      gap: '8px',
      padding: '24px',
      textAlign: 'center',
    }}
  >
    <span style={{ fontSize: '32px', opacity: 0.3 }}>⬡</span>
    <span>Kliknij agenta lub preset aby zobaczyc szczegoly</span>
  </div>
)

const AgentDetail: React.FC<{ id: string; theme: 'dark' | 'light' }> = ({ id, theme }) => {
  const agent = AD_MAP.get(id)
  if (!agent) return null

  const color = getAgentColor(id, theme)
  const knowledge = AGENT_KNOWLEDGE[id]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: `rgba(${hexToRgb(color)},0.15)`,
            border: `1px solid rgba(${hexToRgb(color)},0.3)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AgentIcon id={id} size={24} color={color} />
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--t1)' }}>{agent.name}</h2>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
            <PhaseChip phase={agent.phase} small />
            <ModelBadge model={agent.model} small />
          </div>
        </div>
      </div>

      {/* Role */}
      <Section label="ROLA">
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--t2)', lineHeight: 1.5 }}>{agent.role}</p>
      </Section>

      {/* Tools */}
      <Section label="NARZEDZIA">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {agent.tools.split(',').map((tool) => (
            <span key={tool.trim()} style={tagStyle}>{tool.trim()}</span>
          ))}
        </div>
      </Section>

      {/* Knowledge */}
      {knowledge && (
        <>
          <Section label="CO ROBI">
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {knowledge.does.map((item, i) => (
                <li key={i} style={{ display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--t2)' }}>
                  <span style={{ color: '#34D399', flexShrink: 0 }}>✓</span>{item}
                </li>
              ))}
            </ul>
          </Section>

          <Section label="CZEGO NIE ROBI">
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {knowledge.doesNot.map((item, i) => (
                <li key={i} style={{ display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--t2)' }}>
                  <span style={{ color: '#F87171', flexShrink: 0 }}>✗</span>{item}
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
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: 'var(--t1)' }}>{label}</h2>
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--t3)' }}>
        Szczegoly presetu beda dostepne po zaladowaniu danych z i18n.
      </p>
    </div>
  )
}

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: '12px' }}>
    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t4)', marginBottom: '6px' }}>
      {label}
    </div>
    {children}
  </div>
)

const tagStyle: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: '4px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  fontSize: '11px',
  color: 'var(--t2)',
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
