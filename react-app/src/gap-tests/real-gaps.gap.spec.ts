import { describe, expect, it, vi } from 'vitest'
import { callAgent } from '../services/llmService'
import type { CanvasNode } from '../types'

describe('real gaps (intentional red tests)', () => {
  it('GAP: should block concurrent pipeline starts to avoid duplicated execution', async () => {
    const callAgentMock = vi.fn()
    const llmState = {
      apiKey: 'test-key',
      baseUrl: 'https://api.cometapi.com/v1',
      modelMap: { opus: 'o', sonnet: 's', haiku: 'h' },
    }
    const canvasState = {
      nodes: [{ id: 'n1', agentId: 'orchestrator', x: 0, y: 0, connections: [] } as CanvasNode],
      connections: [] as { from: string; to: string }[],
    }

    vi.resetModules()
    vi.doMock('../services/llmService', async () => {
      const actual = await vi.importActual('../services/llmService')
      return { ...actual, callAgent: callAgentMock }
    })
    vi.doMock('../store/llmStore', () => ({ useLLMStore: { getState: () => llmState } }))
    vi.doMock('../store/canvasStore', () => ({ useCanvasStore: { getState: () => canvasState } }))

    vi.doMock('../store/orchestrationStore', () => ({
      useOrchestrationStore: { getState: () => ({ reset: vi.fn(), setActiveAgents: vi.fn(), completePhase: vi.fn(), activeAgents: [] }) },
    }))
    vi.doMock('../store/executionHistoryStore', () => ({
      useExecutionHistoryStore: { getState: () => ({ addMessage: vi.fn(), addLogEntry: vi.fn(), updateLogEntry: vi.fn(), clearMessages: vi.fn(), setDebugPanelOpen: vi.fn() }), setState: vi.fn() },
    }))

    const { usePipelineStore } = await import('../store/pipelineStore')

    let resolveFirst: (() => void) | null = null
    callAgentMock
      .mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveFirst = () => resolve({ ok: true, text: 'done-1', latencyMs: 1 })
        }),
      )
      .mockResolvedValueOnce({ ok: true, text: 'done-2', latencyMs: 1 })

    const p1 = usePipelineStore.getState().runPipelineLLM('task', canvasState.nodes, [])
    const p2 = usePipelineStore.getState().runPipelineLLM('task', canvasState.nodes, [])

    const firstResolver = resolveFirst as (() => void) | null
    if (firstResolver) {
      firstResolver()
    }
    await Promise.all([p1, p2])

    // Desired behavior: second pipeline start should be ignored while one is active.
    // Current behavior: second start is allowed, causing duplicate calls.
    expect(callAgentMock).toHaveBeenCalledTimes(1)
  })

  it('GAP: should reconstruct streamed JSON split across network chunks', async () => {
    const encoder = new TextEncoder()
    const chunks = ['data: {"choices":[{"delta":{"content":"Hel', 'lo"}}]}\n', 'data: [DONE]\n']
    let idx = 0

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: async () => {
            if (idx >= chunks.length) return { done: true, value: undefined }
            const value = encoder.encode(chunks[idx])
            idx += 1
            return { done: false, value }
          },
        }),
      },
    }))

    const result = await callAgent({
      agentId: 'orchestrator',
      systemPrompt: 'sys',
      userMessage: 'usr',
      model: 'sonnet',
      apiKey: 'sk-test',
      onChunk: () => undefined,
    })

    // Desired behavior: parser should buffer and emit "Hello".
    // Current behavior: split JSON chunks are dropped as malformed.
    expect(result.text).toBe('Hello')
  })

  it('GAP: should notify user when localStorage migration data is irrecoverably corrupt', async () => {
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
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    localStorageMock.setItem('acV33_custom', '{INVALID_JSON}')
    localStorageMock.setItem('acV32_16_custom', '{INVALID_JSON}')

    vi.resetModules()
    await import('../store/presetStore')

    // Desired behavior: user/dev should be warned about unrecoverable migration data.
    // Current behavior: corruption is silently ignored.
    expect(warnSpy).toHaveBeenCalled()
  })

  it('GAP: should clean up corrupt legacy migration keys after failed parse', async () => {
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
    const removeSpy = vi.spyOn(localStorageMock, 'removeItem')

    localStorageMock.setItem('acV32_16_custom', '{INVALID_JSON}')

    vi.resetModules()
    await import('../store/presetStore')

    // Desired behavior: corrupted legacy keys should be removed during migration
    // to avoid repeatedly parsing bad payloads on every app load.
    // Current behavior: key remains and keeps triggering parse failures.
    expect(removeSpy).toHaveBeenCalledWith('acV32_16_custom')
  })
})
