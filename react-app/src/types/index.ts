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

export interface LLMConfig {
  apiKey: string
  baseUrl: string
  modelMap: Record<ModelType, string>
  debugMode: boolean
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
