import { create } from 'zustand'
import type { ModelType, LLMConfig, LLMProvider, WebSearchConfig } from '../types'
import { DEFAULT_MODEL_MAP, OPENROUTER_DEFAULT_MODEL_MAP, COMETAPI_BASE_URL, OPENROUTER_BASE_URL } from '../services/llmService'
import { DEFAULT_WEB_SEARCH_CONFIG } from '../types'

const LS_KEY = 'acLLM'
const LS_WS_KEY = 'acWebSearch'

// ─── LLM Provider ─────────────────────────────────────────────────────────────

function defaultModelMap(provider: LLMProvider): Record<ModelType, string> {
  return provider === 'openrouter'
    ? { ...OPENROUTER_DEFAULT_MODEL_MAP }
    : { ...DEFAULT_MODEL_MAP }
}

function defaultBaseUrl(provider: LLMProvider): string {
  return provider === 'openrouter' ? OPENROUTER_BASE_URL : COMETAPI_BASE_URL
}

function loadConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LLMConfig>
      const provider: LLMProvider = parsed.provider ?? 'cometapi'
      return {
        provider,
        apiKey: parsed.apiKey ?? '',
        baseUrl: parsed.baseUrl ?? defaultBaseUrl(provider),
        modelMap: { ...defaultModelMap(provider), ...(parsed.modelMap ?? {}) },
        debugMode: parsed.debugMode ?? false,
      }
    }
  } catch { /* ignore */ }
  return {
    provider: 'cometapi',
    apiKey: '',
    baseUrl: COMETAPI_BASE_URL,
    modelMap: { ...DEFAULT_MODEL_MAP },
    debugMode: false,
  }
}

// ─── Web Search Tool ───────────────────────────────────────────────────────────

function loadWebSearch(): WebSearchConfig {
  try {
    const raw = localStorage.getItem(LS_WS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WebSearchConfig>
      return { ...DEFAULT_WEB_SEARCH_CONFIG, ...parsed }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_WEB_SEARCH_CONFIG }
}

function saveConfig(cfg: LLMConfig) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)) } catch { /* ignore */ }
}

function saveWebSearch(ws: WebSearchConfig) {
  try { localStorage.setItem(LS_WS_KEY, JSON.stringify(ws)) } catch { /* ignore */ }
}

// ─── Store ─────────────────────────────────────────────────────────────────────

interface LLMStore extends LLMConfig {
  // LLM Provider actions
  setProvider: (p: LLMProvider) => void
  setApiKey: (key: string) => void
  setBaseUrl: (url: string) => void
  setDebugMode: (on: boolean) => void
  setModelId: (tier: ModelType, modelId: string) => void
  setConfig: (cfg: Partial<LLMConfig>) => void

  // Web Search Tool (separate concept)
  webSearch: WebSearchConfig
  setWebSearch: (ws: Partial<WebSearchConfig>) => void
}

const initialLLM = loadConfig()
const initialWS = loadWebSearch()

export const useLLMStore = create<LLMStore>((set, get) => ({
  ...initialLLM,
  webSearch: initialWS,

  setProvider: (provider) => {
    // When switching provider, auto-update baseUrl and reset modelMap to provider defaults
    const next: LLMConfig = {
      ...get(),
      provider,
      baseUrl: defaultBaseUrl(provider),
      modelMap: defaultModelMap(provider),
    }
    saveConfig(next)
    set({ provider: next.provider, baseUrl: next.baseUrl, modelMap: next.modelMap })
  },

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

  setWebSearch: (ws) => {
    const next = { ...get().webSearch, ...ws }
    saveWebSearch(next)
    set({ webSearch: next })
  },
}))
