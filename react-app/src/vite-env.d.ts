/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LLM_PROVIDER?: 'cometapi' | 'openrouter'
  readonly VITE_COMETAPI_API_KEY?: string
  readonly VITE_OPENROUTER_API_KEY?: string
  readonly VITE_WEB_SEARCH_ENABLED?: string
  readonly VITE_WEB_SEARCH_PROVIDER?: 'perplexity' | 'openrouter'
  readonly VITE_WEB_SEARCH_MODEL?: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-deep-research'
  readonly VITE_WEB_SEARCH_API_KEY?: string
  readonly VITE_PERPLEXITY_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}