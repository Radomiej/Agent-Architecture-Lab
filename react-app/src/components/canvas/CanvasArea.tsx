import React, { useRef, useCallback, useState } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import { useUiStore } from '../../store/uiStore'
import { AD_MAP } from '../../data/agents'
import { AgentNode } from './AgentNode'
import { ConnectionLayer } from './ConnectionLayer'
import { useSimulationStore } from '../../store/simulationStore'

const GRID_SIZE = 20

const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE

export const CanvasArea: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const { nodes, connections, selected, zoom, pan, addNode, moveNode, selectNode, clearSelection, setPan, setZoom } = useCanvasStore()
  const { selectAgent } = useUiStore()
  const { activeAgents, completedPhases } = useSimulationStore()

  const [dragging, setDragging] = useState<{ nodeId: string; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const [panning, setPanning] = useState<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const marqueeStart = useRef<{ x: number; y: number } | null>(null)

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current && !(e.target as HTMLElement).classList.contains('canvas-bg')) return
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanning({ startX: e.clientX, startY: e.clientY, originX: pan.x, originY: pan.y })
      return
    }
    if (e.button === 0) {
      clearSelection()
      const rect = canvasRef.current!.getBoundingClientRect()
      const cx = (e.clientX - rect.left - pan.x) / zoom
      const cy = (e.clientY - rect.top - pan.y) / zoom
      marqueeStart.current = { x: cx, y: cy }
    }
  }, [clearSelection, pan, zoom, setPanning])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (panning) {
      setPan({ x: panning.originX + (e.clientX - panning.startX), y: panning.originY + (e.clientY - panning.startY) })
      return
    }
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / zoom
      const dy = (e.clientY - dragging.startY) / zoom
      moveNode(dragging.nodeId, snap(dragging.originX + dx), snap(dragging.originY + dy))
      return
    }
    if (marqueeStart.current) {
      const rect = canvasRef.current!.getBoundingClientRect()
      const cx = (e.clientX - rect.left - pan.x) / zoom
      const cy = (e.clientY - rect.top - pan.y) / zoom
      const mx = Math.min(marqueeStart.current.x, cx)
      const my = Math.min(marqueeStart.current.y, cy)
      const mw = Math.abs(cx - marqueeStart.current.x)
      const mh = Math.abs(cy - marqueeStart.current.y)
      setMarquee({ x: mx, y: my, w: mw, h: mh })
    }
  }, [panning, dragging, zoom, moveNode, setPan, pan])

  const handleMouseUp = useCallback(() => {
    if (marquee && marqueeStart.current) {
      nodes.forEach((node) => {
        if (node.x >= marquee.x && node.x <= marquee.x + marquee.w &&
            node.y >= marquee.y && node.y <= marquee.y + marquee.h) {
          selectNode(node.id, true)
        }
      })
    }
    setDragging(null)
    setPanning(null)
    setMarquee(null)
    marqueeStart.current = null
  }, [marquee, nodes, selectNode])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(zoom * delta)
  }, [zoom, setZoom])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const agentId = e.dataTransfer.getData('agent-id')
    if (!agentId) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = snap((e.clientX - rect.left - pan.x) / zoom)
    const y = snap((e.clientY - rect.top - pan.y) / zoom)
    const id = `${agentId}-${Date.now()}`
    addNode({ id, agentId, x, y, connections: [] })
  }, [addNode, pan, zoom])

  return (
    <main
      ref={canvasRef}
      className="canvas-bg relative flex-1 overflow-hidden"
      style={{
        background: 'var(--bg1)',
        cursor: panning ? 'grabbing' : 'default',
      }}
      id="canvas"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      aria-label="Canvas area"
    >
      {/* Grid dots */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
          backgroundPosition: `${pan.x % (GRID_SIZE * zoom)}px ${pan.y % (GRID_SIZE * zoom)}px`,
        }}
      />

      {/* Transform container */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Connection SVG layer */}
        <ConnectionLayer nodes={nodes} connections={connections} />

        {/* Nodes */}
        {nodes.map((node) => {
          const agentDef = AD_MAP.get(node.agentId)
          if (!agentDef) return null
          return (
            <AgentNode
              key={node.id}
              node={node}
              agentDef={agentDef}
              isSelected={selected.includes(node.id)}
              isActive={activeAgents.includes(node.agentId)}
              isCompleted={completedPhases.includes(agentDef.phase)}
              onMouseDown={(e) => {
                e.stopPropagation()
                selectNode(node.id, e.shiftKey || e.metaKey)
                selectAgent(node.agentId)
                setDragging({ nodeId: node.id, startX: e.clientX, startY: e.clientY, originX: node.x, originY: node.y })
              }}
              onClick={(e) => {
                e.stopPropagation()
                selectAgent(node.agentId)
              }}
            />
          )
        })}
      </div>

      {/* Marquee selection */}
      {marquee && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: marquee.x * zoom + pan.x,
            top: marquee.y * zoom + pan.y,
            width: marquee.w * zoom,
            height: marquee.h * zoom,
            border: '1px dashed var(--accent1)',
            background: 'rgba(129,140,248,0.08)',
          }}
        />
      )}

      {/* Empty state hint */}
      {nodes.length === 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center flex-col gap-2 pointer-events-none text-sm"
          style={{ color: 'var(--t4)' }}
        >
          <span className="text-5xl opacity-30">⬡</span>
          <span>Przeciagnij agenta z lewego panelu na canvas</span>
        </div>
      )}

      {/* Zoom indicator */}
      <div
        className="absolute bottom-3 right-3 text-[11px] px-2 py-0.5 rounded pointer-events-none"
        style={{
          color: 'var(--t4)',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </main>
  )
}
