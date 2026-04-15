import { describe, it, expect, beforeEach } from 'vitest'
import { useCanvasStore } from '../store/canvasStore'
import type { CanvasNode } from '../types'

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeNode(id: string, agentId = 'orchestrator', x = 0, y = 0): CanvasNode {
  return { id, agentId, x, y, connections: [] }
}

// ─── reset store between tests ─────────────────────────────────────────────────

beforeEach(() => {
  useCanvasStore.getState().clearCanvas()
})

// ─── addNode ──────────────────────────────────────────────────────────────────

describe('canvasStore – addNode', () => {
  it('appends a node to the empty canvas', () => {
    const node = makeNode('n1')
    useCanvasStore.getState().addNode(node)
    expect(useCanvasStore.getState().nodes).toHaveLength(1)
    expect(useCanvasStore.getState().nodes[0]).toEqual(node)
  })

  it('allows multiple nodes to be added', () => {
    useCanvasStore.getState().addNode(makeNode('n1'))
    useCanvasStore.getState().addNode(makeNode('n2'))
    expect(useCanvasStore.getState().nodes).toHaveLength(2)
  })
})

// ─── removeNode ───────────────────────────────────────────────────────────────

describe('canvasStore – removeNode', () => {
  it('removes the node from the list', () => {
    useCanvasStore.getState().addNode(makeNode('n1'))
    useCanvasStore.getState().addNode(makeNode('n2'))
    useCanvasStore.getState().removeNode('n1')
    const ids = useCanvasStore.getState().nodes.map((n) => n.id)
    expect(ids).toEqual(['n2'])
  })

  it('removes all connections involving the deleted node', () => {
    useCanvasStore.getState().addNode(makeNode('n1'))
    useCanvasStore.getState().addNode(makeNode('n2'))
    useCanvasStore.getState().addConnection('n1', 'n2')
    useCanvasStore.getState().removeNode('n1')
    expect(useCanvasStore.getState().connections).toHaveLength(0)
  })

  it('removes the deleted node from the selection list', () => {
    useCanvasStore.getState().addNode(makeNode('n1'))
    useCanvasStore.getState().selectNode('n1')
    useCanvasStore.getState().removeNode('n1')
    expect(useCanvasStore.getState().selected).toHaveLength(0)
  })

  it('is a no-op for non-existent id', () => {
    useCanvasStore.getState().addNode(makeNode('n1'))
    useCanvasStore.getState().removeNode('n99')
    expect(useCanvasStore.getState().nodes).toHaveLength(1)
  })
})

// ─── moveNode ─────────────────────────────────────────────────────────────────

describe('canvasStore – moveNode', () => {
  it('updates x and y of the target node', () => {
    useCanvasStore.getState().addNode(makeNode('n1', 'orchestrator', 0, 0))
    useCanvasStore.getState().moveNode('n1', 150, 250)
    const node = useCanvasStore.getState().nodes.find((n) => n.id === 'n1')!
    expect(node.x).toBe(150)
    expect(node.y).toBe(250)
  })

  it('does not affect other nodes', () => {
    useCanvasStore.getState().addNode(makeNode('n1', 'orchestrator', 0, 0))
    useCanvasStore.getState().addNode(makeNode('n2', 'backend', 10, 10))
    useCanvasStore.getState().moveNode('n1', 99, 99)
    const n2 = useCanvasStore.getState().nodes.find((n) => n.id === 'n2')!
    expect(n2.x).toBe(10)
    expect(n2.y).toBe(10)
  })
})

// ─── addConnection ────────────────────────────────────────────────────────────

describe('canvasStore – addConnection', () => {
  beforeEach(() => {
    useCanvasStore.getState().addNode(makeNode('n1'))
    useCanvasStore.getState().addNode(makeNode('n2'))
  })

  it('adds a new connection', () => {
    useCanvasStore.getState().addConnection('n1', 'n2')
    expect(useCanvasStore.getState().connections).toHaveLength(1)
    expect(useCanvasStore.getState().connections[0]).toEqual({ from: 'n1', to: 'n2' })
  })

  it('does not add a duplicate connection', () => {
    useCanvasStore.getState().addConnection('n1', 'n2')
    useCanvasStore.getState().addConnection('n1', 'n2')
    expect(useCanvasStore.getState().connections).toHaveLength(1)
  })

  it('allows the reverse direction as a separate connection', () => {
    useCanvasStore.getState().addConnection('n1', 'n2')
    useCanvasStore.getState().addConnection('n2', 'n1')
    expect(useCanvasStore.getState().connections).toHaveLength(2)
  })
})

// ─── removeConnection ─────────────────────────────────────────────────────────

describe('canvasStore – removeConnection', () => {
  it('removes a specific connection', () => {
    useCanvasStore.getState().addNode(makeNode('n1'))
    useCanvasStore.getState().addNode(makeNode('n2'))
    useCanvasStore.getState().addNode(makeNode('n3'))
    useCanvasStore.getState().addConnection('n1', 'n2')
    useCanvasStore.getState().addConnection('n1', 'n3')
    useCanvasStore.getState().removeConnection('n1', 'n2')
    const conns = useCanvasStore.getState().connections
    expect(conns).toHaveLength(1)
    expect(conns[0]).toEqual({ from: 'n1', to: 'n3' })
  })

  it('is a no-op if connection does not exist', () => {
    useCanvasStore.getState().addNode(makeNode('n1'))
    useCanvasStore.getState().addNode(makeNode('n2'))
    useCanvasStore.getState().addConnection('n1', 'n2')
    useCanvasStore.getState().removeConnection('n2', 'n1') // reversed — does not exist
    expect(useCanvasStore.getState().connections).toHaveLength(1)
  })
})

// ─── selectNode ───────────────────────────────────────────────────────────────

describe('canvasStore – selectNode', () => {
  beforeEach(() => {
    useCanvasStore.getState().addNode(makeNode('n1'))
    useCanvasStore.getState().addNode(makeNode('n2'))
  })

  it('single-selects a node by default', () => {
    useCanvasStore.getState().selectNode('n1')
    useCanvasStore.getState().selectNode('n2')
    expect(useCanvasStore.getState().selected).toEqual(['n2'])
  })

  it('multi-selects when multi=true', () => {
    useCanvasStore.getState().selectNode('n1', true)
    useCanvasStore.getState().selectNode('n2', true)
    expect(useCanvasStore.getState().selected).toContain('n1')
    expect(useCanvasStore.getState().selected).toContain('n2')
  })

  it('deselects an already-selected node when multi=true', () => {
    useCanvasStore.getState().selectNode('n1', true)
    useCanvasStore.getState().selectNode('n1', true)
    expect(useCanvasStore.getState().selected).not.toContain('n1')
  })
})

// ─── selectAll / clearSelection ───────────────────────────────────────────────

describe('canvasStore – selectAll / clearSelection', () => {
  it('selectAll selects every node on the canvas', () => {
    useCanvasStore.getState().addNode(makeNode('n1'))
    useCanvasStore.getState().addNode(makeNode('n2'))
    useCanvasStore.getState().addNode(makeNode('n3'))
    useCanvasStore.getState().selectAll()
    expect(useCanvasStore.getState().selected.sort()).toEqual(['n1', 'n2', 'n3'])
  })

  it('clearSelection empties the selection', () => {
    useCanvasStore.getState().addNode(makeNode('n1'))
    useCanvasStore.getState().selectNode('n1')
    useCanvasStore.getState().clearSelection()
    expect(useCanvasStore.getState().selected).toHaveLength(0)
  })
})

// ─── setZoom ──────────────────────────────────────────────────────────────────

describe('canvasStore – setZoom', () => {
  it('sets the zoom value', () => {
    useCanvasStore.getState().setZoom(1.5)
    expect(useCanvasStore.getState().zoom).toBe(1.5)
  })

  it('clamps to minimum 0.2', () => {
    useCanvasStore.getState().setZoom(0.01)
    expect(useCanvasStore.getState().zoom).toBe(0.2)
  })

  it('clamps to maximum 3', () => {
    useCanvasStore.getState().setZoom(99)
    expect(useCanvasStore.getState().zoom).toBe(3)
  })
})

// ─── setPan ───────────────────────────────────────────────────────────────────

describe('canvasStore – setPan', () => {
  it('updates pan coordinates', () => {
    useCanvasStore.getState().setPan({ x: 123, y: -456 })
    expect(useCanvasStore.getState().pan).toEqual({ x: 123, y: -456 })
  })
})

// ─── clearCanvas ──────────────────────────────────────────────────────────────

describe('canvasStore – clearCanvas', () => {
  it('removes all nodes, connections and selection', () => {
    useCanvasStore.getState().addNode(makeNode('n1'))
    useCanvasStore.getState().addNode(makeNode('n2'))
    useCanvasStore.getState().addConnection('n1', 'n2')
    useCanvasStore.getState().selectNode('n1')
    useCanvasStore.getState().clearCanvas()
    const s = useCanvasStore.getState()
    expect(s.nodes).toHaveLength(0)
    expect(s.connections).toHaveLength(0)
    expect(s.selected).toHaveLength(0)
  })
})

// ─── replaceGraph ─────────────────────────────────────────────────────────────

describe('canvasStore – replaceGraph', () => {
  it('replaces nodes and connections in a single operation', () => {
    useCanvasStore.getState().addNode(makeNode('old-node'))

    const nodes = [
      makeNode('n1', 'orchestrator', 100, 100),
      makeNode('n2', 'backend', 200, 200),
    ]
    const connections = [{ from: 'n1', to: 'n2' }]

    useCanvasStore.getState().replaceGraph(nodes, connections)

    const state = useCanvasStore.getState()
    expect(state.nodes).toHaveLength(2)
    expect(state.connections).toEqual(connections)
    expect(state.nodes.find((n) => n.id === 'old-node')).toBeUndefined()
  })

  it('clears selection and resets viewport when replacing graph', () => {
    useCanvasStore.getState().addNode(makeNode('n1'))
    useCanvasStore.getState().selectNode('n1')
    useCanvasStore.getState().setZoom(1.8)
    useCanvasStore.getState().setPan({ x: 77, y: -33 })

    useCanvasStore.getState().replaceGraph([], [])

    const state = useCanvasStore.getState()
    expect(state.selected).toHaveLength(0)
    expect(state.zoom).toBe(1)
    expect(state.pan).toEqual({ x: 0, y: 0 })
  })
})
