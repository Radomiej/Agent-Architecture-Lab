import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CanvasNode } from '../types'

const callAgentMock = vi.fn()

const llmState = {
  apiKey: 'test-key',
  baseUrl: 'https://api.cometapi.com/v1',
  modelMap: {
    opus: 'claude-opus-4-5',
    sonnet: 'claude-sonnet-4-5',
    haiku: 'claude-haiku-4-5',
  },
}

const canvasState = {
  nodes: [] as CanvasNode[],
  connections: [] as { from: string; to: string }[],
}

async function freshStore() {
  vi.resetModules()

  vi.doMock('../services/llmService', async () => {
    const actual = await vi.importActual('../services/llmService')
    return {
      ...actual,
      callAgent: callAgentMock,
    }
  })

  vi.doMock('../store/llmStore', () => ({
    useLLMStore: {
      getState: () => llmState,
    },
  }))

  vi.doMock('../store/canvasStore', () => ({
    useCanvasStore: {
      getState: () => canvasState,
    },
  }))

  const { useSimulationStore } = await import('../store/simulationStore')
  return useSimulationStore
}

describe('simulationStore', () => {
  beforeEach(() => {
    callAgentMock.mockReset()
    llmState.apiKey = 'test-key'
    canvasState.nodes = []
    canvasState.connections = []
  })

  it('handles core control actions', async () => {
    const store = await freshStore()

    store.getState().start()
    expect(store.getState().isRunning).toBe(true)
    expect(store.getState().phase).toBe('strategy')

    store.getState().pause()
    expect(store.getState().isPaused).toBe(true)

    store.getState().resume()
    expect(store.getState().isPaused).toBe(false)

    store.getState().nextStep()
    expect(store.getState().step).toBe(1)

    store.getState().completePhase('build')
    expect(store.getState().completedPhases).toContain('build')
    expect(store.getState().phase).toBe('build')

    store.getState().stop()
    expect(store.getState().isRunning).toBe(false)
  })

  it('runAgentLLM returns early when key or node is missing', async () => {
    const store = await freshStore()

    llmState.apiKey = ''
    await store.getState().runAgentLLM('missing-node')
    expect(callAgentMock).not.toHaveBeenCalled()

    llmState.apiKey = 'test-key'
    canvasState.nodes = []
    await store.getState().runAgentLLM('missing-node')
    expect(callAgentMock).not.toHaveBeenCalled()
  })

  it('runAgentLLM streams and finalizes a successful response', async () => {
    const store = await freshStore()

    canvasState.nodes = [{ id: 'n1', agentId: 'orchestrator', x: 0, y: 0, connections: [] }]
    canvasState.connections = []

    callAgentMock.mockImplementation(async (opts: { onChunk?: (chunk: string) => void }) => {
      opts.onChunk?.('Hello ')
      opts.onChunk?.('world')
      return {
        ok: true,
        text: 'Hello world',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        latencyMs: 12,
      }
    })

    await store.getState().runAgentLLM('n1', 'Test Preset')

    const state = store.getState()
    expect(callAgentMock).toHaveBeenCalledTimes(1)
    expect(state.executionLog).toHaveLength(1)
    expect(state.executionLog[0].status).toBe('done')
    expect(state.executionLog[0].responseText).toBe('Hello world')
    expect(state.messages.at(-1)?.text).toBe('Hello world')
    expect(state.activeAgents).toHaveLength(0)
  })

  it('runPipelineLLM processes sequence and resets runtime flags', async () => {
    const store = await freshStore()

    const simulationOrder: CanvasNode[] = [
      { id: 'n1', agentId: 'orchestrator', x: 0, y: 0, connections: [] },
      { id: 'n2', agentId: 'backend', x: 0, y: 0, connections: [] },
    ]
    canvasState.nodes = simulationOrder
    canvasState.connections = [{ from: 'n1', to: 'n2' }]

    callAgentMock
      .mockResolvedValueOnce({ ok: true, text: 'Plan', latencyMs: 10 })
      .mockResolvedValueOnce({ ok: true, text: 'Build result', latencyMs: 10 })

    await store.getState().runPipelineLLM('Build feature X', simulationOrder, canvasState.connections, { loops: 1 })

    const state = store.getState()
    expect(callAgentMock).toHaveBeenCalledTimes(2)
    expect(state.isPipelineRunning).toBe(false)
    expect(state._pipelineAbort).toBeNull()
    expect(state.activeAgents).toHaveLength(0)
    expect(state.completedPhases.length).toBeGreaterThan(0)
    expect(Object.keys(state.agentResults)).toHaveLength(2)
  })

  it('stopPipeline aborts active run and appends stop message', async () => {
    const store = await freshStore()
    const abortController = new AbortController()
    store.setState({ isPipelineRunning: true, _pipelineAbort: abortController, activeAgents: ['n1'] })

    store.getState().stopPipeline()

    const state = store.getState()
    expect(state.isPipelineRunning).toBe(false)
    expect(state._pipelineAbort).toBeNull()
    expect(state.activeAgents).toHaveLength(0)
    expect(state.messages.at(-1)?.text).toContain('Pipeline stopped by user')
  })
})
