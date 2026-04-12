import React, { useState } from 'react'
import { useSimulationStore } from '../../store/simulationStore'
import type { LLMCallLog } from '../../types'

const STATUS_COLOR: Record<LLMCallLog['status'], string> = {
  pending: '#FBBF24',
  streaming: '#60A5FA',
  done: '#34D399',
  error: '#F87171',
}

const STATUS_ICON: Record<LLMCallLog['status'], string> = {
  pending: '🟡',
  streaming: '🔵',
  done: '🟢',
  error: '🔴',
}

interface LogRowProps {
  entry: LLMCallLog
}

const LogRow: React.FC<LogRowProps> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false)

  const copyJson = () => {
    const payload = JSON.stringify(entry, null, 2)
    navigator.clipboard.writeText(payload).catch(() => undefined)
  }

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
        padding: '8px 12px',
        fontSize: '12px',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span title={entry.status} style={{ flexShrink: 0 }}>{STATUS_ICON[entry.status]}</span>
        <span style={{ fontWeight: 600, color: 'var(--t1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.agentName}
        </span>
        <span style={{ color: 'var(--t4)', fontFamily: 'var(--ff-mono)', fontSize: '11px', flexShrink: 0 }}>
          {entry.model}
        </span>
        {entry.latencyMs !== undefined && (
          <span style={{ color: 'var(--t4)', fontSize: '11px', flexShrink: 0 }}>
            {entry.latencyMs}ms
          </span>
        )}
        {entry.usage && (
          <span style={{ color: 'var(--t4)', fontSize: '11px', flexShrink: 0 }}>
            {entry.usage.promptTokens}→{entry.usage.completionTokens}
          </span>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={microBtnStyle}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▲' : '▼'}
        </button>
        <button
          type="button"
          onClick={copyJson}
          style={microBtnStyle}
          aria-label="Copy JSON"
          title="Copy raw response JSON"
        >
          📋
        </button>
      </div>

      {/* Response preview */}
      <div
        style={{
          marginTop: '4px',
          color: entry.status === 'error' ? STATUS_COLOR.error : 'var(--t3)',
          fontFamily: entry.status === 'error' ? 'inherit' : 'var(--ff-mono)',
          fontSize: '11px',
          lineHeight: 1.5,
          whiteSpace: expanded ? 'pre-wrap' : 'nowrap',
          overflow: 'hidden',
          textOverflow: expanded ? 'clip' : 'ellipsis',
          maxHeight: expanded ? 'none' : '18px',
          borderRadius: expanded ? '4px' : undefined,
          background: expanded ? 'var(--bg-input)' : undefined,
          padding: expanded ? '6px 8px' : undefined,
        }}
      >
        {entry.status === 'error'
          ? `Error: ${entry.error ?? 'Unknown'}`
          : entry.responseText || (entry.status === 'pending' ? 'Waiting…' : '…')
        }
      </div>
    </div>
  )
}

export const DebugPanel: React.FC = () => {
  const { executionLog, debugPanelOpen, toggleDebugPanel } = useSimulationStore()

  if (!debugPanelOpen) return null

  const clearLog = () => useSimulationStore.setState({ executionLog: [] })

  return (
    <div
      role="region"
      aria-label="LLM Debug Panel"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 500,
        background: 'var(--bg-panel, rgba(10,10,18,0.95))',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        maxHeight: '280px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Panel header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🐛 LLM Debug
        </span>
        <span style={{ fontSize: '11px', color: 'var(--t4)' }}>
          {executionLog.length} call{executionLog.length !== 1 ? 's' : ''}
        </span>
        <div style={{ flex: 1 }} />
        {executionLog.length > 0 && (
          <button type="button" onClick={clearLog} style={{ ...microBtnStyle, fontSize: '11px', padding: '2px 8px' }}>
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={toggleDebugPanel}
          style={microBtnStyle}
          aria-label="Close debug panel"
        >
          ✕
        </button>
      </div>

      {/* Log entries */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {executionLog.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t4)', fontSize: '12px' }}>
            No LLM calls yet. Right-click an agent node and select "Run with LLM".
          </div>
        ) : (
          [...executionLog].reverse().map((entry) => (
            <LogRow key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  )
}

const microBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  cursor: 'pointer',
  padding: '2px 6px',
  fontSize: '12px',
  color: 'var(--t3)',
  flexShrink: 0,
}
