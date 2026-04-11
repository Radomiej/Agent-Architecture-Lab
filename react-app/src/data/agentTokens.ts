import type { ModelType, ModelCostsMap, CanvasNode } from '../types'

export const MODEL_COSTS: ModelCostsMap = {
  opus:   { i: 5,   o: 25,  cr: 0.5,  cw: 6.25 },
  sonnet: { i: 3,   o: 15,  cr: 0.3,  cw: 3.75 },
  haiku:  { i: 1,   o: 5,   cr: 0.1,  cw: 1.25 },
}

export const MODEL_CTX: Record<ModelType, number> = {
  opus:   1_000_000,
  sonnet: 1_000_000,
  haiku:  200_000,
}

export const CTX_BASELINE = {
  systemPrompt: 6200,
  builtInTools: 11600,
  memoryFiles:  3300,
  subagentRole: 1000,
  skills:       300,
}

export const CTX_BASELINE_TOTAL = 22_400

export const CTX_SEVERITY = { safe: 0.50, warn: 0.65, high: 0.75, danger: 0.80 }

export const CTX_PREMIUM_TARGET = 0.50

export const COST_VARIANCE = 0.4
export const COST_CACHE_PCT = 0.3

export const AGENT_TOKENS: Record<string, { i: number; o: number }> = {
  orchestrator:           { i: 65000,  o: 6000  },
  synthesizer:            { i: 80000,  o: 10000 },
  analyst:                { i: 50000,  o: 6000  },
  planner:                { i: 40000,  o: 8000  },
  res_tech:               { i: 35000,  o: 3000  },
  res_ux:                 { i: 35000,  o: 3000  },
  res_reddit:             { i: 35000,  o: 3000  },
  res_x:                  { i: 35000,  o: 3000  },
  res_github:             { i: 35000,  o: 3000  },
  res_forums:             { i: 35000,  o: 3000  },
  res_docs:               { i: 35000,  o: 3000  },
  res_critic:             { i: 45000,  o: 5000  },
  backend:                { i: 80000,  o: 15000 },
  frontend:               { i: 80000,  o: 15000 },
  feature:                { i: 60000,  o: 12000 },
  designer:               { i: 40000,  o: 6000  },
  integrator:             { i: 50000,  o: 8000  },
  writer:                 { i: 35000,  o: 6000  },
  qa_security:            { i: 45000,  o: 5000  },
  qa_quality:             { i: 45000,  o: 5000  },
  qa_perf:                { i: 45000,  o: 5000  },
  qa_manager:             { i: 30000,  o: 3000  },
  expert_pragmatist:      { i: 30000,  o: 4000  },
  expert_innovator:       { i: 30000,  o: 4000  },
  expert_analyst:         { i: 30000,  o: 4000  },
  expert_user:            { i: 30000,  o: 4000  },
  expert_devil:           { i: 30000,  o: 4000  },
  decision_presenter:     { i: 12000,  o: 2000  },
  db_architect:           { i: 50000,  o: 8000  },
  observability_engineer: { i: 40000,  o: 6000  },
  gtm_strategist:         { i: 30000,  o: 5000  },
  statistician:           { i: 20000,  o: 4000  },
  eda_analyst:            { i: 50000,  o: 8000  },
  control_mapper:         { i: 30000,  o: 5000  },
  telemetry_surfer:       { i: 35000,  o: 4000  },
}

export function calcAgentCost(agentId: string, model: ModelType = 'sonnet'): { p50: number; p90: number } {
  const tok = AGENT_TOKENS[agentId] ?? { i: 30000, o: 5000 }
  const costs = MODEL_COSTS[model]
  const tokInM = tok.i / 1_000_000
  const tokOutM = tok.o / 1_000_000
  const p50 = tokInM * costs.i + tokOutM * costs.o
  const p90 = p50 * (1 + COST_VARIANCE)
  return { p50, p90 }
}

export function calcTotalCost(nodes: CanvasNode[]): { p50: number; p90: number } {
  let p50 = 0
  let p90 = 0
  for (const node of nodes) {
    const res = calcAgentCost(node.agentId)
    p50 += res.p50
    p90 += res.p90
  }
  return { p50, p90 }
}

export function calcAgentCtx(agentId: string, model: ModelType = 'sonnet'): { used: number; window: number; pct: number } {
  const tok = AGENT_TOKENS[agentId] ?? { i: 30000, o: 5000 }
  const used = CTX_BASELINE_TOTAL + tok.i
  const window = MODEL_CTX[model]
  return { used, window, pct: used / window }
}

export function getCtxSeverity(pct: number): 'safe' | 'warn' | 'high' | 'danger' {
  if (pct >= CTX_SEVERITY.danger) return 'danger'
  if (pct >= CTX_SEVERITY.high) return 'high'
  if (pct >= CTX_SEVERITY.warn) return 'warn'
  return 'safe'
}

export function fmtTok(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1000)}k`
  return String(n)
}

export function fmtCost(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`
  if (n < 1) return `$${n.toFixed(3)}`
  return `$${n.toFixed(2)}`
}
