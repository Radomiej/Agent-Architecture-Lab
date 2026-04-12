import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Agent, SavedConfig } from '../types'

// ─── localStorage mock ────────────────────────────────────────────────────────
// Must be established BEFORE importing the store because presetStore reads
// localStorage at module initialisation time.

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem:     (key: string) => store[key] ?? null,
    setItem:     (key: string, value: string) => { store[key] = value },
    removeItem:  (key: string) => { delete store[key] },
    clear:       () => { store = {} },
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeAgent(id: string): Agent {
  return {
    id,
    name: `Agent ${id}`,
    cat: 'TEST',
    icon: '🤖',
    color: '#fff',
    model: 'sonnet',
    load: 1,
    phase: 'build',
    role: `Role of ${id}`,
    tools: 'Read, Write',
    prompt: `You are ${id}.`,
    isCustom: true,
  }
}

function makeConfigData(version = '32.16'): SavedConfig['data'] {
  return {
    nodes: [{ id: 'n1', agentId: 'orchestrator', x: 0, y: 0, connections: [] }],
    connections: [],
    version,
  }
}

// Helper that always returns a freshly-created store instance so each test
// starts from a clean slate (no shared module-level state leakage).
async function freshStore() {
  vi.resetModules()
  const { usePresetStore } = await import('../store/presetStore')
  return usePresetStore
}

// ─── addCustomAgent ───────────────────────────────────────────────────────────

describe('presetStore – addCustomAgent', () => {
  beforeEach(() => localStorageMock.clear())

  it('adds a custom agent to the store', async () => {
    const store = await freshStore()
    store.getState().addCustomAgent(makeAgent('my-agent'))
    expect(store.getState().customAgents).toHaveLength(1)
    expect(store.getState().customAgents[0].id).toBe('my-agent')
  })

  it('sets isCustom to true', async () => {
    const store = await freshStore()
    store.getState().addCustomAgent(makeAgent('my-agent'))
    expect(store.getState().customAgents[0].isCustom).toBe(true)
  })

  it('replaces an existing agent with the same id', async () => {
    const store = await freshStore()
    store.getState().addCustomAgent(makeAgent('dup'))
    const updated = { ...makeAgent('dup'), name: 'Updated Name' }
    store.getState().addCustomAgent(updated)
    const agents = store.getState().customAgents
    expect(agents).toHaveLength(1)
    expect(agents[0].name).toBe('Updated Name')
  })

  it('persists to localStorage', async () => {
    const store = await freshStore()
    store.getState().addCustomAgent(makeAgent('persisted'))
    const raw = localStorageMock.getItem('acV32_16_custom')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.customAgents[0].id).toBe('persisted')
  })
})

// ─── removeCustomAgent ────────────────────────────────────────────────────────

describe('presetStore – removeCustomAgent', () => {
  beforeEach(() => localStorageMock.clear())

  it('removes an agent by id', async () => {
    const store = await freshStore()
    store.getState().addCustomAgent(makeAgent('to-remove'))
    store.getState().addCustomAgent(makeAgent('to-keep'))
    store.getState().removeCustomAgent('to-remove')
    const ids = store.getState().customAgents.map((a) => a.id)
    expect(ids).not.toContain('to-remove')
    expect(ids).toContain('to-keep')
  })

  it('is a no-op for a non-existent id', async () => {
    const store = await freshStore()
    store.getState().addCustomAgent(makeAgent('a1'))
    store.getState().removeCustomAgent('ghost')
    expect(store.getState().customAgents).toHaveLength(1)
  })

  it('updates localStorage after removal', async () => {
    const store = await freshStore()
    store.getState().addCustomAgent(makeAgent('a1'))
    store.getState().removeCustomAgent('a1')
    const raw = localStorageMock.getItem('acV32_16_custom')!
    const parsed = JSON.parse(raw)
    expect(parsed.customAgents).toHaveLength(0)
  })
})

// ─── updateCustomAgent ────────────────────────────────────────────────────────

describe('presetStore – updateCustomAgent', () => {
  beforeEach(() => localStorageMock.clear())

  it('updates specified fields of an existing agent', async () => {
    const store = await freshStore()
    store.getState().addCustomAgent(makeAgent('agent-x'))
    store.getState().updateCustomAgent('agent-x', { name: 'New Name', model: 'opus' })
    const agent = store.getState().customAgents.find((a) => a.id === 'agent-x')!
    expect(agent.name).toBe('New Name')
    expect(agent.model).toBe('opus')
  })

  it('preserves fields that were not updated', async () => {
    const store = await freshStore()
    store.getState().addCustomAgent(makeAgent('agent-y'))
    store.getState().updateCustomAgent('agent-y', { name: 'Changed' })
    const agent = store.getState().customAgents.find((a) => a.id === 'agent-y')!
    expect(agent.role).toBe(`Role of agent-y`)
  })

  it('is a no-op when id does not match any agent', async () => {
    const store = await freshStore()
    store.getState().addCustomAgent(makeAgent('real-agent'))
    store.getState().updateCustomAgent('ghost', { name: 'Nope' })
    const agent = store.getState().customAgents[0]
    expect(agent.name).toBe('Agent real-agent')
  })
})

// ─── saveConfig / loadConfig / deleteConfig ───────────────────────────────────

describe('presetStore – saved configs', () => {
  beforeEach(() => localStorageMock.clear())

  it('saves and loads a config by name', async () => {
    const store = await freshStore()
    const data = makeConfigData()
    store.getState().saveConfig('my-config', data)
    const loaded = store.getState().loadConfig('my-config')
    expect(loaded).toBeDefined()
    expect(loaded!.name).toBe('my-config')
    expect(loaded!.data.version).toBe('32.16')
  })

  it('loadConfig returns undefined for unknown name', async () => {
    const store = await freshStore()
    expect(store.getState().loadConfig('no-such-config')).toBeUndefined()
  })

  it('overwriting a config replaces only that entry', async () => {
    const store = await freshStore()
    store.getState().saveConfig('cfg', makeConfigData('1.0'))
    store.getState().saveConfig('cfg', makeConfigData('2.0'))
    const cfg = store.getState().loadConfig('cfg')!
    expect(cfg.data.version).toBe('2.0')
    expect(store.getState().savedConfigs).toHaveLength(1)
  })

  it('deleteConfig removes the config', async () => {
    const store = await freshStore()
    store.getState().saveConfig('to-delete', makeConfigData())
    store.getState().saveConfig('keep',      makeConfigData())
    store.getState().deleteConfig('to-delete')
    expect(store.getState().loadConfig('to-delete')).toBeUndefined()
    expect(store.getState().loadConfig('keep')).toBeDefined()
  })

  it('persists saved configs to localStorage', async () => {
    const store = await freshStore()
    store.getState().saveConfig('cfg', makeConfigData())
    const raw = localStorageMock.getItem('acV32_16_custom')!
    const parsed = JSON.parse(raw)
    expect(parsed.savedConfigs).toHaveLength(1)
    expect(parsed.savedConfigs[0].name).toBe('cfg')
  })
})

// ─── localStorage migration ───────────────────────────────────────────────────

describe('presetStore – localStorage migration', () => {
  beforeEach(() => localStorageMock.clear())

  it('migrates data from an older key to the current key', async () => {
    // Seed an older key
    const oldData = JSON.stringify({ customAgents: [makeAgent('migrated')], savedConfigs: [] })
    localStorageMock.setItem('acV32_15_custom', oldData)

    const store = await freshStore()
    expect(store.getState().customAgents[0].id).toBe('migrated')
    // Data should now be under the current key
    expect(localStorageMock.getItem('acV32_16_custom')).not.toBeNull()
    // Old key should be removed
    expect(localStorageMock.getItem('acV32_15_custom')).toBeNull()
  })

  it('prefers the current key over older keys when both exist', async () => {
    const currentData = JSON.stringify({ customAgents: [makeAgent('current')], savedConfigs: [] })
    const oldData     = JSON.stringify({ customAgents: [makeAgent('old')],     savedConfigs: [] })
    localStorageMock.setItem('acV32_16_custom', currentData)
    localStorageMock.setItem('acV32_15_custom', oldData)

    const store = await freshStore()
    expect(store.getState().customAgents[0].id).toBe('current')
  })

  it('starts with empty state when no localStorage data exists', async () => {
    const store = await freshStore()
    expect(store.getState().customAgents).toHaveLength(0)
    expect(store.getState().savedConfigs).toHaveLength(0)
  })

  it('handles corrupt JSON in localStorage gracefully', async () => {
    localStorageMock.setItem('acV32_16_custom', '{INVALID_JSON}}}')
    const store = await freshStore()
    // Should not throw; falls back to empty state
    expect(store.getState().customAgents).toHaveLength(0)
  })
})
