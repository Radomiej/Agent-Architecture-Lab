import { create } from 'zustand'
import { McpSession, type McpToolDef, type McpCallResult, type McpSessionConfig } from '../services/mcpService'

const LS_KEY = 'acMcp'

interface McpConfig {
  gatewayUrl: string
  bearerToken: string
  enabled: boolean
}

/**
 * In dev (Vite), rewrite the gateway URL to go through the Vite proxy
 * (/mcp-proxy) so CORS headers are added automatically.
 * In production builds (served from same origin or GitHub Pages),
 * the URL is used as-is since users will either run their own proxy
 * or the gateway will be on the same origin.
 */
function resolveGatewayUrl(raw: string): string {
  if (import.meta.env.DEV) {
    // Replace http(s)://localhost:<port>/mcp with /mcp-proxy so Vite proxies it
    try {
      const u = new URL(raw)
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        return '/mcp-proxy'
      }
    } catch { /* not a valid URL — return as-is */ }
  }
  return raw
}

interface McpStore {
  config: McpConfig
  /** null = disconnected, 'connecting' | 'connected' | 'error' */
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  errorMsg: string | null
  tools: McpToolDef[]
  panelOpen: boolean
  /** Active session — reused across calls */
  _session: McpSession | null

  setConfig: (patch: Partial<McpConfig>) => void
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  refreshTools: () => Promise<void>
  callTool: (name: string, args: Record<string, unknown>) => Promise<McpCallResult>
  togglePanel: () => void
}

function loadConfig(): McpConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<McpConfig>
      return {
        gatewayUrl: parsed.gatewayUrl ?? 'http://localhost:8808/mcp',
        bearerToken: parsed.bearerToken ?? '',
        enabled: parsed.enabled ?? false,
      }
    }
  } catch { /* ignore */ }
  return { gatewayUrl: 'http://localhost:8808/mcp', bearerToken: '', enabled: false }
}

function saveConfig(cfg: McpConfig): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg))
  } catch { /* QuotaExceededError — ignore */ }
}

export const useMcpStore = create<McpStore>((set, get) => ({
  config: loadConfig(),
  status: 'disconnected',
  errorMsg: null,
  tools: [],
  panelOpen: false,
  _session: null,

  setConfig: (patch) => {
    const next = { ...get().config, ...patch }
    saveConfig(next)
    set({ config: next })
  },

  connect: async () => {
    const { config } = get()
    if (!config.enabled || !config.gatewayUrl) return

    set({ status: 'connecting', errorMsg: null })
    const sessionCfg: McpSessionConfig = {
      gatewayUrl: resolveGatewayUrl(config.gatewayUrl),
      bearerToken: config.bearerToken || undefined,
    }
    const session = new McpSession(sessionCfg)
    try {
      await session.initialize()
      const tools = await session.listTools()
      set({ status: 'connected', tools, _session: session, errorMsg: null })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await session.terminate().catch(() => { /* ignore */ })
      set({ status: 'error', errorMsg: msg, _session: null, tools: [] })
    }
  },

  disconnect: async () => {
    const { _session } = get()
    if (_session) {
      await _session.terminate().catch(() => { /* ignore */ })
    }
    set({ status: 'disconnected', _session: null, tools: [], errorMsg: null })
  },

  refreshTools: async () => {
    const { _session, status } = get()
    if (status !== 'connected' || !_session) return
    try {
      const tools = await _session.listTools()
      set({ tools })
    } catch { /* ignore */ }
  },

  callTool: async (name, args) => {
    const { _session, status } = get()
    if (status !== 'connected' || !_session) {
      return { ok: false, content: [], error: 'MCP gateway not connected' }
    }
    return _session.callTool(name, args)
  },

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
}))
