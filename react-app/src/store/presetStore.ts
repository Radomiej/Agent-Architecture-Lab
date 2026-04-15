import { create } from 'zustand'
import type { Agent, SavedConfig } from '../types'

const MIGRATION_KEYS = [
  'acV33_custom',
  'acV32_16_custom',
  'acV32_15_custom',
  'acV32_14_custom',
  'acV32_13_custom',
  'acV32_12_custom',
  'acV32_11_custom',
  'acV32_10_custom',
  'acV32_9_custom',
  'acV32_8_custom',
  'acV32_7_custom',
  'acV32_6_custom',
  'acV32_5_custom',
  'acV32_4_custom',
  'acV32_3_custom',
  'acV32_2_custom',
  'acV32_1_custom',
  'acV32_custom',
]

const CURRENT_KEY = MIGRATION_KEYS[0]

interface StoredData {
  customAgents?: Agent[]
  savedConfigs?: SavedConfig[]
}

interface StoredResult extends StoredData {
  migratedFrom?: string
}

function loadFromStorage(): StoredResult {
  for (const key of MIGRATION_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw) as StoredData
        if (key !== CURRENT_KEY) {
          localStorage.setItem(CURRENT_KEY, raw)
          localStorage.removeItem(key)
          return { ...parsed, migratedFrom: key }
        }
        return parsed
      }
    } catch {
      continue
    }
  }
  return {}
}

function saveToStorage(data: StoredData) {
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(data))
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, cannot save')
    }
  }
}

const stored = loadFromStorage()

interface PresetStore {
  customAgents: Agent[]
  savedConfigs: SavedConfig[]
  migratedFrom: string | null
  addCustomAgent: (agent: Agent) => void
  removeCustomAgent: (id: string) => void
  updateCustomAgent: (id: string, updates: Partial<Agent>) => void
  saveConfig: (name: string, data: SavedConfig['data']) => void
  loadConfig: (name: string) => SavedConfig | undefined
  deleteConfig: (name: string) => void
}

export const usePresetStore = create<PresetStore>((set, get) => ({
  customAgents: stored.customAgents ?? [],
  savedConfigs: stored.savedConfigs ?? [],
  migratedFrom: stored.migratedFrom ?? null,

  addCustomAgent: (agent) => {
    const updated = [...get().customAgents.filter((a) => a.id !== agent.id), { ...agent, isCustom: true }]
    saveToStorage({ customAgents: updated, savedConfigs: get().savedConfigs })
    set({ customAgents: updated })
  },

  removeCustomAgent: (id) => {
    const updated = get().customAgents.filter((a) => a.id !== id)
    saveToStorage({ customAgents: updated, savedConfigs: get().savedConfigs })
    set({ customAgents: updated })
  },

  updateCustomAgent: (id, updates) => {
    const updated = get().customAgents.map((a) => (a.id === id ? { ...a, ...updates } : a))
    saveToStorage({ customAgents: updated, savedConfigs: get().savedConfigs })
    set({ customAgents: updated })
  },

  saveConfig: (name, data) => {
    const existing = get().savedConfigs.filter((c) => c.name !== name)
    const updated = [...existing, { name, data }]
    saveToStorage({ customAgents: get().customAgents, savedConfigs: updated })
    set({ savedConfigs: updated })
  },

  loadConfig: (name) => get().savedConfigs.find((c) => c.name === name),

  deleteConfig: (name) => {
    const updated = get().savedConfigs.filter((c) => c.name !== name)
    saveToStorage({ customAgents: get().customAgents, savedConfigs: updated })
    set({ savedConfigs: updated })
  },
}))
