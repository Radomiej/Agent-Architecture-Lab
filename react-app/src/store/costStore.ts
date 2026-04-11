import { create } from 'zustand'
import type { CanvasNode, ModelType } from '../types'
import { AD_MAP } from '../data/agents'
import {
  calcAgentCost,
  calcAgentCtx,
  getCtxSeverity,
  fmtCost,
  fmtTok,
  MODEL_COSTS,
} from '../data/agentTokens'

export interface CostSummary {
  p50: number
  p90: number
  p50Fmt: string
  p90Fmt: string
  tokIn: number
  tokOut: number
  tokInFmt: string
  tokOutFmt: string
  modelMix: Record<ModelType, number>
  severity: 'safe' | 'warn' | 'high' | 'danger'
  perAgent: { agentId: string; nodeId: string; model: ModelType; p50: number; p90: number }[]
}

export interface CtxSummary {
  maxPct: number
  maxAgentId: string
  overTargetCount: number
  avgPct: number
  severity: 'safe' | 'warn' | 'high' | 'danger'
  perAgent: { agentId: string; nodeId: string; used: number; window: number; pct: number; sev: string }[]
}

interface CostStore {
  getCostSummary: (nodes: CanvasNode[]) => CostSummary
  getContextSummary: (nodes: CanvasNode[]) => CtxSummary
}

export const useCostStore = create<CostStore>(() => ({
  getCostSummary: (nodes) => {
    let p50 = 0
    let p90 = 0
    let tokIn = 0
    let tokOut = 0
    const modelMix: Record<ModelType, number> = { opus: 0, sonnet: 0, haiku: 0 }
    const perAgent: CostSummary['perAgent'] = []

    for (const node of nodes) {
      const agentDef = AD_MAP.get(node.agentId)
      const model: ModelType = agentDef?.model ?? 'sonnet'
      const res = calcAgentCost(node.agentId, model)
      const costs = MODEL_COSTS[model]
      const tok = { i: 30000, o: 5000 }
      p50 += res.p50
      p90 += res.p90
      tokIn += tok.i
      tokOut += tok.o
      modelMix[model] = (modelMix[model] ?? 0) + 1
      perAgent.push({ agentId: node.agentId, nodeId: node.id, model, p50: res.p50, p90: res.p90 })
      void costs
    }

    const severity = p50 < 0.5 ? 'safe' : p50 < 2 ? 'warn' : p50 < 5 ? 'high' : 'danger'

    return {
      p50, p90,
      p50Fmt: fmtCost(p50),
      p90Fmt: fmtCost(p90),
      tokIn, tokOut,
      tokInFmt: fmtTok(tokIn),
      tokOutFmt: fmtTok(tokOut),
      modelMix,
      severity,
      perAgent,
    }
  },

  getContextSummary: (nodes) => {
    let maxPct = 0
    let maxAgentId = ''
    let overTargetCount = 0
    let totalPct = 0
    const perAgent: CtxSummary['perAgent'] = []

    for (const node of nodes) {
      const agentDef = AD_MAP.get(node.agentId)
      const model: ModelType = agentDef?.model ?? 'sonnet'
      const { used, window, pct } = calcAgentCtx(node.agentId, model)
      const sev = getCtxSeverity(pct)
      perAgent.push({ agentId: node.agentId, nodeId: node.id, used, window, pct, sev })
      if (pct > maxPct) { maxPct = pct; maxAgentId = node.agentId }
      if (pct > 0.5) overTargetCount++
      totalPct += pct
    }

    const avgPct = nodes.length > 0 ? totalPct / nodes.length : 0
    const severity = getCtxSeverity(maxPct)

    return { maxPct, maxAgentId, overTargetCount, avgPct, severity, perAgent }
  },
}))
