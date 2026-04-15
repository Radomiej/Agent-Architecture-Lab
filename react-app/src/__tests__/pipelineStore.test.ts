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

async function freshPipelineStore() {
  vi.resetModules()

  vi.doMock('../services/llmService', async () => {
    const actual = await vi.importActual('../services/llmService')
    return { ...actual, callAgent: callAgentMock }
  })

  vi.doMock('../store/llmStore', () => ({
    useLLMStore: { getState: () => llmState },
  }))

  vi.doMock('../store/canvasStore', () => ({
    useCanvasStore: { getState: () => canvasState },
  }))

  // Provide lightweight stubs for cross-store calls
  vi.doMock('../store/orchestrationStore', () => ({
    useOrchestrationStore: {
      getState: () => ({
        activeAgents: [],
        setActiveAgents: vi.fn(),
        completePhase: vi.fn(),
        reset: vi.fn(),
      }),
    },
  }))

  vi.doMock('../store/executionHistoryStore', () => ({
    useExecutionHistoryStore: {
      getState: () => ({
        addMessage: vi.fn(),
        addLogEntry: vi.fn(),
        updateLogEntry: vi.fn(),
        clearMessages: vi.fn(),
        setDebugPanelOpen: vi.fn(),
      }),
      setState: vi.fn(),
    },
  }))

  const { usePipelineStore } = await import('../store/pipelineStore')
  return usePipelineStore
}

describe('pipelineStore', () => {
  beforeEach(() => {
    callAgentMock.mockReset()
    llmState.apiKey = 'test-key'
    canvasState.nodes = []
    canvasState.connections = []
  })

  it('runAgentLLM returns early when apiKey is missing', async () => {
    const store = await freshPipelineStore()
    llmState.apiKey = ''
    await store.getState().runAgentLLM('missing-node')
    expect(callAgentMock).not.toHaveBeenCalled()
  })

  it('runAgentLLM returns early when node does not exist', async () => {
    const store = await freshPipelineStore()
    canvasState.nodes = []
    await store.getState().runAgentLLM('no-such-node')
    expect(callAgentMock).not.toHaveBeenCalled()
  })

  it('runAgentLLM streams and finalises a successful response', async () => {
    const store = await freshPipelineStore()
    canvasState.nodes = [{ id: 'n1', agentId: 'orchestrator', x: 0, y: 0, connections: [] }]

    callAgentMock.mockImplementation(async (opts: { onChunk?: (c: string) => void }) => {
      opts.onChunk?.('Hello ')
      opts.onChunk?.('world')
      return { ok: true, text: 'Hello world', usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }, latencyMs: 12 }
    })

    await store.getState().runAgentLLM('n1', 'Test Preset')
    expect(callAgentMock).toHaveBeenCalledTimes(1)
  })

  it('runPipelineLLM processes all nodes and resets runtime flags', async () => {
    const store = await freshPipelineStore()

    const order: CanvasNode[] = [
      { id: 'n1', agentId: 'orchestrator', x: 0, y: 0, connections: [] },
      { id: 'n2', agentId: 'backend', x: 0, y: 0, connections: [] },
    ]
    canvasState.nodes = order
    canvasState.connections = [{ from: 'n1', to: 'n2' }]

    callAgentMock
      .mockResolvedValueOnce({ ok: true, text: 'Plan', latencyMs: 10 })
      .mockResolvedValueOnce({ ok: true, text: 'Build result', latencyMs: 10 })

    await store.getState().runPipelineLLM('Build X', order, canvasState.connections, { loops: 1 })

    const state = store.getState()
    expect(callAgentMock).toHaveBeenCalledTimes(2)
    expect(state.isPipelineRunning).toBe(false)
    expect(state._pipelineAbort).toBeNull()
    expect(Object.keys(state.agentResults)).toHaveLength(2)
  })

  it('stopPipeline aborts the run and resets flags', async () => {
    const store = await freshPipelineStore()
    const abort = new AbortController()
    store.setState({ isPipelineRunning: true, _pipelineAbort: abort, loopCount: 2, loopMax: 5 })

    store.getState().stopPipeline()

    const state = store.getState()
    expect(state.isPipelineRunning).toBe(false)
    expect(state._pipelineAbort).toBeNull()
    expect(state.loopCount).toBe(0)
  })
})
