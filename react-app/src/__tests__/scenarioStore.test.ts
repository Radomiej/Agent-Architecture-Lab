import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockReplaceGraph = vi.fn()
const mockAddNode = vi.fn()
const mockSaveConfig = vi.fn()
const mockLoadConfig = vi.fn()
const mockDeleteConfig = vi.fn()

vi.mock('../store/canvasStore', () => ({
  useCanvasStore: {
    getState: vi.fn(() => ({
      nodes: [],
      connections: [],
      replaceGraph: mockReplaceGraph,
      addNode: mockAddNode,
    })),
  },
}))

vi.mock('../store/presetStore', () => ({
  usePresetStore: {
    getState: vi.fn(() => ({
      saveConfig: mockSaveConfig,
      loadConfig: mockLoadConfig,
      deleteConfig: mockDeleteConfig,
    })),
  },
}))

async function freshScenarioStore() {
  vi.resetModules()
  const mod = await import('../store/scenarioStore')
  return mod.useScenarioStore
}

describe('scenarioStore architecture', () => {
  beforeEach(() => {
    mockReplaceGraph.mockReset()
    mockAddNode.mockReset()
    mockSaveConfig.mockReset()
    mockLoadConfig.mockReset()
    mockDeleteConfig.mockReset()
  })

  it('saveScenario snapshots current graph and persists it', async () => {
    const { useCanvasStore } = await import('../store/canvasStore')
    vi.mocked(useCanvasStore.getState).mockReturnValue({
      nodes: [{ id: 'n1', agentId: 'orchestrator', x: 0, y: 0, connections: [] }],
      connections: [{ from: 'n1', to: 'n2' }],
      replaceGraph: mockReplaceGraph,
      addNode: mockAddNode,
    } as never)

    const store = await freshScenarioStore()
    const ok = store.getState().saveScenario('plan-a')

    expect(ok).toBe(true)
    expect(mockSaveConfig).toHaveBeenCalledTimes(1)
    expect(mockSaveConfig.mock.calls[0][0]).toBe('plan-a')
    expect(mockSaveConfig.mock.calls[0][1].version).toBe('v33')
  })

  it('restoreScenario uses replaceGraph boundary and never edit mutators', async () => {
    mockLoadConfig.mockReturnValue({
      name: 'saved-a',
      data: {
        nodes: [{ id: 'n1', agentId: 'orchestrator', x: 10, y: 20, connections: [] }],
        connections: [{ from: 'n1', to: 'n2' }],
        version: 'v33',
      },
    })

    const store = await freshScenarioStore()
    const ok = store.getState().restoreScenario('saved-a')

    expect(ok).toBe(true)
    expect(mockReplaceGraph).toHaveBeenCalledTimes(1)
    expect(mockAddNode).not.toHaveBeenCalled()
  })

  it('loadPresetScenario restores via replaceGraph', async () => {
    const store = await freshScenarioStore()

    store.getState().loadPresetScenario({
      id: 'mini',
      name: 'Mini',
      cat: 'TEST',
      desc: '',
      nodes: [
        { id: 'orchestrator', x: 0, y: 0, c: [1] },
        { id: 'backend', x: 100, y: 100 },
      ],
    })

    expect(mockReplaceGraph).toHaveBeenCalledTimes(1)
    const [nodes, connections] = mockReplaceGraph.mock.calls[0]
    expect(nodes).toHaveLength(2)
    expect(connections).toHaveLength(1)
  })

  it('deleteScenario delegates to preset persistence store', async () => {
    const store = await freshScenarioStore()

    store.getState().deleteScenario('to-delete')

    expect(mockDeleteConfig).toHaveBeenCalledWith('to-delete')
  })
})
