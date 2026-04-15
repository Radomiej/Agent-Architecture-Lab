/**
 * Tests for canvas localStorage persistence introduced in the MCP/tool-groups feature.
 * Separate from canvasStore.test.ts to isolate localStorage setup.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CanvasNode } from '../types'

// ─── localStorage mock ────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

const LS_KEY = 'acCanvas'

function readCanvas(): {
  nodes: CanvasNode[]
  connections: Array<{ from: string; to: string }>
  zoom: number
  pan: { x: number; y: number }
} | null {
  const raw = localStorageMock.getItem(LS_KEY)
  return raw ? JSON.parse(raw) : null
}

async function freshCanvasStore() {
  vi.resetModules()
  const mod = await import('../store/canvasStore')
  return mod.useCanvasStore
}

function makeNode(id: string, agentId = 'orchestrator', x = 0, y = 0): CanvasNode {
  return { id, agentId, x, y, connections: [] }
}

// ─── reset between tests ──────────────────────────────────────────────────────

beforeEach(() => {
  localStorageMock.clear()
})

// ─── addNode / removeNode ─────────────────────────────────────────────────────

describe('canvasStore persistence – addNode', () => {
  it('writes node to localStorage when node is added', async () => {
    const useStore = await freshCanvasStore()
    useStore.getState().addNode(makeNode('n1', 'orchestrator', 10, 20))
    const saved = readCanvas()
    expect(saved?.nodes).toHaveLength(1)
    expect(saved?.nodes[0].id).toBe('n1')
    expect(saved?.nodes[0].agentId).toBe('orchestrator')
  })

  it('persists position coordinates', async () => {
    const useStore = await freshCanvasStore()
    useStore.getState().addNode(makeNode('n1', 'orchestrator', 42, 77))
    const saved = readCanvas()
    expect(saved?.nodes[0].x).toBe(42)
    expect(saved?.nodes[0].y).toBe(77)
  })
})

describe('canvasStore persistence – removeNode', () => {
  it('removes node from localStorage', async () => {
    const useStore = await freshCanvasStore()
    useStore.getState().addNode(makeNode('n1'))
    useStore.getState().addNode(makeNode('n2'))
    useStore.getState().removeNode('n1')
    const saved = readCanvas()
    expect(saved?.nodes).toHaveLength(1)
    expect(saved?.nodes[0].id).toBe('n2')
  })

  it('removes orphan connections from localStorage', async () => {
    const useStore = await freshCanvasStore()
    useStore.getState().addNode(makeNode('n1'))
    useStore.getState().addNode(makeNode('n2'))
    useStore.getState().addConnection('n1', 'n2')
    useStore.getState().removeNode('n1')
    expect(readCanvas()?.connections).toHaveLength(0)
  })
})

// ─── moveNode ─────────────────────────────────────────────────────────────────

describe('canvasStore persistence – moveNode', () => {
  it('updates persisted positions on move', async () => {
    const useStore = await freshCanvasStore()
    useStore.getState().addNode(makeNode('n1', 'orchestrator', 0, 0))
    useStore.getState().moveNode('n1', 150, 250)
    const saved = readCanvas()
    expect(saved?.nodes[0].x).toBe(150)
    expect(saved?.nodes[0].y).toBe(250)
  })
})

// ─── addConnection / removeConnection ─────────────────────────────────────────

describe('canvasStore persistence – connections', () => {
  it('persists a new connection', async () => {
    const useStore = await freshCanvasStore()
    useStore.getState().addNode(makeNode('n1'))
    useStore.getState().addNode(makeNode('n2'))
    useStore.getState().addConnection('n1', 'n2')
    expect(readCanvas()?.connections).toEqual([{ from: 'n1', to: 'n2' }])
  })

  it('persists removal of a connection', async () => {
    const useStore = await freshCanvasStore()
    useStore.getState().addNode(makeNode('n1'))
    useStore.getState().addNode(makeNode('n2'))
    useStore.getState().addConnection('n1', 'n2')
    useStore.getState().removeConnection('n1', 'n2')
    expect(readCanvas()?.connections).toHaveLength(0)
  })
})

// ─── setZoom / setPan ─────────────────────────────────────────────────────────

describe('canvasStore persistence – zoom and pan', () => {
  it('persists zoom', async () => {
    const useStore = await freshCanvasStore()
    useStore.getState().setZoom(1.75)
    expect(readCanvas()?.zoom).toBe(1.75)
  })

  it('persists pan', async () => {
    const useStore = await freshCanvasStore()
    useStore.getState().setPan({ x: -200, y: 100 })
    expect(readCanvas()?.pan).toEqual({ x: -200, y: 100 })
  })
})

// ─── clearCanvas ─────────────────────────────────────────────────────────────

describe('canvasStore persistence – clearCanvas', () => {
  it('clears localStorage on clearCanvas', async () => {
    const useStore = await freshCanvasStore()
    useStore.getState().addNode(makeNode('n1'))
    useStore.getState().clearCanvas()
    const saved = readCanvas()
    expect(saved?.nodes).toHaveLength(0)
    expect(saved?.connections).toHaveLength(0)
  })
})

// ─── replaceGraph ─────────────────────────────────────────────────────────────

describe('canvasStore persistence – replaceGraph', () => {
  it('persists graph replacement atomically', async () => {
    const useStore = await freshCanvasStore()
    const nodes = [
      makeNode('n1', 'orchestrator', 100, 100),
      makeNode('n2', 'backend', 200, 200),
    ]
    const connections = [{ from: 'n1', to: 'n2' }]

    useStore.getState().replaceGraph(nodes, connections)
    const saved = readCanvas()

    expect(saved?.nodes).toHaveLength(2)
    expect(saved?.connections).toEqual(connections)
    expect(saved?.zoom).toBe(1)
    expect(saved?.pan).toEqual({ x: 0, y: 0 })
  })
})

// ─── load from localStorage on init ──────────────────────────────────────────

describe('canvasStore persistence – init from localStorage', () => {
  it('restores nodes and connections from localStorage on import', async () => {
    // Pre-populate localStorage before importing the store module
    const savedData = {
      nodes: [
        { id: 'n1', agentId: 'orchestrator', x: 10, y: 20, connections: [] },
        { id: 'n2', agentId: 'backend',      x: 30, y: 40, connections: [] },
      ],
      connections: [{ from: 'n1', to: 'n2' }],
      zoom: 1.5,
      pan: { x: -50, y: 25 },
    }
    localStorageMock.setItem(LS_KEY, JSON.stringify(savedData))

    const useStore = await freshCanvasStore()
    expect(useStore.getState().nodes).toHaveLength(2)
    expect(useStore.getState().connections).toHaveLength(1)
    expect(useStore.getState().zoom).toBe(1.5)
    expect(useStore.getState().pan).toEqual({ x: -50, y: 25 })
    // selection is always empty on init
    expect(useStore.getState().selected).toHaveLength(0)
  })

  it('drops nodes with unknown agentId on load', async () => {
    const savedData = {
      nodes: [
        { id: 'n1', agentId: 'orchestrator', x: 0, y: 0, connections: [] },
        { id: 'n2', agentId: 'totally_unknown_agent_xyz', x: 0, y: 0, connections: [] },
      ],
      connections: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
    }
    localStorageMock.setItem(LS_KEY, JSON.stringify(savedData))

    const useStore = await freshCanvasStore()
    expect(useStore.getState().nodes).toHaveLength(1)
    expect(useStore.getState().nodes[0].agentId).toBe('orchestrator')
  })

  it('drops connections that reference non-existent nodes', async () => {
    const savedData = {
      nodes: [
        { id: 'n1', agentId: 'orchestrator', x: 0, y: 0, connections: [] },
      ],
      connections: [
        { from: 'n1', to: 'n2' }, // n2 does not exist
      ],
      zoom: 1,
      pan: { x: 0, y: 0 },
    }
    localStorageMock.setItem(LS_KEY, JSON.stringify(savedData))

    const useStore = await freshCanvasStore()
    expect(useStore.getState().connections).toHaveLength(0)
  })

  it('falls back to empty canvas for malformed localStorage data', async () => {
    localStorageMock.setItem(LS_KEY, '{bad json}}}')
    const useStore = await freshCanvasStore()
    expect(useStore.getState().nodes).toHaveLength(0)
    expect(useStore.getState().connections).toHaveLength(0)
    expect(useStore.getState().zoom).toBe(1)
  })
})
