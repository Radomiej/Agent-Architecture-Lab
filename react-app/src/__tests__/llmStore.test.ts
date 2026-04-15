import { beforeEach, describe, expect, it, vi } from 'vitest'

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

interface EnvMockOptions {
  defaultProvider?: 'cometapi' | 'openrouter'
  cometKey?: string
  openrouterKey?: string
  webSearchKey?: string
  webSearchProvider?: 'perplexity' | 'openrouter'
  webSearchModel?: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-deep-research'
  webSearchEnabled?: boolean
}

async function freshStore(opts: EnvMockOptions = {}) {
  vi.resetModules()

  const {
    defaultProvider = 'cometapi',
    cometKey = 'comet-env-key',
    openrouterKey = 'or-env-key',
    webSearchKey = 'ws-env-key',
    webSearchProvider = 'openrouter',
    webSearchModel = 'sonar-pro',
    webSearchEnabled = true,
  } = opts

  vi.doMock('../utils/env', () => ({
    getDefaultLLMProvider: () => defaultProvider,
    getEnvApiKey: (provider: 'cometapi' | 'openrouter') => provider === 'openrouter' ? openrouterKey : cometKey,
    getEnvWebSearchApiKey: () => webSearchKey,
    getEnvWebSearchConfig: () => ({
      enabled: webSearchEnabled,
      provider: webSearchProvider,
      apiKey: webSearchKey,
      model: webSearchModel,
    }),
  }))

  const { useLLMStore } = await import('../store/llmStore')
  return useLLMStore
}

describe('llmStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('loads defaults from env when storage is empty', async () => {
    const store = await freshStore({ defaultProvider: 'cometapi' })
    const state = store.getState()

    expect(state.provider).toBe('cometapi')
    expect(state.apiKey).toBe('comet-env-key')
    expect(state.baseUrl).toContain('cometapi')
    expect(state.webSearch.provider).toBe('openrouter')
    expect(state.webSearch.model).toBe('sonar-pro')
  })

  it('normalizes corrupted provider and blank api key from persisted config', async () => {
    localStorageMock.setItem('acLLM', JSON.stringify({
      provider: 'invalid-provider',
      apiKey: '   ',
      baseUrl: 'https://custom.example/v1',
      modelMap: { sonnet: 'custom/sonnet' },
      debugMode: true,
    }))

    const store = await freshStore({ defaultProvider: 'openrouter' })
    const state = store.getState()

    expect(state.provider).toBe('cometapi')
    expect(state.apiKey).toBe('comet-env-key')
    expect(state.baseUrl).toBe('https://custom.example/v1')
    expect(state.modelMap.sonnet).toBe('custom/sonnet')
    expect(state.debugMode).toBe(true)
  })

  it('switches provider and loads the target provider key snapshot', async () => {
    const store = await freshStore()
    store.getState().setApiKey('my-private-key')
    store.getState().setProvider('openrouter')
    const state = store.getState()

    expect(state.provider).toBe('openrouter')
    expect(state.apiKey).toBe('or-env-key')
    expect(state.baseUrl).toContain('openrouter.ai')
    expect(state.modelMap.opus).toContain('anthropic/')
  })

  it('restores provider-specific key and model map when switching back and forth', async () => {
    const store = await freshStore()

    store.getState().setApiKey('comet-custom-key')
    store.getState().setModelId('sonnet', 'comet/custom-sonnet')

    store.getState().setProvider('openrouter')
    store.getState().setApiKey('or-custom-key')
    store.getState().setModelId('opus', 'openrouter/custom-opus')

    store.getState().setProvider('cometapi')
    expect(store.getState().apiKey).toBe('comet-custom-key')
    expect(store.getState().modelMap.sonnet).toBe('comet/custom-sonnet')

    store.getState().setProvider('openrouter')
    expect(store.getState().apiKey).toBe('or-custom-key')
    expect(store.getState().modelMap.opus).toBe('openrouter/custom-opus')
  })

  it('falls back to env key when setApiKey receives blank value', async () => {
    const store = await freshStore()
    store.getState().setApiKey('   ')
    expect(store.getState().apiKey).toBe('comet-env-key')
  })

  it('normalizes web search provider/model and persists updates', async () => {
    localStorageMock.setItem('acWebSearch', JSON.stringify({
      enabled: true,
      provider: 'bad-provider',
      apiKey: '   ',
      model: 'bad-model',
    }))

    const store = await freshStore({ webSearchProvider: 'perplexity', webSearchKey: 'ws-env-from-mock' })
    const state = store.getState()

    expect(state.webSearch.provider).toBe('openrouter')
    expect(state.webSearch.model).toBe('sonar-pro')
    expect(state.webSearch.apiKey).toBe('ws-env-from-mock')

    store.getState().setWebSearch({ provider: 'perplexity', model: 'sonar', apiKey: 'pplx-key' })
    expect(store.getState().webSearch.provider).toBe('perplexity')
    expect(store.getState().webSearch.model).toBe('sonar')
  })

  it('clears persisted data and restores fresh defaults', async () => {
    const store = await freshStore({ defaultProvider: 'openrouter' })
    store.getState().setApiKey('persisted-custom-key')
    store.getState().setWebSearch({ apiKey: 'persisted-ws-key', enabled: true })

    expect(localStorageMock.getItem('acLLM')).not.toBeNull()
    expect(localStorageMock.getItem('acWebSearch')).not.toBeNull()

    store.getState().clearPersistedData()

    const state = store.getState()
    expect(localStorageMock.getItem('acLLM')).toBeNull()
    expect(localStorageMock.getItem('acWebSearch')).toBeNull()
    expect(state.provider).toBe('openrouter')
    expect(state.apiKey).toBe('or-env-key')
    expect(state.webSearch.apiKey).toBe('ws-env-key')
  })
})
