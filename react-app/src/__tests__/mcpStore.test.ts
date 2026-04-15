import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { McpToolGroup } from '../types'

// ─── localStorage mock ────────────────────────────────────────────────────────

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

const LS_KEY = 'acMcp'

// Fresh module per test so loadPersisted() re-reads localStorage on each import
async function freshMcpStore() {
  vi.resetModules()
  const mod = await import('../store/mcpStore')
  return mod.useMcpStore
}

function readPersisted(): {
  config?: { gatewayUrl?: string; bearerToken?: string; enabled?: boolean }
  toolGroups?: McpToolGroup[]
  agentToolOverrides?: Record<string, string[]>
} | null {
  const raw = localStorageMock.getItem(LS_KEY)
  return raw ? JSON.parse(raw) as { toolGroups?: McpToolGroup[]; agentToolOverrides?: Record<string, string[]> } : null
}

// ─── reset between tests ──────────────────────────────────────────────────────

beforeEach(() => {
  localStorageMock.clear()
})

// ─── initial defaults ─────────────────────────────────────────────────────────

describe('mcpStore – initial state', () => {
  it('starts with empty toolGroups and agentToolOverrides', async () => {
    const useStore = await freshMcpStore()
    expect(useStore.getState().toolGroups).toEqual([])
    expect(useStore.getState().agentToolOverrides).toEqual({})
  })

  it('loads toolGroups from localStorage when present', async () => {
    const groups: McpToolGroup[] = [
      { id: 'g1', name: 'webtool', toolNames: ['docker_pull', 'browser_fetch'] },
    ]
    localStorageMock.setItem(LS_KEY, JSON.stringify({
      config: { gatewayUrl: 'http://localhost:8808/mcp', bearerToken: '', enabled: false },
      toolGroups: groups,
      agentToolOverrides: {},
    }))
    const useStore = await freshMcpStore()
    expect(useStore.getState().toolGroups).toHaveLength(1)
    expect(useStore.getState().toolGroups[0].name).toBe('webtool')
    expect(useStore.getState().toolGroups[0].toolNames).toEqual(['docker_pull', 'browser_fetch'])
  })

  it('loads agentToolOverrides from localStorage when present', async () => {
    localStorageMock.setItem(LS_KEY, JSON.stringify({
      config: { gatewayUrl: 'http://localhost:8808/mcp', bearerToken: '', enabled: false },
      toolGroups: [],
      agentToolOverrides: { orchestrator: ['Read', 'webtool'] },
    }))
    const useStore = await freshMcpStore()
    expect(useStore.getState().agentToolOverrides).toEqual({ orchestrator: ['Read', 'webtool'] })
  })

  it('falls back to defaults gracefully for malformed localStorage data', async () => {
    localStorageMock.setItem(LS_KEY, 'not valid JSON }{')
    const useStore = await freshMcpStore()
    expect(useStore.getState().toolGroups).toEqual([])
    expect(useStore.getState().agentToolOverrides).toEqual({})
  })
})

// ─── addToolGroup ─────────────────────────────────────────────────────────────

describe('mcpStore – addToolGroup', () => {
  it('adds a new group and persists it', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('webtool', ['docker_pull', 'browser_fetch'])

    const groups = useStore.getState().toolGroups
    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe('webtool')
    expect(groups[0].toolNames).toEqual(['docker_pull', 'browser_fetch'])
    expect(groups[0].id).toMatch(/^grp-/)

    const saved = readPersisted()
    expect(saved?.toolGroups).toHaveLength(1)
    expect(saved?.toolGroups?.[0].name).toBe('webtool')
  })

  it('deduplicates tool names on creation', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('net', ['docker_pull', 'docker_pull', 'browser_fetch'])
    const { toolNames } = useStore.getState().toolGroups[0]
    expect(toolNames).toEqual(['docker_pull', 'browser_fetch'])
  })

  it('ignores empty group name', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('', ['tool1'])
    expect(useStore.getState().toolGroups).toHaveLength(0)
  })

  it('ignores whitespace-only group name', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('   ', ['tool1'])
    expect(useStore.getState().toolGroups).toHaveLength(0)
  })

  it('accumulates multiple groups', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('webtool', ['docker_pull'])
    useStore.getState().addToolGroup('devtools', ['bash_exec'])
    expect(useStore.getState().toolGroups).toHaveLength(2)
  })
})

// ─── updateToolGroup ──────────────────────────────────────────────────────────

describe('mcpStore – updateToolGroup', () => {
  it('renames a group', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('oldname', ['t1'])
    const id = useStore.getState().toolGroups[0].id
    useStore.getState().updateToolGroup(id, { name: 'newname' })
    expect(useStore.getState().toolGroups[0].name).toBe('newname')
  })

  it('replaces toolNames for a group', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('webtool', ['old_tool'])
    const id = useStore.getState().toolGroups[0].id
    useStore.getState().updateToolGroup(id, { toolNames: ['docker_pull', 'browser_fetch'] })
    expect(useStore.getState().toolGroups[0].toolNames).toEqual(['docker_pull', 'browser_fetch'])
  })

  it('persists the updated group to localStorage', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('webtool', ['old'])
    const id = useStore.getState().toolGroups[0].id
    useStore.getState().updateToolGroup(id, { toolNames: ['new_tool'] })

    const saved = readPersisted()
    expect(saved?.toolGroups?.[0].toolNames).toEqual(['new_tool'])
  })

  it('is a no-op for unknown group id', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('webtool', ['t1'])
    useStore.getState().updateToolGroup('nonexistent-id', { name: 'renamed' })
    expect(useStore.getState().toolGroups[0].name).toBe('webtool')
  })
})

// ─── removeToolGroup ─────────────────────────────────────────────────────────

describe('mcpStore – removeToolGroup', () => {
  it('removes a group by id', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('webtool', ['t1'])
    const id = useStore.getState().toolGroups[0].id
    useStore.getState().removeToolGroup(id)
    expect(useStore.getState().toolGroups).toHaveLength(0)
  })

  it('does not remove other groups', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('g1', ['t1'])
    useStore.getState().addToolGroup('g2', ['t2'])
    const id1 = useStore.getState().toolGroups[0].id
    useStore.getState().removeToolGroup(id1)
    expect(useStore.getState().toolGroups).toHaveLength(1)
    expect(useStore.getState().toolGroups[0].name).toBe('g2')
  })

  it('persists removal', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('webtool', ['t1'])
    const id = useStore.getState().toolGroups[0].id
    useStore.getState().removeToolGroup(id)
    expect(readPersisted()?.toolGroups).toHaveLength(0)
  })
})

// ─── setToolGroups (bulk) ─────────────────────────────────────────────────────

describe('mcpStore – setToolGroups', () => {
  it('replaces all groups at once', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('old', ['t1'])
    const newGroups: McpToolGroup[] = [
      { id: 'new-1', name: 'webtool',  toolNames: ['docker_pull'] },
      { id: 'new-2', name: 'devtools', toolNames: ['bash_exec'] },
    ]
    useStore.getState().setToolGroups(newGroups)
    expect(useStore.getState().toolGroups).toHaveLength(2)
    expect(useStore.getState().toolGroups[0].name).toBe('webtool')
  })

  it('filters out groups with blank names', async () => {
    const useStore = await freshMcpStore()
    const groups: McpToolGroup[] = [
      { id: 'g1', name: 'webtool',  toolNames: ['t1'] },
      { id: 'g2', name: '   ',      toolNames: ['t2'] },
    ]
    useStore.getState().setToolGroups(groups)
    expect(useStore.getState().toolGroups).toHaveLength(1)
    expect(useStore.getState().toolGroups[0].name).toBe('webtool')
  })
})

// ─── setAgentTools ────────────────────────────────────────────────────────────

describe('mcpStore – setAgentTools', () => {
  it('sets an override for a specific agent', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().setAgentTools('orchestrator', ['Read', 'webtool'])
    expect(useStore.getState().agentToolOverrides['orchestrator']).toEqual(['Read', 'webtool'])
  })

  it('does not affect overrides of other agents', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().setAgentTools('orchestrator', ['Read'])
    useStore.getState().setAgentTools('backend', ['Write'])
    expect(useStore.getState().agentToolOverrides['orchestrator']).toEqual(['Read'])
    expect(useStore.getState().agentToolOverrides['backend']).toEqual(['Write'])
  })

  it('persists override to localStorage', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().setAgentTools('orchestrator', ['Read', 'webtool'])
    expect(readPersisted()?.agentToolOverrides?.['orchestrator']).toEqual(['Read', 'webtool'])
  })

  it('deduplicates tool names in override', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().setAgentTools('orchestrator', ['Read', 'Read', 'Write'])
    expect(useStore.getState().agentToolOverrides['orchestrator']).toEqual(['Read', 'Write'])
  })
})

// ─── resetAgentTools ─────────────────────────────────────────────────────────

describe('mcpStore – resetAgentTools', () => {
  it('removes the override for the agent', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().setAgentTools('orchestrator', ['webtool'])
    useStore.getState().resetAgentTools('orchestrator')
    expect(useStore.getState().agentToolOverrides['orchestrator']).toBeUndefined()
  })

  it('does not affect other agents overrides', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().setAgentTools('orchestrator', ['webtool'])
    useStore.getState().setAgentTools('backend', ['devtools'])
    useStore.getState().resetAgentTools('orchestrator')
    expect(useStore.getState().agentToolOverrides['backend']).toEqual(['devtools'])
  })

  it('persists removal of override to localStorage', async () => {
    const useStore = await freshMcpStore()
    useStore.getState().setAgentTools('orchestrator', ['webtool'])
    useStore.getState().resetAgentTools('orchestrator')
    expect(readPersisted()?.agentToolOverrides?.['orchestrator']).toBeUndefined()
  })

  it('is a no-op for agent without override', async () => {
    const useStore = await freshMcpStore()
    // Should not throw
    useStore.getState().resetAgentTools('nonexistent')
    expect(useStore.getState().agentToolOverrides).toEqual({})
  })
})

// ─── persistence round-trip ───────────────────────────────────────────────────

describe('mcpStore – persistence round-trip', () => {
  it('saves and reloads groups and overrides across re-imports', async () => {
    // Write data with first import
    const useStore1 = await freshMcpStore()
    useStore1.getState().addToolGroup('webtool', ['docker_pull', 'browser_fetch'])
    useStore1.getState().setAgentTools('orchestrator', ['webtool', 'Read'])

    // Re-import — module reload reads localStorage again
    const useStore2 = await freshMcpStore()
    const groups = useStore2.getState().toolGroups
    const overrides = useStore2.getState().agentToolOverrides

    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe('webtool')
    expect(groups[0].toolNames).toEqual(['docker_pull', 'browser_fetch'])
    expect(overrides['orchestrator']).toEqual(['webtool', 'Read'])
  })

  it('group and override data survive multiple mutations before re-import', async () => {
    const useStore1 = await freshMcpStore()
    useStore1.getState().addToolGroup('g1', ['t1'])
    useStore1.getState().addToolGroup('g2', ['t2', 't3'])
    useStore1.getState().setAgentTools('orchestrator', ['g1', 'Read'])
    useStore1.getState().setAgentTools('backend', ['g2'])
    // Remove one group
    const g1id = useStore1.getState().toolGroups.find((g) => g.name === 'g1')!.id
    useStore1.getState().removeToolGroup(g1id)

    const useStore2 = await freshMcpStore()
    expect(useStore2.getState().toolGroups).toHaveLength(1)
    expect(useStore2.getState().toolGroups[0].name).toBe('g2')
    expect(useStore2.getState().agentToolOverrides['orchestrator']).toEqual(['g1', 'Read'])
    expect(useStore2.getState().agentToolOverrides['backend']).toEqual(['g2'])
  })
})

// ─── integration: group tokens resolve to MCP tool names ─────────────────────

describe('mcpStore + resolveAgentTools – end-to-end', () => {
  it('an agent with group token in override receives expanded MCP tool names', async () => {
    // Import resolveAgentTools directly (pure util, no store dependency)
    const { resolveAgentTools } = await import('../utils/resolveAgentTools')

    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('webtool', ['docker_pull', 'docker_search', 'browser_fetch'])
    useStore.getState().setAgentTools('orchestrator', ['webtool', 'Read'])

    const { toolGroups, agentToolOverrides } = useStore.getState()
    const resolved = resolveAgentTools('orchestrator', 'Bash', agentToolOverrides, toolGroups)

    expect(resolved).toContain('docker_pull')
    expect(resolved).toContain('docker_search')
    expect(resolved).toContain('browser_fetch')
    expect(resolved).toContain('Read')
    // Original base tool 'Bash' is replaced by override entirely
    expect(resolved).not.toContain('Bash')
    // Group token itself must not appear
    expect(resolved).not.toContain('webtool')
  })

  it('agent without override falls back to base tools with group expansion', async () => {
    const { resolveAgentTools } = await import('../utils/resolveAgentTools')

    const useStore = await freshMcpStore()
    useStore.getState().addToolGroup('devtools', ['bash_exec', 'file_read'])
    const { toolGroups, agentToolOverrides } = useStore.getState()

    // base tools have 'devtools' token
    const resolved = resolveAgentTools('backend', 'devtools, Read', agentToolOverrides, toolGroups)

    expect(resolved).toContain('bash_exec')
    expect(resolved).toContain('file_read')
    expect(resolved).toContain('Read')
    expect(resolved).not.toContain('devtools')
  })

  it('agent with no groups configured receives base tools unchanged', async () => {
    const { resolveAgentTools } = await import('../utils/resolveAgentTools')

    const useStore = await freshMcpStore()
    // No groups added
    const { toolGroups, agentToolOverrides } = useStore.getState()

    const resolved = resolveAgentTools('orchestrator', 'Read, Write, Agent', agentToolOverrides, toolGroups)
    expect(resolved).toEqual(['Read', 'Write', 'Agent'])
  })
})
