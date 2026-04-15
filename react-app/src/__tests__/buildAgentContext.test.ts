import { describe, it, expect } from 'vitest'
import { buildAgentContext } from '../utils/buildAgentContext'
import type { Agent, CanvasNode, Connection } from '../types'

// ─── test fixtures ─────────────────────────────────────────────────────────────

const ORCHESTRATOR: Agent = {
  id: 'orchestrator',
  name: 'Orchestrator',
  cat: 'STRATEGY',
  icon: '🎯',
  color: '#F59E0B',
  model: 'opus',
  load: 5,
  phase: 'strategy',
  role: 'Coordinate the multi-agent pipeline',
  tools: 'Task, Read, Write',
  prompt: 'You are the Orchestrator.',
}

const RESEARCHER: Agent = {
  id: 'researcher',
  name: 'Tech Researcher',
  cat: 'RESEARCH',
  icon: '🔬',
  color: '#22C4E6',
  model: 'sonnet',
  load: 3,
  phase: 'research',
  role: 'Conduct technical research',
  tools: 'WebSearch, Read',
  prompt: 'You are the Researcher.',
}

const BUILDER: Agent = {
  id: 'builder',
  name: 'Backend Developer',
  cat: 'BUILD',
  icon: '🔧',
  color: '#34D399',
  model: 'sonnet',
  load: 4,
  phase: 'build',
  role: 'Implement the backend service',
  tools: 'Write, Bash',
  prompt: 'You are the Builder.',
}

function makeNode(id: string, agentId: string): CanvasNode {
  return { id, agentId, x: 0, y: 0, connections: [] }
}

function makeAgentMap(...agents: Agent[]): Map<string, Agent> {
  return new Map(agents.map((a) => [a.id, a]))
}

// ─── buildAgentContext ─────────────────────────────────────────────────────────

describe('buildAgentContext', () => {
  it('returns fallback message when the current agent is not in agentMap', () => {
    const node = makeNode('n1', 'unknown_agent')
    const result = buildAgentContext({
      currentNode: node,
      allNodes: [node],
      connections: [],
      agentMap: new Map(),
    })
    expect(result).toBe('Proceed with your task based on your role description.')
  })

  it('includes agent role in output', () => {
    const node = makeNode('n1', 'orchestrator')
    const result = buildAgentContext({
      currentNode: node,
      allNodes: [node],
      connections: [],
      agentMap: makeAgentMap(ORCHESTRATOR),
    })
    expect(result).toContain(ORCHESTRATOR.role)
  })

  it('does not mention upstream or downstream when no connections exist', () => {
    const node = makeNode('n1', 'orchestrator')
    const result = buildAgentContext({
      currentNode: node,
      allNodes: [node],
      connections: [],
      agentMap: makeAgentMap(ORCHESTRATOR),
    })
    expect(result).not.toContain('upstream')
    expect(result).not.toContain('downstream')
  })

  it('includes preset name when provided', () => {
    const node = makeNode('n1', 'orchestrator')
    const result = buildAgentContext({
      currentNode: node,
      allNodes: [node],
      connections: [],
      agentMap: makeAgentMap(ORCHESTRATOR),
      presetName: 'My Awesome Preset',
    })
    expect(result).toContain('"My Awesome Preset"')
  })

  it('uses generic pipeline description when presetName is omitted', () => {
    const node = makeNode('n1', 'orchestrator')
    const result = buildAgentContext({
      currentNode: node,
      allNodes: [node],
      connections: [],
      agentMap: makeAgentMap(ORCHESTRATOR),
    })
    expect(result).toContain('multi-agent pipeline')
    expect(result).not.toContain('"')
  })

  it('includes phase label when provided', () => {
    const node = makeNode('n1', 'orchestrator')
    const result = buildAgentContext({
      currentNode: node,
      allNodes: [node],
      connections: [],
      agentMap: makeAgentMap(ORCHESTRATOR),
      phase: 'Research',
    })
    expect(result).toContain('Research')
    expect(result).toContain('execution phase')
  })

  it('does not include phase line when phase is omitted', () => {
    const node = makeNode('n1', 'orchestrator')
    const result = buildAgentContext({
      currentNode: node,
      allNodes: [node],
      connections: [],
      agentMap: makeAgentMap(ORCHESTRATOR),
    })
    expect(result).not.toContain('execution phase')
  })

  it('lists upstream agent names when a node connects TO the current node', () => {
    const orchestratorNode = makeNode('n1', 'orchestrator')
    const researcherNode   = makeNode('n2', 'researcher')
    const conn: Connection = { from: 'n2', to: 'n1' } // researcher → orchestrator
    const result = buildAgentContext({
      currentNode: orchestratorNode,
      allNodes: [orchestratorNode, researcherNode],
      connections: [conn],
      agentMap: makeAgentMap(ORCHESTRATOR, RESEARCHER),
    })
    expect(result).toContain('upstream')
    expect(result).toContain(RESEARCHER.name)
  })

  it('lists downstream agent names when the current node connects TO another node', () => {
    const orchestratorNode = makeNode('n1', 'orchestrator')
    const builderNode      = makeNode('n2', 'builder')
    const conn: Connection = { from: 'n1', to: 'n2' } // orchestrator → builder
    const result = buildAgentContext({
      currentNode: orchestratorNode,
      allNodes: [orchestratorNode, builderNode],
      connections: [conn],
      agentMap: makeAgentMap(ORCHESTRATOR, BUILDER),
    })
    expect(result).toContain('downstream')
    expect(result).toContain(BUILDER.name)
  })

  it('handles multiple upstream agents', () => {
    const targetNode     = makeNode('n3', 'builder')
    const upstream1Node  = makeNode('n1', 'orchestrator')
    const upstream2Node  = makeNode('n2', 'researcher')
    const connections: Connection[] = [
      { from: 'n1', to: 'n3' },
      { from: 'n2', to: 'n3' },
    ]
    const result = buildAgentContext({
      currentNode: targetNode,
      allNodes: [upstream1Node, upstream2Node, targetNode],
      connections,
      agentMap: makeAgentMap(ORCHESTRATOR, RESEARCHER, BUILDER),
    })
    expect(result).toContain(ORCHESTRATOR.name)
    expect(result).toContain(RESEARCHER.name)
  })

  it('silently ignores connections that reference missing nodes', () => {
    const node = makeNode('n1', 'orchestrator')
    // 'n99' does not exist in allNodes
    const conn: Connection = { from: 'n99', to: 'n1' }
    const result = buildAgentContext({
      currentNode: node,
      allNodes: [node],
      connections: [conn],
      agentMap: makeAgentMap(ORCHESTRATOR),
    })
    // Should not throw and should not mention upstream
    expect(result).not.toContain('upstream')
  })

  it('silently ignores connections that reference nodes whose agentId is missing from agentMap', () => {
    const currentNode = makeNode('n1', 'orchestrator')
    const orphanNode  = makeNode('n2', 'ghost_agent') // not in agentMap
    const conn: Connection = { from: 'n2', to: 'n1' }
    const result = buildAgentContext({
      currentNode: currentNode,
      allNodes: [currentNode, orphanNode],
      connections: [conn],
      agentMap: makeAgentMap(ORCHESTRATOR),
    })
    expect(result).not.toContain('upstream')
  })

  it('output ends with conciseness instruction', () => {
    const node = makeNode('n1', 'orchestrator')
    const result = buildAgentContext({
      currentNode: node,
      allNodes: [node],
      connections: [],
      agentMap: makeAgentMap(ORCHESTRATOR),
    })
    expect(result).toContain('Be thorough but structured.')
  })
})
