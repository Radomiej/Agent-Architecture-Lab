import React, { useMemo } from 'react'
import type { CanvasNode, Connection } from '../../types'

interface ConnectionLayerProps {
  nodes: CanvasNode[]
  connections: Connection[]
}

const NODE_SIZE = 48
const NODE_HALF = NODE_SIZE / 2

export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({ nodes, connections }) => {
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  const paths = useMemo(() =>
    connections.map((conn, i) => {
      const fromNode = nodeMap.get(conn.from)
      const toNode = nodeMap.get(conn.to)
      if (!fromNode || !toNode) return null

      const x1 = fromNode.x + NODE_HALF
      const y1 = fromNode.y + NODE_HALF
      const x2 = toNode.x + NODE_HALF
      const y2 = toNode.y + NODE_HALF

      const dx = x2 - x1
      const dy = y2 - y1
      const cx1 = x1 + dx * 0.4
      const cy1 = y1
      const cx2 = x2 - dx * 0.4
      const cy2 = y2

      const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`

      return { key: i, d, x1, y1, x2, y2 }
    }).filter(Boolean),
  [connections, nodeMap])

  if (paths.length === 0) return null

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 8 3, 0 6"
            fill="rgba(129,140,248,0.5)"
          />
        </marker>
        <filter id="conn-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {paths.map((p) => p && (
        <g key={p.key}>
          {/* Glow layer */}
          <path
            d={p.d}
            fill="none"
            stroke="rgba(129,140,248,0.15)"
            strokeWidth="4"
            filter="url(#conn-glow)"
          />
          {/* Main line */}
          <path
            d={p.d}
            fill="none"
            stroke="rgba(129,140,248,0.45)"
            strokeWidth="1.5"
            strokeDasharray="none"
            markerEnd="url(#arrowhead)"
          />
        </g>
      ))}
    </svg>
  )
}
