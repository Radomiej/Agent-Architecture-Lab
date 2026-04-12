import { describe, it, expect } from 'vitest'
import {
  MODEL_COSTS,
  MODEL_CTX,
  CTX_BASELINE_TOTAL,
  CTX_SEVERITY,
  COST_VARIANCE,
  AGENT_TOKENS,
  calcAgentCost,
  calcTotalCost,
  calcAgentCtx,
  getCtxSeverity,
  fmtTok,
  fmtCost,
} from '../data/agentTokens'
import type { CanvasNode } from '../types'

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeNode(id: string, agentId: string): CanvasNode {
  return { id, agentId, x: 0, y: 0, connections: [] }
}

// Fallback tokens used by calcAgentCost / calcAgentCtx for unknown agentIds.
// Named here so that if the implementation changes, the tests clearly reflect
// what the expected fallback value is.
const FALLBACK_INPUT_TOKENS  = 30_000
const FALLBACK_OUTPUT_TOKENS = 5_000

// ─── calcAgentCost ─────────────────────────────────────────────────────────────

describe('calcAgentCost', () => {
  it('returns correct p50 for a known agent with sonnet model', () => {
    const tok = AGENT_TOKENS['orchestrator']
    const costs = MODEL_COSTS['sonnet']
    const expectedP50 = (tok.i / 1_000_000) * costs.i + (tok.o / 1_000_000) * costs.o
    const { p50 } = calcAgentCost('orchestrator', 'sonnet')
    expect(p50).toBeCloseTo(expectedP50, 6)
  })

  it('p90 = p50 * (1 + COST_VARIANCE)', () => {
    const { p50, p90 } = calcAgentCost('backend', 'opus')
    expect(p90).toBeCloseTo(p50 * (1 + COST_VARIANCE), 6)
  })

  it('uses fallback tokens { i:30000, o:5000 } for unknown agentId', () => {
    const costs = MODEL_COSTS['haiku']
    const expectedP50 =
      (FALLBACK_INPUT_TOKENS / 1_000_000) * costs.i +
      (FALLBACK_OUTPUT_TOKENS / 1_000_000) * costs.o
    const { p50 } = calcAgentCost('unknown_agent_xyz', 'haiku')
    expect(p50).toBeCloseTo(expectedP50, 6)
  })

  it('defaults model to sonnet when not provided', () => {
    const explicit = calcAgentCost('planner', 'sonnet')
    const implicit = calcAgentCost('planner')
    expect(implicit.p50).toBeCloseTo(explicit.p50, 6)
    expect(implicit.p90).toBeCloseTo(explicit.p90, 6)
  })

  it('opus costs more than haiku for the same agent', () => {
    const opus = calcAgentCost('synthesizer', 'opus')
    const haiku = calcAgentCost('synthesizer', 'haiku')
    expect(opus.p50).toBeGreaterThan(haiku.p50)
  })

  it('p50 and p90 are both positive numbers', () => {
    const { p50, p90 } = calcAgentCost('qa_security', 'sonnet')
    expect(p50).toBeGreaterThan(0)
    expect(p90).toBeGreaterThan(0)
  })
})

// ─── calcTotalCost ─────────────────────────────────────────────────────────────

describe('calcTotalCost', () => {
  it('returns zeros for an empty node list', () => {
    const { p50, p90 } = calcTotalCost([])
    expect(p50).toBe(0)
    expect(p90).toBe(0)
  })

  it('sums cost for a single node', () => {
    const node = makeNode('n1', 'planner')
    const single = calcAgentCost('planner')
    const { p50, p90 } = calcTotalCost([node])
    expect(p50).toBeCloseTo(single.p50, 6)
    expect(p90).toBeCloseTo(single.p90, 6)
  })

  it('sums costs across multiple nodes', () => {
    const nodes = [makeNode('n1', 'orchestrator'), makeNode('n2', 'backend'), makeNode('n3', 'qa_quality')]
    const expected = ['orchestrator', 'backend', 'qa_quality'].reduce(
      (acc, id) => {
        const r = calcAgentCost(id)
        return { p50: acc.p50 + r.p50, p90: acc.p90 + r.p90 }
      },
      { p50: 0, p90: 0 },
    )
    const { p50, p90 } = calcTotalCost(nodes)
    expect(p50).toBeCloseTo(expected.p50, 6)
    expect(p90).toBeCloseTo(expected.p90, 6)
  })

  it('uses fallback cost for an unknown agentId inside a node', () => {
    const node = makeNode('n1', 'does_not_exist')
    const fallback = calcAgentCost('does_not_exist')
    const { p50 } = calcTotalCost([node])
    expect(p50).toBeCloseTo(fallback.p50, 6)
  })
})

// ─── calcAgentCtx ──────────────────────────────────────────────────────────────

describe('calcAgentCtx', () => {
  it('used = CTX_BASELINE_TOTAL + agent input tokens', () => {
    const tok = AGENT_TOKENS['synthesizer']
    const { used } = calcAgentCtx('synthesizer', 'sonnet')
    expect(used).toBe(CTX_BASELINE_TOTAL + tok.i)
  })

  it('window equals MODEL_CTX for the given model', () => {
    const { window } = calcAgentCtx('backend', 'opus')
    expect(window).toBe(MODEL_CTX['opus'])
  })

  it('pct = used / window', () => {
    const { used, window, pct } = calcAgentCtx('orchestrator', 'haiku')
    expect(pct).toBeCloseTo(used / window, 8)
  })

  it('haiku has smaller context window than opus', () => {
    const haiku = calcAgentCtx('planner', 'haiku')
    const opus = calcAgentCtx('planner', 'opus')
    expect(haiku.window).toBeLessThan(opus.window)
    expect(haiku.pct).toBeGreaterThan(opus.pct)
  })

  it('uses fallback tokens for unknown agentId', () => {
    const { used } = calcAgentCtx('nonexistent', 'sonnet')
    expect(used).toBe(CTX_BASELINE_TOTAL + FALLBACK_INPUT_TOKENS)
  })
})

// ─── getCtxSeverity ────────────────────────────────────────────────────────────

describe('getCtxSeverity', () => {
  it('returns safe below CTX_SEVERITY.safe threshold', () => {
    expect(getCtxSeverity(0)).toBe('safe')
    expect(getCtxSeverity(CTX_SEVERITY.safe - 0.01)).toBe('safe')
  })

  it('returns warn at CTX_SEVERITY.warn threshold', () => {
    expect(getCtxSeverity(CTX_SEVERITY.warn)).toBe('warn')
    expect(getCtxSeverity(CTX_SEVERITY.warn + 0.01)).toBe('warn')
  })

  it('returns high at CTX_SEVERITY.high threshold', () => {
    expect(getCtxSeverity(CTX_SEVERITY.high)).toBe('high')
    expect(getCtxSeverity(CTX_SEVERITY.high + 0.01)).toBe('high')
  })

  it('returns danger at or above CTX_SEVERITY.danger threshold', () => {
    expect(getCtxSeverity(CTX_SEVERITY.danger)).toBe('danger')
    expect(getCtxSeverity(1.0)).toBe('danger')
  })

  it('safe and warn boundaries do not overlap', () => {
    expect(getCtxSeverity(CTX_SEVERITY.safe)).toBe('safe')
    expect(getCtxSeverity(CTX_SEVERITY.warn - 0.001)).toBe('safe')
  })
})

// ─── fmtTok ────────────────────────────────────────────────────────────────────

describe('fmtTok', () => {
  it('formats numbers below 1000 as plain string', () => {
    expect(fmtTok(0)).toBe('0')
    expect(fmtTok(999)).toBe('999')
  })

  it('formats thousands with k suffix', () => {
    expect(fmtTok(1000)).toBe('1k')
    expect(fmtTok(35000)).toBe('35k')
    expect(fmtTok(999_999)).toBe('1000k')
  })

  it('formats millions with M suffix and one decimal', () => {
    expect(fmtTok(1_000_000)).toBe('1.0M')
    expect(fmtTok(1_500_000)).toBe('1.5M')
    expect(fmtTok(2_700_000)).toBe('2.7M')
  })
})

// ─── fmtCost ───────────────────────────────────────────────────────────────────

describe('fmtCost', () => {
  it('formats tiny values with 4 decimal places', () => {
    expect(fmtCost(0.001)).toBe('$0.0010')
    expect(fmtCost(0.0001)).toBe('$0.0001')
  })

  it('formats sub-dollar values with 3 decimal places', () => {
    expect(fmtCost(0.05)).toBe('$0.050')
    expect(fmtCost(0.999)).toBe('$0.999')
  })

  it('formats values >= $1 with 2 decimal places', () => {
    expect(fmtCost(1)).toBe('$1.00')
    expect(fmtCost(12.5)).toBe('$12.50')
    expect(fmtCost(100)).toBe('$100.00')
  })

  it('uses $ prefix in all cases', () => {
    for (const n of [0.0001, 0.5, 1, 10]) {
      expect(fmtCost(n)).toMatch(/^\$/)
    }
  })
})
