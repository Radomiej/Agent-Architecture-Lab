import React from 'react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '../../store/uiStore'
import { AD_MAP } from '../../data/agents'
import { AgentIcon } from '../primitives/AgentIcon'
import { PhaseChip } from '../primitives/PhaseChip'
import { ModelBadge } from '../primitives/ModelBadge'
import { VerdictPanel } from '../primitives/VerdictPanel'
import { getAgentColor } from '../../data/agentColors'

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

const EmptyState: React.FC = () => {
  const { t } = useTranslation()
  return (
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

  // Agent data from JSON locale (falls back to data from agents.ts if key missing)
  const agentName: string = tAgents(`${id}.name`, agent.name)
  const doesList = tAgents(`${id}.green`, { returnObjects: true, defaultValue: [] }) as string[]
  const doesNotList = tAgents(`${id}.red`, { returnObjects: true, defaultValue: [] }) as string[]

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
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--t1)' }}>{agentName}</h2>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
            <PhaseChip phase={agent.phase} small />
            <ModelBadge model={agent.model} small />
          </div>
        </div>
      </div>

      {/* Role */}
      <Section label={t('sidebar.role')}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--t2)', lineHeight: 1.5 }}>{agent.role}</p>
      </Section>

      {/* Tools */}
      <Section label={t('sidebar.tools')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {agent.tools.split(',').map((tool) => (
            <span key={tool.trim()} style={tagStyle}>{tool.trim()}</span>
          ))}
        </div>
      </Section>

      {/* What it does (from JSON locale) */}
      {doesList.length > 0 && (
        <Section label={t('sidebar.whatItDoes')}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {doesList.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--t2)' }}>
                <span style={{ color: '#34D399', flexShrink: 0 }}>✓</span>{item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* What it does NOT (from JSON locale) */}
      {doesNotList.length > 0 && (
        <Section label={t('sidebar.whatItDoesNot')}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {doesNotList.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--t2)' }}>
                <span style={{ color: '#F87171', flexShrink: 0 }}>✗</span>{item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Verdict panel */}
      {(doesList.length > 0 || doesNotList.length > 0) && (
        <VerdictPanel green={doesList} red={doesNotList} />
      )}
    </div>
  )
}

const PresetDetail: React.FC<{ id: string }> = ({ id }) => {
  const { t } = useTranslation()
  const { t: tPresets } = useTranslation('presets')

  const name: string = tPresets(`${id}.name`, id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
  const mid: string = tPresets(`${id}.mid`, '')
  const green = tPresets(`${id}.green`, { returnObjects: true, defaultValue: [] }) as string[]
  const red = tPresets(`${id}.red`, { returnObjects: true, defaultValue: [] }) as string[]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
      <h2 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: 'var(--t1)' }}>{name}</h2>
      {mid && (
        <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--t3)', lineHeight: 1.5 }}>{mid}</p>
      )}

      {green.length > 0 && (
        <Section label={t('sidebar.presetWhenToUse')}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {green.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--t2)' }}>
                <span style={{ color: '#34D399', flexShrink: 0 }}>✓</span>{item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {red.length > 0 && (
        <Section label={t('sidebar.presetWhenNotToUse')}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {red.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--t2)' }}>
                <span style={{ color: '#F87171', flexShrink: 0 }}>✗</span>{item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {green.length === 0 && red.length === 0 && !mid && (
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--t3)' }}>
          {t('sidebar.presetNoData')}
        </p>
      )}

      <VerdictPanel green={green} red={red} />
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
