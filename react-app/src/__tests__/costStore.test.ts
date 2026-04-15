import { describe, it, expect } from 'vitest'
import { useCostStore } from '../store/costStore'
import type { CanvasNode } from '../types'

function makeNode(id: string, agentId: string): CanvasNode {
  return { id, agentId, x: 0, y: 0, connections: [] }
}

describe('costStore', () => {
  it('returns zeroed cost summary for empty canvas', () => {
    const summary = useCostStore.getState().getCostSummary([])

    expect(summary.p50).toBe(0)
    expect(summary.p90).toBe(0)
    expect(summary.tokIn).toBe(0)
    expect(summary.tokOut).toBe(0)
    expect(summary.modelMix).toEqual({ opus: 0, sonnet: 0, haiku: 0 })
    expect(summary.severity).toBe('safe')
    expect(summary.perAgent).toHaveLength(0)
  })

  it('includes fallback sonnet model for unknown agents', () => {
    const nodes: CanvasNode[] = [
      makeNode('n1', 'orchestrator'),
      makeNode('n2', 'unknown-agent-id'),
    ]

    const summary = useCostStore.getState().getCostSummary(nodes)

    expect(summary.perAgent).toHaveLength(2)
    expect(summary.modelMix.sonnet).toBeGreaterThanOrEqual(1)
    expect(summary.p50).toBeGreaterThan(0)
    expect(summary.p90).toBeGreaterThan(summary.p50)
  })

  it('returns context summary with derived max/avg/severity', () => {
    const nodes: CanvasNode[] = [
      makeNode('n1', 'orchestrator'),
      makeNode('n2', 'backend'),
      makeNode('n3', 'unknown-agent-id'),
    ]

    const ctx = useCostStore.getState().getContextSummary(nodes)

    expect(ctx.perAgent).toHaveLength(3)
    expect(ctx.maxPct).toBeGreaterThanOrEqual(0)
    expect(ctx.avgPct).toBeGreaterThanOrEqual(0)
    expect(['safe', 'warn', 'high', 'danger']).toContain(ctx.severity)
    expect(typeof ctx.maxAgentId).toBe('string')
  })

  it('returns zeroed context summary for empty canvas', () => {
    const ctx = useCostStore.getState().getContextSummary([])

    expect(ctx.maxPct).toBe(0)
    expect(ctx.maxAgentId).toBe('')
    expect(ctx.overTargetCount).toBe(0)
    expect(ctx.avgPct).toBe(0)
    expect(ctx.severity).toBe('safe')
    expect(ctx.perAgent).toHaveLength(0)
  })
})
