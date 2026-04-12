import type { Agent, CanvasNode, Connection } from '../types'

export interface AgentContextOptions {
  currentNode: CanvasNode
  allNodes: CanvasNode[]
  connections: Connection[]
  agentMap: Map<string, Agent>
  presetName?: string
  phase?: string
}

/**
 * Builds a grounded user message for an LLM call based on the canvas state.
 * Tells the agent who its upstream/downstream peers are and what phase it is in.
 */
export function buildAgentContext(opts: AgentContextOptions): string {
  const { currentNode, allNodes, connections, agentMap, presetName, phase } = opts

  const currentAgent = agentMap.get(currentNode.agentId)
  if (!currentAgent) return 'Proceed with your task based on your role description.'

  // Find upstream agents (nodes that connect TO this node)
  const upstreamIds = connections
    .filter((c) => c.to === currentNode.id)
    .map((c) => c.from)

  const upstreamAgents = upstreamIds
    .map((id) => {
      const node = allNodes.find((n) => n.id === id)
      return node ? agentMap.get(node.agentId) : undefined
    })
    .filter((a): a is Agent => !!a)

  // Find downstream agents (nodes this node connects TO)
  const downstreamIds = connections
    .filter((c) => c.from === currentNode.id)
    .map((c) => c.to)

  const downstreamAgents = downstreamIds
    .map((id) => {
      const node = allNodes.find((n) => n.id === id)
      return node ? agentMap.get(node.agentId) : undefined
    })
    .filter((a): a is Agent => !!a)

  const parts: string[] = []

  if (presetName) {
    parts.push(`You are part of the "${presetName}" multi-agent pipeline.`)
  } else {
    parts.push('You are part of a multi-agent pipeline.')
  }

  if (phase) {
    parts.push(`Current execution phase: ${phase}.`)
  }

  if (upstreamAgents.length > 0) {
    const names = upstreamAgents.map((a) => a.name).join(', ')
    parts.push(`Your upstream agents (who have already completed their work and whose output you should incorporate): ${names}.`)
  }

  if (downstreamAgents.length > 0) {
    const names = downstreamAgents.map((a) => a.name).join(', ')
    parts.push(`Your downstream agents (who depend on your output): ${names}.`)
  }

  parts.push(`Your role: ${currentAgent.role}`)
  parts.push('Produce a focused, actionable output for your part of the pipeline. Be concise (max 300 words). Respond in the language of this message.')

  return parts.join('\n\n')
}
