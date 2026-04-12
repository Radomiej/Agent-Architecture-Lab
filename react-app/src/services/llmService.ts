import type { ModelType, WebSearchConfig, SonarModelId } from '../types'

// ─── Provider constants ────────────────────────────────────────────────────────

export const COMETAPI_BASE_URL = 'https://api.cometapi.com/v1'
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
export const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai'

/** OpenRouter requires these headers for attribution */
const OPENROUTER_HEADERS = {
  'HTTP-Referer': 'https://radomiej.github.io/Agent-Architecture-Lab/',
  'X-Title': 'Agent Architecture Designer',
}

/** Default model IDs for CometAPI */
export const DEFAULT_MODEL_MAP: Record<ModelType, string> = {
  opus: 'claude-opus-4-5',
  sonnet: 'claude-sonnet-4-5',
  haiku: 'claude-haiku-4-5',
}

/** Default model IDs for OpenRouter (same models, different namespace) */
export const OPENROUTER_DEFAULT_MODEL_MAP: Record<ModelType, string> = {
  opus: 'anthropic/claude-opus-4-5',
  sonnet: 'anthropic/claude-sonnet-4-5',
  haiku: 'anthropic/claude-haiku-4-5',
}

/** Resolve model ID for a given OpenRouter Sonar model */
export function resolveOpenRouterSonarId(model: SonarModelId): string {
  return `perplexity/${model}`
}

export interface LLMUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface LLMResult {
  ok: boolean
  text: string
  usage?: LLMUsage
  error?: string
  statusCode?: number
  latencyMs: number
}

export interface LLMCallOptions {
  agentId: string
  systemPrompt: string
  userMessage: string
  model: ModelType
  apiKey: string
  baseUrl?: string
  modelMap?: Record<ModelType, string>
  /** Called with each streamed text chunk */
  onChunk?: (chunk: string) => void
  /** AbortSignal to cancel the request */
  signal?: AbortSignal
}

/**
 * Call CometAPI (OpenAI-compatible) with streaming support.
 * Returns a typed LLMResult. Never throws — errors are returned as ok:false.
 */
export async function callAgent(opts: LLMCallOptions): Promise<LLMResult> {
  const {
    systemPrompt,
    userMessage,
    model,
    apiKey,
    baseUrl = COMETAPI_BASE_URL,
    modelMap = DEFAULT_MODEL_MAP,
    onChunk,
    signal,
  } = opts

  const modelId = modelMap[model] ?? DEFAULT_MODEL_MAP[model]
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
  const startMs = Date.now()

  // Inject OpenRouter attribution headers when routing through openrouter.ai
  const extraHeaders = baseUrl.includes('openrouter.ai') ? OPENROUTER_HEADERS : {}

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model: modelId,
        stream: !!onChunk,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 512,
        temperature: 0,
      }),
      signal,
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      return {
        ok: false,
        text: '',
        error: errText || `HTTP ${response.status}`,
        statusCode: response.status,
        latencyMs: Date.now() - startMs,
      }
    }

    // --- Streaming path ---
    if (onChunk && response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let usage: LLMUsage | undefined

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const raw = decoder.decode(value, { stream: true })
        const lines = raw.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data) as {
              choices?: { delta?: { content?: string } }[]
              usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
            }
            const chunk = parsed.choices?.[0]?.delta?.content ?? ''
            if (chunk) {
              fullText += chunk
              onChunk(chunk)
            }
            if (parsed.usage) {
              usage = {
                promptTokens: parsed.usage.prompt_tokens ?? 0,
                completionTokens: parsed.usage.completion_tokens ?? 0,
                totalTokens: parsed.usage.total_tokens ?? 0,
              }
            }
          } catch {
            // Malformed SSE chunk — skip silently
          }
        }
      }

      return { ok: true, text: fullText, usage, latencyMs: Date.now() - startMs }
    }

    // --- Non-streaming path ---
    const json = await response.json() as {
      choices?: { message?: { content?: string } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    }
    const text = json.choices?.[0]?.message?.content ?? ''
    const usage: LLMUsage | undefined = json.usage
      ? {
          promptTokens: json.usage.prompt_tokens ?? 0,
          completionTokens: json.usage.completion_tokens ?? 0,
          totalTokens: json.usage.total_tokens ?? 0,
        }
      : undefined

    return { ok: true, text, usage, latencyMs: Date.now() - startMs }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, text: '', error: 'Request aborted', latencyMs: Date.now() - startMs }
    }
    return {
      ok: false,
      text: '',
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - startMs,
    }
  }
}

/**
 * Test the API connection by fetching /v1/models.
 * Returns { ok: true } on success or { ok: false, error } on failure.
 */
export async function testConnection(
  apiKey: string,
  baseUrl = COMETAPI_BASE_URL,
): Promise<{ ok: boolean; error?: string }> {
  const extra = baseUrl.includes('openrouter.ai') ? OPENROUTER_HEADERS : {}
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
      headers: { Authorization: `Bearer ${apiKey}`, ...extra },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      return { ok: false, error: errText || `HTTP ${response.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ─── Web Search Tool ───────────────────────────────────────────────────────────

export interface WebSearchCallOptions {
  query: string
  config: WebSearchConfig
  /** Called with each streamed text chunk */
  onChunk?: (chunk: string) => void
  signal?: AbortSignal
}

/**
 * Call the Web Search tool via Perplexity (direct) or OpenRouter (Sonar).
 * Uses the Sonar model configured in WebSearchConfig.
 * Never throws — errors returned as ok:false.
 */
export async function callWebSearch(opts: WebSearchCallOptions): Promise<LLMResult> {
  const { query, config, onChunk, signal } = opts

  if (!config.enabled || !config.apiKey) {
    return { ok: false, text: '', error: 'Web search is not enabled or API key is missing', latencyMs: 0 }
  }

  let baseUrl: string
  let modelId: string

  if (config.provider === 'openrouter') {
    baseUrl = OPENROUTER_BASE_URL
    modelId = resolveOpenRouterSonarId(config.model)
  } else {
    // Perplexity direct
    baseUrl = PERPLEXITY_BASE_URL
    modelId = config.model
  }

  // Reuse callAgent's streaming/non-streaming logic by forwarding to fetch directly
  return callAgent({
    agentId: '__web_search__',
    systemPrompt: 'You are a helpful web search assistant. Search the web for up-to-date information and provide a concise, accurate answer with sources.',
    userMessage: query,
    model: 'sonnet', // tier doesn't matter here; we override via modelMap below
    apiKey: config.apiKey,
    baseUrl,
    modelMap: { opus: modelId, sonnet: modelId, haiku: modelId },
    onChunk,
    signal,
  })
}

/**
 * Test the Web Search tool connection.
 */
export async function testWebSearchConnection(
  config: Pick<WebSearchConfig, 'provider' | 'apiKey'>,
): Promise<{ ok: boolean; error?: string }> {
  if (!config.apiKey) return { ok: false, error: 'No API key provided' }

  if (config.provider === 'openrouter') {
    return testConnection(config.apiKey, OPENROUTER_BASE_URL)
  }
  // Perplexity: /models endpoint
  return testConnection(config.apiKey, PERPLEXITY_BASE_URL)
}
