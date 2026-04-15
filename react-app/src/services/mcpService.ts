/**
 * Docker MCP Gateway client — Streamable HTTP transport (2025-03-26)
 *
 * Supports the new MCP Streamable HTTP spec:
 *   POST /mcp  → initialize / tool calls
 *   Response: application/json or text/event-stream (SSE)
 *
 * Security: bearer token never leaves the browser; sent directly to localhost gateway.
 */

export interface McpToolDef {
  name: string
  description?: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, { type: string; description?: string }>
    required?: string[]
  }
}

export interface McpCallResult {
  ok: boolean
  content: McpContent[]
  error?: string
  isError?: boolean
}

export interface McpContent {
  type: 'text' | 'image' | 'resource'
  text?: string
  data?: string
  mimeType?: string
}

// ─── Internal JSON-RPC helpers ────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params?: unknown
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0'
  id: number
  result?: T
  error?: { code: number; message: string; data?: unknown }
}

let _idCounter = 1
function nextId(): number {
  return _idCounter++
}

function buildRequest(method: string, params?: unknown): JsonRpcRequest {
  return { jsonrpc: '2.0' as const, id: nextId(), method, params }
}

// ─── MCP Session ──────────────────────────────────────────────────────────────

export interface McpSessionConfig {
  gatewayUrl: string   // e.g. "http://localhost:8808/mcp"
  bearerToken?: string
}

export class McpSession {
  private sessionId: string | null = null
  private config: McpSessionConfig

  constructor(config: McpSessionConfig) {
    this.config = config
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'MCP-Protocol-Version': '2025-03-26',
      ...extra,
    }
    if (this.config.bearerToken) {
      h['Authorization'] = `Bearer ${this.config.bearerToken}`
    }
    if (this.sessionId) {
      h['Mcp-Session-Id'] = this.sessionId
    }
    return h
  }

  /** Parse response — handles both application/json and text/event-stream */
  private async parseResponse<T>(resp: Response): Promise<JsonRpcResponse<T>> {
    const ct = resp.headers.get('Content-Type') ?? ''
    if (ct.includes('text/event-stream')) {
      // Read the SSE stream and collect the first JSON-RPC response
      const reader = resp.body?.getReader()
      if (!reader) throw new Error('No response body')
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6)) as JsonRpcResponse<T>
              if (parsed.id !== undefined) {
                reader.cancel()
                return parsed
              }
            } catch { /* ignore non-json data lines */ }
          }
        }
        buffer = lines[lines.length - 1]
      }
      throw new Error('SSE stream ended without a JSON-RPC response')
    }
    return resp.json() as Promise<JsonRpcResponse<T>>
  }

  /** Send a JSON-RPC request, return parsed response */
  private async send<T>(req: JsonRpcRequest): Promise<JsonRpcResponse<T>> {
    const resp = await fetch(this.config.gatewayUrl, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)
    }

    // Capture session ID on first response
    const sid = resp.headers.get('Mcp-Session-Id')
    if (sid) this.sessionId = sid

    return this.parseResponse<T>(resp)
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Initialize session with the gateway. Returns server info. */
  async initialize(): Promise<{ serverName: string; serverVersion: string }> {
    const req = buildRequest('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'agent-architecture-designer', version: '33.0' },
    })
    const res = await this.send<{
      serverInfo: { name: string; version: string }
      protocolVersion: string
    }>(req)

    if (res.error) throw new Error(res.error.message)

    // Send initialized notification (no response expected)
    const notif = { jsonrpc: '2.0' as const, method: 'notifications/initialized', params: {} }
    await fetch(this.config.gatewayUrl, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(notif),
    }).catch(() => { /* notification — ignore errors */ })

    return {
      serverName: res.result?.serverInfo?.name ?? 'docker-mcp-gateway',
      serverVersion: res.result?.serverInfo?.version ?? '?',
    }
  }

  /** List all tools available via the gateway */
  async listTools(): Promise<McpToolDef[]> {
    const req = buildRequest('tools/list')
    const res = await this.send<{ tools: McpToolDef[] }>(req)
    if (res.error) throw new Error(res.error.message)
    return res.result?.tools ?? []
  }

  /** Call a tool with given arguments */
  async callTool(name: string, args: Record<string, unknown>): Promise<McpCallResult> {
    const req = buildRequest('tools/call', { name, arguments: args })
    const res = await this.send<{ content: McpContent[]; isError?: boolean }>(req)
    if (res.error) {
      return { ok: false, content: [], error: res.error.message }
    }
    return {
      ok: !(res.result?.isError),
      content: res.result?.content ?? [],
      isError: res.result?.isError,
    }
  }

  /** Terminate the session */
  async terminate(): Promise<void> {
    if (!this.sessionId) return
    await fetch(this.config.gatewayUrl, {
      method: 'DELETE',
      headers: this.headers(),
    }).catch(() => { /* best-effort */ })
    this.sessionId = null
  }
}

// ─── Convenience: one-shot tool call (auto-initializes, auto-terminates) ──────

export async function mcpOneShot(
  config: McpSessionConfig,
  toolName: string,
  args: Record<string, unknown>,
): Promise<McpCallResult> {
  const session = new McpSession(config)
  await session.initialize()
  try {
    return await session.callTool(toolName, args)
  } finally {
    await session.terminate()
  }
}
