import React, { useMemo, useState } from 'react'
import { ModalBase } from './ModalBase'
import { useCanvasStore } from '../../store/canvasStore'
import { AD_MAP } from '../../data/agents'

const PHASE_COLORS: Record<string, string> = {
  strategy: '#5B8DEF',
  research: '#22C4E6',
  debate1: '#A78BFA',
  debate2: '#A78BFA',
  build: '#34D399',
  qa: '#F87171',
  hitl: '#FBBF24',
}

function sanitize(s: string): string {
  return s.replace(/["[\]|#<>`]/g, ' ').replace(/\s+/g, ' ').trim()
}

export const MermaidModal: React.FC = () => {
  const nodes = useCanvasStore((s) => s.nodes)
  const connections = useCanvasStore((s) => s.connections)
  const [copied, setCopied] = useState(false)

  const diagram = useMemo(() => {
    if (!nodes.length) return ''
    const lines = ['flowchart TD']

    // classDefs
    Object.entries(PHASE_COLORS).forEach(([phase, color]) => {
      lines.push(`  classDef ${phase} fill:${color},color:#fff,stroke:${color}`)
    })

    // nodes
    nodes.forEach(n => {
      const def = AD_MAP.get(n.agentId)
      const label = sanitize(def?.name ?? n.agentId)
      lines.push(`  ${n.id}["${label} (${def?.model ?? 'sonnet'})"]`)
      if (def) lines.push(`  class ${n.id} ${def.phase}`)
    })

    // connections
    connections.forEach(c => {
      lines.push(`  ${c.from} --> ${c.to}`)
    })

    return lines.join('\n')
  }, [nodes, connections])

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(diagram)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the textarea so the user can copy manually
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.select()
      }
    }
  }

  return (
    <ModalBase modalId="mermaid" title="Export Mermaid Diagram" width={680}>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!nodes.length ? (
          <p style={{ color: 'var(--t4)', textAlign: 'center', padding: '32px', margin: 0 }}>
            Add agents to the canvas first
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--t3)' }}>
                {nodes.length} nodes · {connections.length} connections
              </span>
              <button
                onClick={handleCopy}
                style={{
                  padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(167,139,250,0.15)',
                  color: copied ? '#34D399' : '#A78BFA',
                  fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
                }}
              >
                {copied ? '✓ Copied!' : '⊕ Copy to clipboard'}
              </button>
            </div>

            <textarea
              ref={textareaRef}
              readOnly
              value={diagram}
              rows={Math.min(24, diagram.split('\n').length + 2)}
              style={{
                width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '12px', fontFamily: 'var(--ff-mono)', fontSize: '12px',
                color: 'var(--t2)', resize: 'vertical', lineHeight: 1.5, outline: 'none',
                boxSizing: 'border-box',
              }}
              onClick={e => (e.target as HTMLTextAreaElement).select()}
            />

            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', fontSize: '11px', color: 'var(--t3)' }}>
              Paste into <a href="https://mermaid.live" target="_blank" rel="noreferrer" style={{ color: '#34D399' }}>mermaid.live</a> or any Markdown with Mermaid support (GitHub, Notion, Obsidian)
            </div>
          </>
        )}
      </div>
    </ModalBase>
  )
}
