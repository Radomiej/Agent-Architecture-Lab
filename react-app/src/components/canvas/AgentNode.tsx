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

const MODEL_BADGE_COLORS: Record<string, string> = {
  opus: '#F59E0B',
  sonnet: '#8B5CF6',
  haiku: '#34D399',
}

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
          className="absolute text-[9px] font-semibold text-center pointer-events-none overflow-hidden text-ellipsis whitespace-nowrap"
          style={{
            top: NODE_SIZE + 4,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 80,
            color: 'var(--t2)',
          }}
        >
          {agentDef.name}
        </div>

        {/* Model badge below name */}
        <div
          className="absolute text-[7px] font-bold uppercase text-center pointer-events-none tracking-widest"
          style={{
            top: NODE_SIZE + 17,
            left: '50%',
            transform: 'translateX(-50%)',
            color: MODEL_BADGE_COLORS[agentDef.model] ?? 'var(--t4)',
            opacity: 0.7,
          }}
        >
          {agentDef.model}
        </div>

        {/* Completed checkmark */}
        {isCompleted && (
          <div
            className="absolute flex items-center justify-center text-[8px] font-bold rounded-full"
            style={{
              top: -6,
              right: -6,
              width: 14,
              height: 14,
              background: '#34D399',
              color: '#000',
            }}
          >
            ✓
          </div>
        )}

        {/* Active pulse ring */}
        {isActive && (
          <div
            className="absolute inset-[-4px] pointer-events-none"
            style={{
              borderRadius: '18px',
              border: '1.5px solid rgba(52,211,153,0.4)',
              animation: 'pulse-ring 1.5s ease-in-out infinite',
            }}
          />
        )}

        {/* Tool activity indicator */}
        {isActive && (
          <div
            className="absolute pointer-events-none text-[8px]"
            style={{
              top: -8,
              left: -8,
              animation: 'spin 1s linear infinite',
            }}
          >
            🔧
          </div>
        )}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <>
          {/* Backdrop to dismiss */}
          <div
            className="fixed inset-0 z-[1900]"
            onClick={closeCtxMenu}
            onContextMenu={(e) => { e.preventDefault(); closeCtxMenu() }}
          />
          <div
            role="menu"
            aria-label="Agent context menu"
            className="fixed z-[2000] rounded-lg p-1 min-w-[180px]"
            style={{
              left: ctxMenu.x,
              top: ctxMenu.y,
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {debugMode && apiKey && (
              <button
                role="menuitem"
                type="button"
                onClick={handleRunLLM}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md border-0 bg-transparent cursor-pointer text-sm text-left hover:bg-[var(--state-hover)]"
                style={{ color: 'var(--t1)' }}
              >
                <span>🤖</span>
                <span>Run with LLM</span>
              </button>
            )}
            {(!debugMode || !apiKey) && (
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 text-sm opacity-50 select-none"
                style={{ color: 'var(--t1)' }}
              >
                <span>🤖</span>
                <span>Run with LLM</span>
                <span className="text-[10px] ml-auto" style={{ color: 'var(--t4)' }}>
                  {!apiKey ? 'No key' : 'Debug off'}
                </span>
              </div>
            )}
            <div className="h-px my-1" style={{ background: 'var(--border)' }} />
            <button
              role="menuitem"
              type="button"
              onClick={closeCtxMenu}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md border-0 bg-transparent cursor-pointer text-sm text-left hover:bg-[var(--state-hover)]"
              style={{ color: 'var(--t4)' }}
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
