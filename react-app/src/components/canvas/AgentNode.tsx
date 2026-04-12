import React, { useState, useCallback } from 'react'
import type { CanvasNode, Agent } from '../../types'
import { AgentIcon } from '../primitives/AgentIcon'
import { getAgentColor } from '../../data/agentColors'
import { useUiStore } from '../../store/uiStore'
import { useSimulationStore } from '../../store/simulationStore'
import { useLLMStore } from '../../store/llmStore'

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
  const { runAgentLLM } = useSimulationStore()
  const { debugMode, apiKey } = useLLMStore()

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const closeCtxMenu = useCallback(() => setCtxMenu(null), [])

  const handleRunLLM = useCallback(() => {
    closeCtxMenu()
    void runAgentLLM(node.id)
  }, [node.id, runAgentLLM, closeCtxMenu])

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
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Agent ${agentDef.name}`}
        aria-pressed={isSelected}
        onMouseDown={onMouseDown}
        onClick={onClick}
        onContextMenu={handleContextMenu}
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

      {/* Context menu */}
      {ctxMenu && (
        <>
          {/* Backdrop to dismiss */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1900 }}
            onClick={closeCtxMenu}
            onContextMenu={(e) => { e.preventDefault(); closeCtxMenu() }}
          />
          <div
            role="menu"
            aria-label="Agent context menu"
            style={{
              position: 'fixed',
              left: ctxMenu.x,
              top: ctxMenu.y,
              zIndex: 2000,
              background: 'var(--bg-panel, rgba(15,15,24,0.97))',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '4px',
              minWidth: '180px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {debugMode && apiKey && (
              <button
                role="menuitem"
                type="button"
                onClick={handleRunLLM}
                style={menuItemStyle}
              >
                <span>🤖</span>
                <span>Run with LLM</span>
              </button>
            )}
            {(!debugMode || !apiKey) && (
              <div style={{ ...menuItemStyle, opacity: 0.5, cursor: 'default', pointerEvents: 'none' } as React.CSSProperties}>
                <span>🤖</span>
                <span>Run with LLM</span>
                <span style={{ fontSize: '10px', color: 'var(--t4)', marginLeft: 'auto' }}>
                  {!apiKey ? 'No key' : 'Debug off'}
                </span>
              </div>
            )}
            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
            <button
              role="menuitem"
              type="button"
              onClick={closeCtxMenu}
              style={{ ...menuItemStyle, color: 'var(--t4)' }}
            >
              <span>✕</span>
              <span>Close</span>
            </button>
          </div>
        </>
      )}
    </>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '7px 10px',
  borderRadius: '6px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  color: 'var(--t1)',
  textAlign: 'left',
}
