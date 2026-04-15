export type Phase = 'strategy' | 'research' | 'debate1' | 'debate2' | 'build' | 'qa' | 'hitl'
export type ModelType = 'opus' | 'sonnet' | 'haiku'

export interface Agent {
  id: string
  name: string
  cat: string
  icon: string
  color: string
  model: ModelType
  load: number
  phase: Phase
  role: string
  tools: string
  prompt: string
  isCustom?: boolean
  iconRef?: string
  tier?: string
}

export interface CanvasNode {
  id: string
  agentId: string
  x: number
  y: number
  connections: string[]
}

export interface Connection {
  from: string
  to: string
}

export interface CanvasState {
  nodes: CanvasNode[]
  connections: Connection[]
  selected: string[]
}

export interface SimMessage {
  agentId: string
  text: string
  timestamp: number
  phase?: string
}

export interface PresetNode {
  id: string
  x: number
  y: number
  c?: string[]
  m?: ModelType
}

export interface Preset {
  id: string
  name: string
  cat: string
  desc: string
  nodes: PresetNode[]
  tier?: string
  source?: string
}

export interface PresetCategory {
  name: string
  ids: string[]
}

export type PhaseColors = Record<string, string>

export interface ModelCosts {
  i: number
  o: number
  cr: number
  cw: number
}

export type ModelCostsMap = Record<ModelType, ModelCosts>

export interface AgentKnowledge {
  who: string
  analogy: string
  does: string[]
  doesNot: string[]
  antiPatterns: string[]
  facts: string[]
}

export interface PresetKnowledge {
  who: string
  analogy: string
  whenToUse: string[]
  whenNotToUse: string[]
  keyFeatures: string[]
}

export interface HowItWorksStep {
  phase: string
  desc: string
}

export interface AgentEdu {
  tagline: string
  missionShort: string
  whoIs: string
  howItWorks: HowItWorksStep[]
  inputs: string[]
  outputs: string[]
  does: string[]
  doesNotDo: string[]
  antiPatterns: string[]
  keyConcepts: string[]
  stats: string[]
  bestFor: string[]
  worstFor: string[]
  relatedAgents: string[]
  relatedPresets: string[]
  glossary: Record<string, string>
  learningQuote: string
  realExample: string
}

export interface PresetEdu {
  tagline: string
  missionShort: string
  whoIs: string
  howItWorks: HowItWorksStep[]
  inputs: string[]
  outputs: string[]
  does: string[]
  doesNotDo: string[]
  antiPatterns: string[]
  keyConcepts: string[]
  stats: string[]
  bestFor: string[]
  worstFor: string[]
  relatedAgents: string[]
  relatedPresets: string[]
  glossary: Record<string, string>
  learningQuote: string
  realExample: string
}

export interface CustomAgent extends Agent {
  isCustom: true
}

export interface SavedConfig {
  name: string
  data: {
    nodes: CanvasNode[]
    connections: Connection[]
    version: string
  }
}

export interface CostResult {
  p50: number
  p90: number
  tokIn: number
  tokOut: number
}

export interface CtxResult {
  used: number
  window: number
  pct: number
}

export type LLMProvider = 'cometapi' | 'openrouter'

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  baseUrl: string
  modelMap: Record<ModelType, string>
  debugMode: boolean
}

// ─── Web Search Tool (separate concept from LLM provider) ─────────────────────
export type WebSearchProvider = 'perplexity' | 'openrouter'

export const SONAR_MODELS = [
  { id: 'sonar',               label: 'Sonar — fast, real-time web search' },
  { id: 'sonar-pro',           label: 'Sonar Pro — deeper multi-step search' },
  { id: 'sonar-reasoning',     label: 'Sonar Reasoning — chain-of-thought + web' },
  { id: 'sonar-deep-research', label: 'Sonar Deep Research — comprehensive (slow)' },
] as const

export type SonarModelId = typeof SONAR_MODELS[number]['id']

export interface WebSearchConfig {
  /** Whether web search tool is active */
  enabled: boolean
  /** Perplexity direct API or OpenRouter routing to Perplexity */
  provider: WebSearchProvider
  /** API key — pplx-… for Perplexity, sk-or-… for OpenRouter */
  apiKey: string
  /** Sonar model to use */
  model: SonarModelId
}

export const DEFAULT_WEB_SEARCH_CONFIG: WebSearchConfig = {
  enabled: false,
  provider: 'perplexity',
  apiKey: '',
  model: 'sonar-pro',
}


export type LLMCallStatus = 'pending' | 'streaming' | 'done' | 'error'

export interface LLMCallLog {
  id: string
  agentId: string
  agentName: string
  model: string
  status: LLMCallStatus
  systemPrompt: string
  userMessage: string
  responseText: string
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
  latencyMs?: number
  error?: string
  startedAt: number
}

// ─── Virtual File System ───────────────────────────────────────────────────────

export interface VfsFile {
  path: string
  content: string
  createdBy: string
  modifiedAt: number
  type: 'file' | 'dir'
}

// ─── Tool Simulation ──────────────────────────────────────────────────────────

export type ToolType =
  | 'Read'
  | 'Write'
  | 'Edit'
  | 'Bash'
  | 'Glob'
  | 'Grep'
  | 'LS'
  | 'WebSearch'
  | 'WebFetch'
  | 'Agent'
  | 'TodoRead'
  | 'TodoWrite'
  | 'TaskCreate'

export interface ToolCall {
  id: string
  agentId: string
  tool: ToolType
  args: Record<string, unknown>
  result: string
  timestamp: number
  status: 'ok' | 'error'
}

export interface McpToolGroup {
  id: string
  name: string
  toolNames: string[]
}
