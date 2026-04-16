import { DEFAULT_WEB_SEARCH_CONFIG, SONAR_MODELS, type LLMProvider, type SonarModelId, type WebSearchConfig, type WebSearchProvider } from '../types'

const VALID_LLM_PROVIDERS: readonly LLMProvider[] = ['cometapi', 'openrouter', 'openai-compatible']
const VALID_WEB_SEARCH_PROVIDERS: readonly WebSearchProvider[] = ['perplexity', 'openrouter']
const VALID_SONAR_MODELS = new Set<SonarModelId>(SONAR_MODELS.map(({ id }) => id))

function readEnv(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name]
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined
  if (/^(1|true|yes|on)$/i.test(value)) return true
  if (/^(0|false|no|off)$/i.test(value)) return false
  return undefined
}

export interface EnvMcpConfig {
  gatewayUrl: string
  bearerToken: string
  enabled: boolean
}

function parseLLMProvider(value: string | undefined): LLMProvider | undefined {
  if (!value) return undefined
  return VALID_LLM_PROVIDERS.find((provider) => provider === value)
}

function parseWebSearchProvider(value: string | undefined): WebSearchProvider | undefined {
  if (!value) return undefined
  return VALID_WEB_SEARCH_PROVIDERS.find((provider) => provider === value)
}

function parseSonarModel(value: string | undefined): SonarModelId | undefined {
  if (!value || !VALID_SONAR_MODELS.has(value as SonarModelId)) return undefined
  return value as SonarModelId
}

export function getEnvApiKey(provider: LLMProvider): string {
  if (provider === 'openrouter') return readEnv('VITE_OPENROUTER_API_KEY') ?? ''
  if (provider === 'openai-compatible') return readEnv('VITE_OPENAI_COMPATIBLE_API_KEY') ?? ''
  return readEnv('VITE_COMETAPI_API_KEY') ?? ''
}

export function getDefaultLLMProvider(): LLMProvider {
  const explicitProvider = parseLLMProvider(readEnv('VITE_LLM_PROVIDER'))
  if (explicitProvider) return explicitProvider

  const cometApiKey = getEnvApiKey('cometapi')
  const openRouterKey = getEnvApiKey('openrouter')

  if (!cometApiKey && openRouterKey) return 'openrouter'
  return 'cometapi'
}

export function getDefaultWebSearchProvider(): WebSearchProvider {
  const explicitProvider = parseWebSearchProvider(readEnv('VITE_WEB_SEARCH_PROVIDER'))
  if (explicitProvider) return explicitProvider

  const openRouterKey = getEnvApiKey('openrouter')
  const perplexityKey = readEnv('VITE_PERPLEXITY_API_KEY')

  if (!openRouterKey && perplexityKey) return 'perplexity'
  return 'openrouter'
}

export function getEnvWebSearchApiKey(provider: WebSearchProvider): string {
  const dedicatedKey = readEnv('VITE_WEB_SEARCH_API_KEY')
  if (dedicatedKey) return dedicatedKey

  if (provider === 'openrouter') return getEnvApiKey('openrouter')
  return readEnv('VITE_PERPLEXITY_API_KEY') ?? ''
}

export function getEnvWebSearchConfig(): WebSearchConfig {
  const provider = getDefaultWebSearchProvider()
  const apiKey = getEnvWebSearchApiKey(provider)

  return {
    ...DEFAULT_WEB_SEARCH_CONFIG,
    enabled: parseBoolean(readEnv('VITE_WEB_SEARCH_ENABLED')) ?? Boolean(apiKey),
    provider,
    apiKey,
    model: parseSonarModel(readEnv('VITE_WEB_SEARCH_MODEL')) ?? DEFAULT_WEB_SEARCH_CONFIG.model,
  }
}

export function getEnvMcpConfig(): EnvMcpConfig {
  return {
    gatewayUrl: readEnv('VITE_MCP_GATEWAY_URL') ?? 'http://localhost:8808/mcp',
    bearerToken: readEnv('VITE_MCP_BEARER_TOKEN') ?? '',
    enabled: parseBoolean(readEnv('VITE_MCP_GATEWAY_ENABLED')) ?? false,
  }
}