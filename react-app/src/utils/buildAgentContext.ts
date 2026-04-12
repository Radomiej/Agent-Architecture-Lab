import type { Agent, CanvasNode, Connection } from '../types'

export interface AgentContextOptions {
  currentNode: CanvasNode
  allNodes: CanvasNode[]
  connections: Connection[]
  agentMap: Map<string, Agent>
  presetName?: string
  phase?: string
  /** Original user task that started the pipeline. Prepended as ## Task section. */
  userTask?: string
  /**
   * Actual LLM outputs from upstream agents, keyed by nodeId.
   * When provided, the full text is included in the context so each agent
   * can build on prior work rather than receiving only agent names.
   */
  upstreamResults?: Record<string, string>
}

/**
 * Builds a grounded user message for an LLM call based on the canvas state.
 * Tells the agent who its upstream/downstream peers are and what phase it is in.
 * When upstreamResults is provided, includes the actual text of each upstream agent.
 */
export function buildAgentContext(opts: AgentContextOptions): string {
  const { currentNode, allNodes, connections, agentMap, presetName, phase, userTask, upstreamResults } = opts

  const currentAgent = agentMap.get(currentNode.agentId)
  if (!currentAgent) return 'Proceed with your task based on your role description.'

  // Find upstream node IDs (nodes that connect TO this node)
  const upstreamNodeIds = connections
    .filter((c) => c.to === currentNode.id)
    .map((c) => c.from)

  // Pair each upstream node with its agent definition
  const upstreamPairs = upstreamNodeIds
    .map((id) => {
      const node = allNodes.find((n) => n.id === id)
      const agent = node ? agentMap.get(node.agentId) : undefined
      return node && agent ? { node, agent } : undefined
    })
    .filter((p): p is { node: CanvasNode; agent: Agent } => !!p)

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

  // ── User task (pipeline entrypoint) ────────────────────────────────────────
  if (userTask) {
    parts.push(`## Task\n${userTask}`)
  }

  // ── Pipeline identity ───────────────────────────────────────────────────────
  if (presetName) {
    parts.push(`You are part of the "${presetName}" multi-agent pipeline.`)
  } else {
    parts.push('You are part of a multi-agent pipeline.')
  }

  if (phase) {
    parts.push(`Current execution phase: ${phase}.`)
  }

  // ── Upstream results (actual text when available, names-only fallback) ─────
  if (upstreamPairs.length > 0) {
    if (upstreamResults) {
      const resultSections = upstreamPairs
        .map(({ node, agent }) => {
          const text = upstreamResults[node.id]
          if (text) {
            return `### Output from ${agent.name}\n${text}`
          }
          return `### ${agent.name}\n(no output available)`
        })
        .join('\n\n---\n\n')
      parts.push(`## Upstream Agent Outputs\n\n${resultSections}`)
    } else {
      const names = upstreamPairs.map(({ agent }) => agent.name).join(', ')
      parts.push(`Your upstream agents (who have already completed their work and whose output you should incorporate): ${names}.`)
    }
  }

  if (downstreamAgents.length > 0) {
    const names = downstreamAgents.map((a) => a.name).join(', ')
    parts.push(`Your downstream agents (who depend on your output): ${names}.`)
  }

  parts.push(`Your role: ${currentAgent.role}`)
  parts.push('Produce a focused, actionable output for your part of the pipeline. Respond in the language of the Task. Be thorough but structured.')

  return parts.join('\n\n')
}
