import React from 'react'
import type { ModelType } from '../../types'

const MODEL_CONFIG: Record<ModelType, { color: string; label: string; rgb: string }> = {
  opus:   { color: '#F59E0B', label: 'Opus 4.6',   rgb: '245,158,11' },
  sonnet: { color: '#8B5CF6', label: 'Sonnet 4.6', rgb: '139,92,246' },
  haiku:  { color: '#34D399', label: 'Haiku 4.5',  rgb: '52,211,153' },
}

interface ModelBadgeProps {
  model: ModelType
  small?: boolean
}

export const ModelBadge: React.FC<ModelBadgeProps> = ({ model, small = false }) => {
  const cfg = MODEL_CONFIG[model]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: small ? '1px 6px' : '2px 8px',
        borderRadius: '999px',
        fontSize: small ? '10px' : '11px',
        fontWeight: 600,
        color: cfg.color,
        background: `rgba(${cfg.rgb}, 0.12)`,
        border: `1px solid rgba(${cfg.rgb}, 0.25)`,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: cfg.color,
          display: 'inline-block',
        }}
      />
      {cfg.label}
    </span>
  )
}
