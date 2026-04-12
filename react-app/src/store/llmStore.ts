import { create } from 'zustand'
import type { ModelType, LLMConfig, LLMProvider, WebSearchConfig } from '../types'
import { DEFAULT_MODEL_MAP, OPENROUTER_DEFAULT_MODEL_MAP, COMETAPI_BASE_URL, OPENROUTER_BASE_URL } from '../services/llmService'
import { DEFAULT_WEB_SEARCH_CONFIG } from '../types'
import { getDefaultLLMProvider, getEnvApiKey, getEnvWebSearchApiKey, getEnvWebSearchConfig } from '../utils/env'

const LS_KEY = 'acLLM'
const LS_WS_KEY = 'acWebSearch'

function normalizeStoredText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeProvider(value: string | undefined): LLMProvider {
  return value === 'openrouter' ? 'openrouter' : 'cometapi'
}

function normalizeWebSearchProvider(value: string | undefined): WebSearchConfig['provider'] {
  return value === 'perplexity' ? 'perplexity' : 'openrouter'
}

function normalizeSonarModel(value: string | undefined): WebSearchConfig['model'] {
  return value === 'sonar' || value === 'sonar-pro' || value === 'sonar-reasoning' || value === 'sonar-deep-research'
    ? value
    : DEFAULT_WEB_SEARCH_CONFIG.model
}

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
      const provider = normalizeProvider(parsed.provider)
      return {
        provider,
        apiKey: normalizeStoredText(parsed.apiKey) ?? getEnvApiKey(provider),
        baseUrl: parsed.baseUrl ?? defaultBaseUrl(provider),
        modelMap: { ...defaultModelMap(provider), ...(parsed.modelMap ?? {}) },
        debugMode: parsed.debugMode ?? false,
      }
    }
  } catch { /* ignore */ }

  const provider = getDefaultLLMProvider()
  return {
    provider,
    apiKey: getEnvApiKey(provider),
    baseUrl: defaultBaseUrl(provider),
    modelMap: { ...defaultModelMap(provider) },
    debugMode: false,
  }
}

// ─── Web Search Tool ───────────────────────────────────────────────────────────

function loadWebSearch(): WebSearchConfig {
  const envDefaults = getEnvWebSearchConfig()

  try {
    const raw = localStorage.getItem(LS_WS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WebSearchConfig>
      const provider = normalizeWebSearchProvider(parsed.provider)
      return {
        ...envDefaults,
        ...parsed,
        enabled: parsed.enabled ?? envDefaults.enabled,
        provider,
        apiKey: normalizeStoredText(parsed.apiKey) ?? getEnvWebSearchApiKey(provider),
        model: normalizeSonarModel(parsed.model),
      }
    }
  } catch { /* ignore */ }

  return envDefaults
}

function saveConfig(cfg: LLMConfig) {
  const envApiKey = normalizeStoredText(getEnvApiKey(cfg.provider))
  const persisted = {
    ...cfg,
    apiKey: normalizeStoredText(cfg.apiKey) === envApiKey ? '' : cfg.apiKey,
  }

  try { localStorage.setItem(LS_KEY, JSON.stringify(persisted)) } catch { /* ignore */ }
}

function saveWebSearch(ws: WebSearchConfig) {
  const envApiKey = normalizeStoredText(getEnvWebSearchApiKey(ws.provider))
  const persisted = {
    ...ws,
    apiKey: normalizeStoredText(ws.apiKey) === envApiKey ? '' : ws.apiKey,
  }

  try { localStorage.setItem(LS_WS_KEY, JSON.stringify(persisted)) } catch { /* ignore */ }
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
    const current = get()
    const currentEnvKey = normalizeStoredText(getEnvApiKey(current.provider))
    const nextEnvKey = getEnvApiKey(provider)
    const nextApiKey = normalizeStoredText(current.apiKey) === currentEnvKey ? nextEnvKey : current.apiKey

    const next: LLMConfig = {
      ...current,
      provider,
      apiKey: nextApiKey,
      baseUrl: defaultBaseUrl(provider),
      modelMap: defaultModelMap(provider),
    }
    saveConfig(next)
    set({ provider: next.provider, apiKey: next.apiKey, baseUrl: next.baseUrl, modelMap: next.modelMap })
  },

  setApiKey: (apiKey) => {
    const provider = get().provider
    const next = { ...get(), apiKey: normalizeStoredText(apiKey) ?? getEnvApiKey(provider) }
    saveConfig(next)
    set({ apiKey: next.apiKey })
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
    const merged = { ...get(), ...cfg }
    const next = {
      ...merged,
      provider: normalizeProvider(merged.provider),
      apiKey: normalizeStoredText(merged.apiKey) ?? getEnvApiKey(normalizeProvider(merged.provider)),
    }
    saveConfig(next)
    set(next)
  },

  setWebSearch: (ws) => {
    const current = get().webSearch
    const provider = normalizeWebSearchProvider(ws.provider ?? current.provider)
    const next = {
      ...current,
      ...ws,
      provider,
      apiKey: normalizeStoredText(ws.apiKey ?? current.apiKey) ?? getEnvWebSearchApiKey(provider),
      model: normalizeSonarModel(ws.model ?? current.model),
    }
    saveWebSearch(next)
    set({ webSearch: next })
  },
}))
