import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { PresetDef } from '../data/presets'
import { cloneGraph, presetToGraph } from '../utils/scenarioSnapshot'

describe('scenarioSnapshot – cloneGraph', () => {
  it('returns a deep copy with v33 version tag', () => {
    const nodes = [{ id: 'n1', agentId: 'orchestrator', x: 10, y: 20, connections: [] }]
    const connections = [{ from: 'n1', to: 'n2' }]

    const snapshot = cloneGraph(nodes, connections)

    expect(snapshot.version).toBe('v33')
    expect(snapshot.nodes).toEqual(nodes)
    expect(snapshot.connections).toEqual(connections)
    expect(snapshot.nodes).not.toBe(nodes)
    expect(snapshot.connections).not.toBe(connections)
  })
})

describe('scenarioSnapshot – presetToGraph', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

  beforeEach(() => warnSpy.mockClear())
  afterEach(() => warnSpy.mockClear())

  it('maps preset nodes and valid connections to graph', () => {
    const preset: PresetDef = {
      id: 'mini',
      name: 'Mini',
      cat: 'TEST',
      desc: 'test preset',
      nodes: [
        { id: 'orchestrator', x: 100, y: 100, c: [1] },
        { id: 'backend', x: 200, y: 200 },
      ],
    }

    const graph = presetToGraph(preset, 123)

    expect(graph.nodes).toHaveLength(2)
    expect(graph.nodes[0].id).toBe('orchestrator-123-0')
    expect(graph.nodes[1].id).toBe('backend-123-1')
    expect(graph.connections).toEqual([{ from: 'orchestrator-123-0', to: 'backend-123-1' }])
  })

  it('skips out-of-bounds connection indices and warns', () => {
    const preset: PresetDef = {
      id: 'bad',
      name: 'Bad',
      cat: 'TEST',
      desc: '',
      nodes: [
        { id: 'orchestrator', x: 0, y: 0, c: [99] },
      ],
    }

    const graph = presetToGraph(preset, 555)

    expect(graph.connections).toHaveLength(0)
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})
