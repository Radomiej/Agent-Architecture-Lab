import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDefaultLLMProvider, getEnvApiKey, getEnvMcpConfig, getEnvWebSearchConfig } from '../utils/env'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('env helpers', () => {
  it('uses the explicit LLM provider from env', () => {
    vi.stubEnv('VITE_LLM_PROVIDER', 'openrouter')
    expect(getDefaultLLMProvider()).toBe('openrouter')
  })

  it('trims provider keys loaded from env', () => {
    vi.stubEnv('VITE_COMETAPI_API_KEY', '  sk-comet-test  ')
    expect(getEnvApiKey('cometapi')).toBe('sk-comet-test')
  })

  it('reuses the OpenRouter key for web search when no dedicated key is set', () => {
    vi.stubEnv('VITE_OPENROUTER_API_KEY', 'sk-or-test')
    const config = getEnvWebSearchConfig()

    expect(config.provider).toBe('openrouter')
    expect(config.apiKey).toBe('sk-or-test')
    expect(config.enabled).toBe(true)
    expect(config.model).toBe('sonar-pro')
  })

  it('honors explicit web search env settings', () => {
    vi.stubEnv('VITE_WEB_SEARCH_ENABLED', 'false')
    vi.stubEnv('VITE_WEB_SEARCH_PROVIDER', 'perplexity')
    vi.stubEnv('VITE_WEB_SEARCH_MODEL', 'sonar-deep-research')
    vi.stubEnv('VITE_PERPLEXITY_API_KEY', 'pplx-test')

    const config = getEnvWebSearchConfig()

    expect(config.enabled).toBe(false)
    expect(config.provider).toBe('perplexity')
    expect(config.apiKey).toBe('pplx-test')
    expect(config.model).toBe('sonar-deep-research')
  })

  it('loads MCP defaults from env', () => {
    vi.stubEnv('VITE_MCP_GATEWAY_URL', 'http://localhost:9901/mcp')
    vi.stubEnv('VITE_MCP_BEARER_TOKEN', '  test-token  ')
    vi.stubEnv('VITE_MCP_GATEWAY_ENABLED', 'true')

    expect(getEnvMcpConfig()).toEqual({
      gatewayUrl: 'http://localhost:9901/mcp',
      bearerToken: 'test-token',
      enabled: true,
    })
  })
})