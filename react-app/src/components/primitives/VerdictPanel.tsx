import React from 'react'

interface VerdictPanelProps {
  green: string[]
  red: string[]
}

export const VerdictPanel: React.FC<VerdictPanelProps> = ({ green, red }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      marginTop: '8px',
    }}
  >
    <div
      style={{
        background: 'rgba(52,211,153,0.08)',
        border: '1px solid rgba(52,211,153,0.2)',
        borderRadius: '8px',
        padding: '10px 12px',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#34D399', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Kiedy uzywac
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {green.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '12px', color: 'var(--t2)' }}>
            <span style={{ color: '#34D399', flexShrink: 0, marginTop: '1px' }}>✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>

    <div
      style={{
        background: 'rgba(248,113,113,0.08)',
        border: '1px solid rgba(248,113,113,0.2)',
        borderRadius: '8px',
        padding: '10px 12px',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#F87171', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Kiedy nie uzywac
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {red.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '12px', color: 'var(--t2)' }}>
            <span style={{ color: '#F87171', flexShrink: 0, marginTop: '1px' }}>✗</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  </div>
)
