import { create } from 'zustand'
import type { ModelType, LLMConfig, LLMProvider, WebSearchConfig } from '../types'
import { DEFAULT_MODEL_MAP, OPENROUTER_DEFAULT_MODEL_MAP, OPENAI_COMPATIBLE_DEFAULT_MODEL_MAP, COMETAPI_BASE_URL, OPENROUTER_BASE_URL, OPENAI_COMPATIBLE_BASE_URL } from '../services/llmService'
import { DEFAULT_WEB_SEARCH_CONFIG } from '../types'
import { getDefaultLLMProvider, getEnvApiKey, getEnvWebSearchApiKey, getEnvWebSearchConfig } from '../utils/env'

const LS_KEY = 'acLLM'
const LS_WS_KEY = 'acWebSearch'

function normalizeStoredText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeProvider(value: string | undefined): LLMProvider {
  if (value === 'openrouter') return 'openrouter'
  if (value === 'openai-compatible') return 'openai-compatible'
  return 'cometapi'
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
  if (provider === 'openrouter') return { ...OPENROUTER_DEFAULT_MODEL_MAP }
  if (provider === 'openai-compatible') return { ...OPENAI_COMPATIBLE_DEFAULT_MODEL_MAP }
  return { ...DEFAULT_MODEL_MAP }
}

function defaultBaseUrl(provider: LLMProvider): string {
  if (provider === 'openrouter') return OPENROUTER_BASE_URL
  if (provider === 'openai-compatible') return OPENAI_COMPATIBLE_BASE_URL
  return COMETAPI_BASE_URL
}

interface ProviderLLMConfig {
  apiKey: string
  baseUrl: string
  modelMap: Record<ModelType, string>
}

type ProviderConfigMap = Record<'cometapi' | 'openrouter' | 'openai-compatible', ProviderLLMConfig>

interface PersistedLLMConfig {
  provider?: string
  apiKey?: string
  baseUrl?: string
  modelMap?: Partial<Record<ModelType, string>>
  debugMode?: boolean
  providers?: Partial<Record<'cometapi' | 'openrouter' | 'openai-compatible', {
    apiKey?: string
    baseUrl?: string
    modelMap?: Partial<Record<ModelType, string>>
  }>>
}

interface LoadedLLMState extends LLMConfig {
  providerConfigs: ProviderConfigMap
}

function makeProviderProfile(provider: LLMProvider, partial?: {
  apiKey?: string
  baseUrl?: string
  modelMap?: Partial<Record<ModelType, string>>
}): ProviderLLMConfig {
  return {
    apiKey: normalizeStoredText(partial?.apiKey) ?? getEnvApiKey(provider),
    baseUrl: partial?.baseUrl ?? defaultBaseUrl(provider),
    modelMap: { ...defaultModelMap(provider), ...(partial?.modelMap ?? {}) },
  }
}

function loadConfig(): LoadedLLMState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedLLMConfig
      const provider = normalizeProvider(parsed.provider)
      const providerConfigs: ProviderConfigMap = {
        cometapi: makeProviderProfile('cometapi'),
        openrouter: makeProviderProfile('openrouter'),
        'openai-compatible': makeProviderProfile('openai-compatible'),
      }

      if (parsed.providers) {
        providerConfigs.cometapi = makeProviderProfile('cometapi', parsed.providers.cometapi)
        providerConfigs.openrouter = makeProviderProfile('openrouter', parsed.providers.openrouter)
        providerConfigs['openai-compatible'] = makeProviderProfile('openai-compatible', (parsed.providers as Record<string, { apiKey?: string; baseUrl?: string; modelMap?: Partial<Record<ModelType, string>> } | undefined>)['openai-compatible'])
      } else {
        // Legacy migration: single provider config becomes snapshot for that provider.
        providerConfigs[provider] = makeProviderProfile(provider, {
          apiKey: parsed.apiKey,
          baseUrl: parsed.baseUrl,
          modelMap: parsed.modelMap,
        })
      }

      const active = providerConfigs[provider]
      return {
        provider,
        apiKey: active.apiKey,
        baseUrl: active.baseUrl,
        modelMap: active.modelMap,
        debugMode: parsed.debugMode ?? false,
        providerConfigs,
      }
    }
  } catch { /* ignore */ }

  const provider = getDefaultLLMProvider()
  const providerConfigs: ProviderConfigMap = {
    cometapi: makeProviderProfile('cometapi'),
    openrouter: makeProviderProfile('openrouter'),
    'openai-compatible': makeProviderProfile('openai-compatible'),
  }

  return {
    provider,
    apiKey: providerConfigs[provider].apiKey,
    baseUrl: providerConfigs[provider].baseUrl,
    modelMap: providerConfigs[provider].modelMap,
    debugMode: false,
    providerConfigs,
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

function sanitizeProviderConfig(provider: LLMProvider, cfg: ProviderLLMConfig): ProviderLLMConfig {
  return {
    apiKey: normalizeStoredText(cfg.apiKey) ?? getEnvApiKey(provider),
    baseUrl: cfg.baseUrl || defaultBaseUrl(provider),
    modelMap: { ...defaultModelMap(provider), ...cfg.modelMap },
  }
}

function saveConfig(cfg: { provider: LLMProvider; debugMode: boolean; providerConfigs: ProviderConfigMap }) {
  const persistProvider = (provider: LLMProvider) => {
    const profile = sanitizeProviderConfig(provider, cfg.providerConfigs[provider])
    const envApiKey = normalizeStoredText(getEnvApiKey(provider))
    return {
      ...profile,
      apiKey: normalizeStoredText(profile.apiKey) === envApiKey ? '' : profile.apiKey,
    }
  }

  const persisted = {
    provider: cfg.provider,
    debugMode: cfg.debugMode,
    providers: {
      cometapi: persistProvider('cometapi'),
      openrouter: persistProvider('openrouter'),
      'openai-compatible': persistProvider('openai-compatible'),
    },
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
  providerConfigs: ProviderConfigMap

  // LLM Provider actions
  setProvider: (p: LLMProvider) => void
  setApiKey: (key: string) => void
  setBaseUrl: (url: string) => void
  setDebugMode: (on: boolean) => void
  setModelId: (tier: ModelType, modelId: string) => void
  setConfig: (cfg: Partial<LLMConfig>) => void
  setProviderConfigs: (provider: LLMProvider, configs: ProviderConfigMap, debugMode: boolean) => void

  // Web Search Tool (separate concept)
  webSearch: WebSearchConfig
  setWebSearch: (ws: Partial<WebSearchConfig>) => void

  // Persistence
  clearPersistedData: () => void
}

const initialLLM = loadConfig()
const initialWS = loadWebSearch()

export const useLLMStore = create<LLMStore>((set, get) => ({
  ...initialLLM,
  webSearch: initialWS,

  setProvider: (provider) => {
    const current = get()
    const nextProfile = sanitizeProviderConfig(provider, current.providerConfigs[provider])
    const next = {
      provider,
      apiKey: nextProfile.apiKey,
      baseUrl: nextProfile.baseUrl,
      modelMap: nextProfile.modelMap,
      debugMode: current.debugMode,
      providerConfigs: current.providerConfigs,
    }
    saveConfig(next)
    set({ provider: next.provider, apiKey: next.apiKey, baseUrl: next.baseUrl, modelMap: next.modelMap })
  },

  setApiKey: (apiKey) => {
    const current = get()
    const provider = current.provider
    const nextApiKey = normalizeStoredText(apiKey) ?? getEnvApiKey(provider)
    const providerConfigs = {
      ...current.providerConfigs,
      [provider]: { ...current.providerConfigs[provider], apiKey: nextApiKey },
    }
    const next = { provider, apiKey: nextApiKey, baseUrl: current.baseUrl, modelMap: current.modelMap, debugMode: current.debugMode, providerConfigs }
    saveConfig(next)
    set({ apiKey: next.apiKey, providerConfigs })
  },

  setBaseUrl: (baseUrl) => {
    const current = get()
    const provider = current.provider
    const providerConfigs = {
      ...current.providerConfigs,
      [provider]: { ...current.providerConfigs[provider], baseUrl },
    }
    const next = { provider, apiKey: current.apiKey, baseUrl, modelMap: current.modelMap, debugMode: current.debugMode, providerConfigs }
    saveConfig(next)
    set({ baseUrl, providerConfigs })
  },

  setDebugMode: (debugMode) => {
    const current = get()
    const next = {
      provider: current.provider,
      apiKey: current.apiKey,
      baseUrl: current.baseUrl,
      modelMap: current.modelMap,
      debugMode,
      providerConfigs: current.providerConfigs,
    }
    saveConfig(next)
    set({ debugMode })
  },

  setModelId: (tier, modelId) => {
    const current = get()
    const provider = current.provider
    const modelMap = { ...current.modelMap, [tier]: modelId }
    const providerConfigs = {
      ...current.providerConfigs,
      [provider]: { ...current.providerConfigs[provider], modelMap },
    }
    const next = { provider, apiKey: current.apiKey, baseUrl: current.baseUrl, modelMap, debugMode: current.debugMode, providerConfigs }
    saveConfig(next)
    set({ modelMap, providerConfigs })
  },

  setConfig: (cfg) => {
    const current = get()
    const provider = normalizeProvider(cfg.provider ?? current.provider)
    const currentProfile = current.providerConfigs[provider]
    const nextProfile = sanitizeProviderConfig(provider, {
      apiKey: cfg.apiKey ?? currentProfile.apiKey,
      baseUrl: cfg.baseUrl ?? currentProfile.baseUrl,
      modelMap: cfg.modelMap ?? currentProfile.modelMap,
    })
    const providerConfigs = {
      ...current.providerConfigs,
      [provider]: nextProfile,
    }
    const next = {
      provider,
      apiKey: nextProfile.apiKey,
      baseUrl: nextProfile.baseUrl,
      modelMap: nextProfile.modelMap,
      debugMode: cfg.debugMode ?? current.debugMode,
      providerConfigs,
    }
    saveConfig(next)
    set(next)
  },

  setProviderConfigs: (provider, configs, debugMode) => {
    const nextConfigs: ProviderConfigMap = {
      cometapi: sanitizeProviderConfig('cometapi', configs.cometapi),
      openrouter: sanitizeProviderConfig('openrouter', configs.openrouter),
      'openai-compatible': sanitizeProviderConfig('openai-compatible', configs['openai-compatible']),
    }
    const active = nextConfigs[provider]
    const next = {
      provider,
      apiKey: active.apiKey,
      baseUrl: active.baseUrl,
      modelMap: active.modelMap,
      debugMode,
      providerConfigs: nextConfigs,
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

  clearPersistedData: () => {
    try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
    try { localStorage.removeItem(LS_WS_KEY) } catch { /* ignore */ }
    const provider = getDefaultLLMProvider()
    const providerConfigs: ProviderConfigMap = {
      cometapi: makeProviderProfile('cometapi'),
      openrouter: makeProviderProfile('openrouter'),
      'openai-compatible': makeProviderProfile('openai-compatible'),
    }
    const active = providerConfigs[provider]
    const freshLLM: LLMConfig = {
      provider,
      apiKey: active.apiKey,
      baseUrl: active.baseUrl,
      modelMap: active.modelMap,
      debugMode: false,
    }
    const freshWS = getEnvWebSearchConfig()
    set({ ...freshLLM, providerConfigs, webSearch: freshWS })
  },
}))
