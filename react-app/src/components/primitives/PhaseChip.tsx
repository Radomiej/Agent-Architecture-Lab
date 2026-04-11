import React from 'react'
import type { Phase } from '../../types'

const PHASE_COLORS: Record<string, string> = {
  strategy: '#5B8DEF',
  research: '#22C4E6',
  debate1: '#A78BFA',
  debate2: '#A78BFA',
  build: '#34D399',
  qa: '#F87171',
  hitl: '#FBBF24',
}

const PHASE_LABELS: Record<string, string> = {
  strategy: 'Strategia',
  research: 'Research',
  debate1: 'Debata #1',
  debate2: 'Debata #2',
  build: 'Build',
  qa: 'QA',
  hitl: 'HITL',
}

interface PhaseChipProps {
  phase: Phase | string
  small?: boolean
}

export const PhaseChip: React.FC<PhaseChipProps> = ({ phase, small = false }) => {
  const color = PHASE_COLORS[phase] ?? '#8089A0'
  const label = PHASE_LABELS[phase] ?? phase

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: small ? '1px 6px' : '2px 8px',
        borderRadius: '999px',
        fontSize: small ? '10px' : '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color,
        background: `rgba(${hexToRgb(color)}, 0.14)`,
        border: `1px solid rgba(${hexToRgb(color)}, 0.3)`,
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
