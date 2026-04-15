import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  callAgent,
  callWebSearch,
  COMETAPI_BASE_URL,
  fetchModelCatalog,
  OPENROUTER_BASE_URL,
  PERPLEXITY_BASE_URL,
  testConnection,
  testWebSearchConnection,
} from '../services/llmService'

function makeStreamResponse(chunks: string[]) {
  const encoder = new TextEncoder()
  let index = 0

  return {
    getReader: () => ({
      read: async () => {
        if (index >= chunks.length) {
          return { done: true, value: undefined }
        }
        const value = encoder.encode(chunks[index])
        index += 1
        return { done: false, value }
      },
    }),
  }
}

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

beforeEach(() => {
  localStorageMock.clear()
  vi.stubGlobal('localStorage', localStorageMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('llmService.callAgent', () => {
  it('returns parsed non-streaming result on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Final answer' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    }))

    const result = await callAgent({
      agentId: 'orchestrator',
      systemPrompt: 'sys',
      userMessage: 'usr',
      model: 'sonnet',
      apiKey: 'sk-test',
      baseUrl: COMETAPI_BASE_URL,
    })

    expect(result.ok).toBe(true)
    expect(result.text).toBe('Final answer')
    expect(result.usage?.totalTokens).toBe(15)
  })

  it('returns HTTP error payload when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    }))

    const result = await callAgent({
      agentId: 'orchestrator',
      systemPrompt: 'sys',
      userMessage: 'usr',
      model: 'sonnet',
      apiKey: 'bad-key',
    })

    expect(result.ok).toBe(false)
    expect(result.statusCode).toBe(401)
    expect(result.error).toBe('Unauthorized')
  })

  it('streams chunks and ignores malformed SSE lines', async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello "}}]}\n',
      'data: {BROKEN JSON\n',
      'data: {"choices":[{"delta":{"content":"world"}}],"usage":{"prompt_tokens":1,"completion_tokens":2,"total_tokens":3}}\n',
      'data: [DONE]\n',
    ]

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: makeStreamResponse(chunks),
    }))

    const collected: string[] = []
    const result = await callAgent({
      agentId: 'orchestrator',
      systemPrompt: 'sys',
      userMessage: 'usr',
      model: 'sonnet',
      apiKey: 'sk-test',
      onChunk: (c) => collected.push(c),
    })

    expect(result.ok).toBe(true)
    expect(result.text).toBe('Hello world')
    expect(collected.join('')).toBe('Hello world')
    expect(result.usage?.totalTokens).toBe(3)
  })

  it('maps AbortError to a stable message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError')))

    const result = await callAgent({
      agentId: 'orchestrator',
      systemPrompt: 'sys',
      userMessage: 'usr',
      model: 'sonnet',
      apiKey: 'sk-test',
    })

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Request aborted')
  })

  it('testConnection returns ok for healthy /models response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
    }))

    const result = await testConnection('sk-test', OPENROUTER_BASE_URL)
    expect(result).toEqual({ ok: true })
  })

  it('testConnection returns message for non-200 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Too Many Requests',
    }))

    const result = await testConnection('sk-test', COMETAPI_BASE_URL)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Too Many Requests')
  })

  it('callWebSearch fails early when tool is disabled or key missing', async () => {
    const result = await callWebSearch({
      query: 'latest js news',
      config: {
        enabled: false,
        provider: 'openrouter',
        apiKey: '',
        model: 'sonar-pro',
      },
    })

    expect(result.ok).toBe(false)
    expect(result.error).toContain('not enabled')
  })

  it('callWebSearch routes to OpenRouter Sonar model', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Search result' } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await callWebSearch({
      query: 'state of ai',
      config: {
        enabled: true,
        provider: 'openrouter',
        apiKey: 'sk-or-key',
        model: 'sonar-reasoning',
      },
    })

    expect(result.ok).toBe(true)
    expect(result.text).toBe('Search result')
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(payload.model).toBe('perplexity/sonar-reasoning')
    expect(fetchMock.mock.calls[0][0]).toContain(OPENROUTER_BASE_URL)
  })

  it('testWebSearchConnection switches endpoint by provider and validates key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const missingKey = await testWebSearchConnection({ provider: 'openrouter', apiKey: '' })
    expect(missingKey.ok).toBe(false)

    const openRouter = await testWebSearchConnection({ provider: 'openrouter', apiKey: 'sk-or' })
    expect(openRouter.ok).toBe(true)

    const perplexity = await testWebSearchConnection({ provider: 'perplexity', apiKey: 'pplx' })
    expect(perplexity.ok).toBe(true)

    expect(String(fetchMock.mock.calls[0][0])).toContain(OPENROUTER_BASE_URL)
    expect(String(fetchMock.mock.calls[1][0])).toContain(PERPLEXITY_BASE_URL)
  })

  it('fetchModelCatalog normalizes /models payload and caches it', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 'anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5', context_length: 1_000_000, pricing: { prompt: '0.000003', completion: '0.000015' } },
          { id: 'openai/gpt-4o', name: 'GPT-4o', context_length: 128000 },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const first = await fetchModelCatalog('sk-or-test', OPENROUTER_BASE_URL)
    expect(first.ok).toBe(true)
    expect(first.fromCache).toBe(false)
    expect(first.models[0].id).toBe('anthropic/claude-sonnet-4-5')
    expect(first.models[0].promptPricePerToken).toBe(0.000003)

    const second = await fetchModelCatalog('sk-or-test', OPENROUTER_BASE_URL)
    expect(second.ok).toBe(true)
    expect(second.fromCache).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('fetchModelCatalog falls back to cached models when refresh fails', async () => {
    const fetchOk = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'claude-sonnet-4-5' }] }),
    })
    vi.stubGlobal('fetch', fetchOk)
    await fetchModelCatalog('sk-test', COMETAPI_BASE_URL)

    const fetchFail = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'server failure',
    })
    vi.stubGlobal('fetch', fetchFail)

    const result = await fetchModelCatalog('sk-test', COMETAPI_BASE_URL, { forceRefresh: true })
    expect(result.ok).toBe(true)
    expect(result.fromCache).toBe(true)
    expect(result.models[0].id).toBe('claude-sonnet-4-5')
    expect(result.error).toBe('server failure')
  })
})
