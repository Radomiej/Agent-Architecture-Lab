import { create } from 'zustand'
import type { ModelType, LLMConfig } from '../types'
import { DEFAULT_MODEL_MAP } from '../services/llmService'

const LS_KEY = 'acLLM'

function loadConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LLMConfig>
      return {
        apiKey: parsed.apiKey ?? '',
        baseUrl: parsed.baseUrl ?? 'https://api.cometapi.com/v1',
        modelMap: { ...DEFAULT_MODEL_MAP, ...(parsed.modelMap ?? {}) },
        debugMode: parsed.debugMode ?? false,
      }
    }
  } catch {
    // ignore
  }
  return {
    apiKey: '',
    baseUrl: 'https://api.cometapi.com/v1',
    modelMap: { ...DEFAULT_MODEL_MAP },
    debugMode: false,
  }
}

function saveConfig(cfg: LLMConfig) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg))
  } catch {
    // ignore
  }
}

interface LLMStore extends LLMConfig {
  setApiKey: (key: string) => void
  setBaseUrl: (url: string) => void
  setDebugMode: (on: boolean) => void
  setModelId: (tier: ModelType, modelId: string) => void
  setConfig: (cfg: Partial<LLMConfig>) => void
}

const initial = loadConfig()

export const useLLMStore = create<LLMStore>((set, get) => ({
  ...initial,

  setApiKey: (apiKey) => {
    const next = { ...get(), apiKey }
    saveConfig(next)
    set({ apiKey })
  },

  setBaseUrl: (baseUrl) => {
    const next = { ...get(), baseUrl }
    saveConfig(next)
    set({ baseUrl })
  },

  setDebugMode: (debugMode) => {
    const next = { ...get(), debugMode }
    saveConfig(next)
    set({ debugMode })
  },

  setModelId: (tier, modelId) => {
    const modelMap = { ...get().modelMap, [tier]: modelId }
    const next = { ...get(), modelMap }
    saveConfig(next)
    set({ modelMap })
  },

  setConfig: (cfg) => {
    const next = { ...get(), ...cfg }
    saveConfig(next)
    set(cfg)
  },
}))
