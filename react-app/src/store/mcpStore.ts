import { create } from 'zustand'
import { McpSession, type McpToolDef, type McpCallResult, type McpSessionConfig } from '../services/mcpService'
import type { McpToolGroup } from '../types'
import { getEnvMcpConfig } from '../utils/env'

const LS_KEY = 'acMcp'

interface McpConfig {
  gatewayUrl: string
  bearerToken: string
  enabled: boolean
}

interface McpPersisted {
  config?: Partial<McpConfig>
  toolGroups?: McpToolGroup[]
  agentToolOverrides?: Record<string, string[]>
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
  toolGroups: McpToolGroup[]
  agentToolOverrides: Record<string, string[]>
  panelOpen: boolean
  /** Active session — reused across calls */
  _session: McpSession | null

  setConfig: (patch: Partial<McpConfig>) => void
  setToolGroups: (groups: McpToolGroup[]) => void
  addToolGroup: (name: string, toolNames: string[]) => void
  updateToolGroup: (id: string, patch: Partial<Pick<McpToolGroup, 'name' | 'toolNames'>>) => void
  removeToolGroup: (id: string) => void
  setAgentTools: (agentId: string, tools: string[]) => void
  resetAgentTools: (agentId: string) => void
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  refreshTools: () => Promise<void>
  callTool: (name: string, args: Record<string, unknown>) => Promise<McpCallResult>
  togglePanel: () => void
}

const DEFAULT_CONFIG: McpConfig = getEnvMcpConfig()

const sanitizeToolNames = (tools: string[]): string[] =>
  Array.from(new Set(tools.map((tool) => tool.trim()).filter(Boolean)))

const sanitizeToolGroups = (groups: McpToolGroup[]): McpToolGroup[] =>
  groups
    .map((group) => {
      const name = group.name.trim()
      if (!name) return null
      return {
        id: group.id,
        name,
        toolNames: sanitizeToolNames(group.toolNames),
      }
    })
    .filter((group): group is McpToolGroup => !!group)

const sanitizeOverrides = (overrides: Record<string, string[]>): Record<string, string[]> =>
  Object.fromEntries(
    Object.entries(overrides)
      .map(([agentId, tools]) => [agentId, sanitizeToolNames(Array.isArray(tools) ? tools : [])])
      .filter(([, tools]) => tools.length > 0),
  )

function loadPersisted(): {
  config: McpConfig
  toolGroups: McpToolGroup[]
  agentToolOverrides: Record<string, string[]>
} {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as McpPersisted | Partial<McpConfig>
      const persisted = parsed as McpPersisted
      const configRaw: Partial<McpConfig> = persisted.config ?? (parsed as Partial<McpConfig>)
      const config: McpConfig = {
        gatewayUrl: configRaw?.gatewayUrl ?? DEFAULT_CONFIG.gatewayUrl,
        bearerToken: configRaw?.bearerToken ?? DEFAULT_CONFIG.bearerToken,
        enabled: configRaw?.enabled ?? DEFAULT_CONFIG.enabled,
      }
      const toolGroups = Array.isArray(persisted.toolGroups)
        ? sanitizeToolGroups(persisted.toolGroups ?? [])
        : []
      const agentToolOverrides = sanitizeOverrides(persisted.agentToolOverrides ?? {})

      return { config, toolGroups, agentToolOverrides }
    }
  } catch { /* ignore */ }
  return { config: DEFAULT_CONFIG, toolGroups: [], agentToolOverrides: {} }
}

function savePersisted(config: McpConfig, toolGroups: McpToolGroup[], agentToolOverrides: Record<string, string[]>): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      config,
      toolGroups: sanitizeToolGroups(toolGroups),
      agentToolOverrides: sanitizeOverrides(agentToolOverrides),
    }))
  } catch { /* QuotaExceededError — ignore */ }
}

const initialState = loadPersisted()

export const useMcpStore = create<McpStore>((set, get) => ({
  config: initialState.config,
  status: 'disconnected',
  errorMsg: null,
  tools: [],
  toolGroups: initialState.toolGroups,
  agentToolOverrides: initialState.agentToolOverrides,
  panelOpen: false,
  _session: null,

  setConfig: (patch) => {
    const next = { ...get().config, ...patch }
    const { toolGroups, agentToolOverrides } = get()
    savePersisted(next, toolGroups, agentToolOverrides)
    set({ config: next })
  },

  setToolGroups: (groups) => {
    const sanitized = sanitizeToolGroups(groups)
    const { config, agentToolOverrides } = get()
    savePersisted(config, sanitized, agentToolOverrides)
    set({ toolGroups: sanitized })
  },

  addToolGroup: (name, toolNames) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const nextGroup: McpToolGroup = {
      id: `grp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmed,
      toolNames: sanitizeToolNames(toolNames),
    }
    const { toolGroups } = get()
    get().setToolGroups([...toolGroups, nextGroup])
  },

  updateToolGroup: (id, patch) => {
    const { toolGroups } = get()
    const next = toolGroups.map((group) => {
      if (group.id !== id) return group
      return {
        ...group,
        name: patch.name !== undefined ? patch.name.trim() : group.name,
        toolNames: patch.toolNames !== undefined ? sanitizeToolNames(patch.toolNames) : group.toolNames,
      }
    })
    get().setToolGroups(next)
  },

  removeToolGroup: (id) => {
    const { toolGroups } = get()
    const next = toolGroups.filter((group) => group.id !== id)
    get().setToolGroups(next)
  },

  setAgentTools: (agentId, tools) => {
    const { config, toolGroups, agentToolOverrides } = get()
    const nextOverrides = {
      ...agentToolOverrides,
      [agentId]: sanitizeToolNames(tools),
    }
    savePersisted(config, toolGroups, nextOverrides)
    set({ agentToolOverrides: nextOverrides })
  },

  resetAgentTools: (agentId) => {
    const { config, toolGroups, agentToolOverrides } = get()
    const nextOverrides = { ...agentToolOverrides }
    delete nextOverrides[agentId]
    savePersisted(config, toolGroups, nextOverrides)
    set({ agentToolOverrides: nextOverrides })
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
