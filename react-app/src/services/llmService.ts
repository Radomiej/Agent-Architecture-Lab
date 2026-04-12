import type { ModelType } from '../types'

/** Default model IDs used when no override is configured */
export const DEFAULT_MODEL_MAP: Record<ModelType, string> = {
  opus: 'claude-opus-4-5',
  sonnet: 'claude-sonnet-4-5',
  haiku: 'claude-haiku-4-5',
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
    baseUrl = 'https://api.cometapi.com/v1',
    modelMap = DEFAULT_MODEL_MAP,
    onChunk,
    signal,
  } = opts

  const modelId = modelMap[model] ?? DEFAULT_MODEL_MAP[model]
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
  const startMs = Date.now()

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        stream: !!onChunk,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 512,
        temperature: 0.7,
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
  baseUrl = 'https://api.cometapi.com/v1',
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
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
