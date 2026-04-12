import { describe, it, expect, beforeEach } from 'vitest'
import { useCanvasStore } from '../store/canvasStore'
import type { CanvasNode } from '../types'
import type { PresetDef } from '../data/presets'

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeNode(id: string, agentId = 'orchestrator', x = 0, y = 0): CanvasNode {
  return { id, agentId, x, y, connections: [] }
}

// A minimal preset with two nodes and one connection.
const MINI_PRESET: PresetDef = {
  id: 'mini',
  name: 'Mini',
  cat: 'TEST',
  desc: 'test preset',
  nodes: [
    { id: 'orchestrator', x: 100, y: 100, c: [1] },
    { id: 'backend',      x: 200, y: 200 },
  ],
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

// ─── loadPreset ───────────────────────────────────────────────────────────────

describe('canvasStore – loadPreset', () => {
  it('loads nodes from the preset', () => {
    useCanvasStore.getState().loadPreset(MINI_PRESET)
    expect(useCanvasStore.getState().nodes).toHaveLength(2)
  })

  it('maps preset agent ids to canvas nodes', () => {
    useCanvasStore.getState().loadPreset(MINI_PRESET)
    const agentIds = useCanvasStore.getState().nodes.map((n) => n.agentId)
    expect(agentIds).toContain('orchestrator')
    expect(agentIds).toContain('backend')
  })

  it('creates connection from c index', () => {
    useCanvasStore.getState().loadPreset(MINI_PRESET)
    const conns = useCanvasStore.getState().connections
    expect(conns).toHaveLength(1)
    const nodes = useCanvasStore.getState().nodes
    // The connection should go from orchestrator-node to backend-node
    const orchNode = nodes.find((n) => n.agentId === 'orchestrator')!
    const backNode = nodes.find((n) => n.agentId === 'backend')!
    expect(conns[0]).toEqual({ from: orchNode.id, to: backNode.id })
  })

  it('clears any existing canvas state before loading', () => {
    useCanvasStore.getState().addNode(makeNode('old-node'))
    useCanvasStore.getState().loadPreset(MINI_PRESET)
    // Only the preset nodes remain
    expect(useCanvasStore.getState().nodes).toHaveLength(2)
    expect(useCanvasStore.getState().nodes.find((n) => n.id === 'old-node')).toBeUndefined()
  })

  it('assigns unique ids to each loaded node', () => {
    useCanvasStore.getState().loadPreset(MINI_PRESET)
    const ids = useCanvasStore.getState().nodes.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('preserves x and y coordinates from the preset definition', () => {
    useCanvasStore.getState().loadPreset(MINI_PRESET)
    const orchNode = useCanvasStore.getState().nodes.find((n) => n.agentId === 'orchestrator')!
    expect(orchNode.x).toBe(100)
    expect(orchNode.y).toBe(100)
  })

  it('skips out-of-bounds connection indices without throwing', () => {
    const badPreset: PresetDef = {
      id: 'bad',
      name: 'Bad',
      cat: 'TEST',
      desc: '',
      nodes: [
        { id: 'orchestrator', x: 0, y: 0, c: [99] }, // 99 is out of bounds
        { id: 'backend', x: 100, y: 100 },
      ],
    }
    expect(() => useCanvasStore.getState().loadPreset(badPreset)).not.toThrow()
    expect(useCanvasStore.getState().connections).toHaveLength(0)
  })
})
