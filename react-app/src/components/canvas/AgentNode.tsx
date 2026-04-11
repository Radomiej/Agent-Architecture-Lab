import React from 'react'
import type { CanvasNode, Agent } from '../../types'
import { AgentIcon } from '../primitives/AgentIcon'
import { getAgentColor } from '../../data/agentColors'
import { useUiStore } from '../../store/uiStore'

interface AgentNodeProps {
  node: CanvasNode
  agentDef: Agent
  isSelected: boolean
  isActive: boolean
  isCompleted: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void
}

const NODE_SIZE = 48

export const AgentNode: React.FC<AgentNodeProps> = ({
  node,
  agentDef,
  isSelected,
  isActive,
  isCompleted,
  onMouseDown,
  onClick,
}) => {
  const theme = useUiStore((s) => s.theme)
  const color = getAgentColor(agentDef.id, theme)

  const borderColor = isSelected
    ? color
    : isActive
    ? '#34D399'
    : isCompleted
    ? 'rgba(52,211,153,0.3)'
    : `rgba(${hexToRgb(color)},0.3)`

  const bgColor = isSelected
    ? `rgba(${hexToRgb(color)},0.2)`
    : `rgba(${hexToRgb(color)},0.1)`

  const shadow = isSelected
    ? `0 0 0 2px ${color}, 0 8px 20px rgba(0,0,0,0.4)`
    : isActive
    ? `0 0 12px rgba(52,211,153,0.4)`
    : '0 4px 12px rgba(0,0,0,0.3)'

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Agent ${agentDef.name}`}
      aria-pressed={isSelected}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick(e as unknown as React.MouseEvent)
      }}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: NODE_SIZE,
        height: NODE_SIZE,
        borderRadius: '14px',
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        boxShadow: shadow,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        animation: isActive ? 'breathe 1.5s ease-in-out infinite' : undefined,
        opacity: isCompleted ? 0.6 : 1,
      }}
    >
      <AgentIcon id={agentDef.id} size={22} color={isCompleted ? '#34D399' : color} />

      {/* Label below node */}
      <div
        style={{
          position: 'absolute',
          top: NODE_SIZE + 4,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '9px',
          fontWeight: 600,
          color: 'var(--t2)',
          whiteSpace: 'nowrap',
          maxWidth: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {agentDef.name}
      </div>

      {/* Completed checkmark */}
      {isCompleted && (
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#34D399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            color: '#000',
            fontWeight: 700,
          }}
        >
          ✓
        </div>
      )}

      {/* Active pulse ring */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '18px',
            border: '1.5px solid rgba(52,211,153,0.4)',
            animation: 'pulse-ring 1.5s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
