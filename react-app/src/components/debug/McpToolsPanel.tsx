import React, { useState } from 'react'
import { useMcpStore } from '../../store/mcpStore'
import type { McpContent } from '../../services/mcpService'

// ─── Result renderer ──────────────────────────────────────────────────────────

function renderContent(content: McpContent[]): React.ReactNode {
  if (content.length === 0) return <span style={{ color: 'var(--t4)' }}>(empty response)</span>
  return content.map((c, i) => {
    if (c.type === 'text') {
      return (
        <pre
          key={i}
          style={{
            margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            fontFamily: 'var(--ff-mono)', fontSize: '11px', color: 'var(--t1)',
          }}
        >
          {c.text}
        </pre>
      )
    }
    if (c.type === 'image') {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={`data:${c.mimeType ?? 'image/png'};base64,${c.data}`}
          alt="tool result"
          style={{ maxWidth: '100%', borderRadius: '4px', marginTop: '4px' }}
        />
      )
    }
    return <pre key={i} style={{ margin: 0, fontSize: '11px', color: 'var(--t4)' }}>{JSON.stringify(c)}</pre>
  })
}

// ─── Single tool row ──────────────────────────────────────────────────────────

interface ToolRowProps {
  name: string
  description?: string
  inputSchema: { type: 'object'; properties?: Record<string, { type: string; description?: string }>; required?: string[] }
}

const ToolRow: React.FC<ToolRowProps> = ({ name, description, inputSchema }) => {
  const { callTool } = useMcpStore()
  const [expanded, setExpanded] = useState(false)
  const [argsText, setArgsText] = useState(() => {
    // Pre-fill with empty required args scaffold
    const props = inputSchema.properties ?? {}
    const required = inputSchema.required ?? []
    if (required.length === 0) return '{}'
    const scaffold: Record<string, string> = {}
    for (const k of required) scaffold[k] = props[k]?.type === 'string' ? '' : '__value__'
    return JSON.stringify(scaffold, null, 2)
  })
  const [result, setResult] = useState<{ ok: boolean; content: McpContent[]; error?: string } | null>(null)
  const [running, setRunning] = useState(false)
  const [argsError, setArgsError] = useState('')

  const handleCall = async () => {
    setArgsError('')
    let args: Record<string, unknown>
    try {
      args = JSON.parse(argsText) as Record<string, unknown>
    } catch {
      setArgsError('Invalid JSON args')
      return
    }
    setRunning(true)
    setResult(null)
    try {
      const res = await callTool(name, args)
      setResult(res)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '8px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--t2)', fontSize: '12px', fontWeight: 600,
            fontFamily: 'var(--ff-mono)', textAlign: 'left', flex: 1, padding: 0,
          }}
        >
          {expanded ? '▾' : '▸'} {name}
        </button>
        {description && (
          <span style={{ fontSize: '11px', color: 'var(--t4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
            {description}
          </span>
        )}
        <button
          type="button"
          onClick={() => { void handleCall() }}
          disabled={running}
          style={{
            padding: '3px 10px', borderRadius: '4px', fontSize: '11px', cursor: running ? 'not-allowed' : 'pointer',
            background: running ? 'var(--bg-card)' : 'rgba(52,211,153,0.12)',
            border: '1px solid rgba(52,211,153,0.3)', color: '#34D399', flexShrink: 0,
          }}
        >
          {running ? '⏳' : '▶ Run'}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Args editor */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--t4)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Arguments (JSON)</div>
            <textarea
              value={argsText}
              onChange={(e) => setArgsText(e.target.value)}
              rows={4}
              spellCheck={false}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-input)', border: `1px solid ${argsError ? 'rgba(248,113,113,0.5)' : 'var(--border)'}`,
                borderRadius: '4px', color: 'var(--t1)', fontSize: '11px',
                fontFamily: 'var(--ff-mono)', padding: '6px', resize: 'vertical',
              }}
            />
            {argsError && <div style={{ fontSize: '11px', color: '#F87171', marginTop: '2px' }}>{argsError}</div>}
          </div>

          {/* Result */}
          {result && (
            <div style={{
              padding: '8px', borderRadius: '4px',
              background: result.ok ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
              border: `1px solid ${result.ok ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
              maxHeight: '200px', overflowY: 'auto',
            }}>
              {result.ok
                ? renderContent(result.content)
                : <span style={{ fontSize: '11px', color: '#F87171' }}>❌ {result.error}</span>
              }
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export const McpToolsPanel: React.FC = () => {
  const { panelOpen, togglePanel, status, tools, connect, disconnect, config, errorMsg } = useMcpStore()
  const [search, setSearch] = useState('')

  if (!panelOpen) return null

  const filtered = tools.filter((t) =>
    !search.trim() || t.name.toLowerCase().includes(search.toLowerCase()) || (t.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = status === 'connected' ? '#34D399' : status === 'error' ? '#F87171' : status === 'connecting' ? '#60A5FA' : 'var(--t4)'
  const statusLabel = status === 'connected' ? `✓ Connected — ${tools.length} tools` : status === 'connecting' ? '⏳ Connecting…' : status === 'error' ? `✗ ${errorMsg ?? 'Error'}` : '○ Disconnected'

  return (
    <div
      role="region"
      aria-label="MCP Tools Panel"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 499,
        background: 'var(--bg-panel, rgba(10,10,18,0.96))',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        maxHeight: '320px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🐳 MCP Gateway
        </span>
        <span style={{ fontSize: '11px', color: statusColor }}>{statusLabel}</span>
        <div style={{ flex: 1 }} />

        {status === 'disconnected' || status === 'error' ? (
          <button
            type="button"
            onClick={() => { void connect() }}
            disabled={!config.enabled || !config.gatewayUrl}
            style={{ ...microBtn, color: '#34D399', borderColor: 'rgba(52,211,153,0.3)' }}
          >
            Connect
          </button>
        ) : status === 'connected' ? (
          <button type="button" onClick={() => { void disconnect() }} style={{ ...microBtn }}>
            Disconnect
          </button>
        ) : null}

        {!config.enabled && (
          <span style={{ fontSize: '11px', color: '#FBBF24' }}>⚠ Enable MCP in Settings (,)</span>
        )}

        {/* Search */}
        {status === 'connected' && tools.length > 0 && (
          <input
            type="search"
            placeholder="Filter tools…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '4px',
              color: 'var(--t1)', fontSize: '11px', padding: '3px 8px', width: '160px',
            }}
          />
        )}

        <button type="button" onClick={togglePanel} style={microBtn} aria-label="Close MCP panel">✕</button>
      </div>

      {/* Tool list */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {status !== 'connected' && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--t4)', fontSize: '12px' }}>
            {status === 'disconnected' && !config.enabled
              ? 'Enable MCP Gateway in Settings (,) and save.'
              : status === 'disconnected'
              ? 'Click "Connect" to connect to the Docker MCP Gateway.'
              : status === 'connecting'
              ? '⏳ Connecting to gateway…'
              : `Connection error: ${errorMsg}`
            }
          </div>
        )}
        {status === 'connected' && filtered.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t4)', fontSize: '12px' }}>
            {search ? 'No tools match the filter.' : 'No tools available.'}
          </div>
        )}
        {filtered.map((tool) => (
          <ToolRow key={tool.name} {...tool} />
        ))}
      </div>
    </div>
  )
}

const microBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  cursor: 'pointer',
  padding: '2px 8px',
  fontSize: '11px',
  color: 'var(--t3)',
}
