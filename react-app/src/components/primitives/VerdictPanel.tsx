import React from 'react'

interface VerdictPanelProps {
  green: string[]
  red: string[]
  greenLabel?: string
  redLabel?: string
}

export const VerdictPanel: React.FC<VerdictPanelProps> = ({
  green,
  red,
  greenLabel = 'WHEN TO USE',
  redLabel = 'WHEN NOT TO USE',
}) => (
  <div className="grid grid-cols-2 gap-2 mt-2">
    <div
      className="rounded-lg p-2.5"
      style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
    >
      <div className="text-[11px] font-bold uppercase tracking-[0.04em] mb-1.5" style={{ color: '#34D399' }}>
        {greenLabel}
      </div>
      <ul className="m-0 p-0 list-none flex flex-col gap-1">
        {green.map((item, i) => (
          <li key={i} className="flex gap-1.5 items-start text-xs" style={{ color: 'var(--t2)' }}>
            <span className="shrink-0 mt-px" style={{ color: '#34D399' }}>✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>

    <div
      className="rounded-lg p-2.5"
      style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
    >
      <div className="text-[11px] font-bold uppercase tracking-[0.04em] mb-1.5" style={{ color: '#F87171' }}>
        {redLabel}
      </div>
      <ul className="m-0 p-0 list-none flex flex-col gap-1">
        {red.map((item, i) => (
          <li key={i} className="flex gap-1.5 items-start text-xs" style={{ color: 'var(--t2)' }}>
            <span className="shrink-0 mt-px" style={{ color: '#F87171' }}>✗</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  </div>
)

