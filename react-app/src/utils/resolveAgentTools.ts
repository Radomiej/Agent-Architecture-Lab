import type { McpToolGroup } from '../types'

export function getAgentToolTokens(
  agentId: string,
  baseTools: string,
  overrides: Record<string, string[]>,
): string[] {
  const fromOverride = overrides[agentId]
  if (Array.isArray(fromOverride)) {
    return Array.from(new Set(fromOverride.map((tool) => tool.trim()).filter(Boolean)))
  }
  return Array.from(new Set(baseTools.split(',').map((tool) => tool.trim()).filter(Boolean)))
}

export function resolveAgentTools(
  agentId: string,
  baseTools: string,
  overrides: Record<string, string[]>,
  groups: McpToolGroup[],
): string[] {
  const tokens = getAgentToolTokens(agentId, baseTools, overrides)
  const groupMap = new Map(groups.map((group) => [group.name, group.toolNames]))

  const expanded: string[] = []
  for (const token of tokens) {
    const toolsFromGroup = groupMap.get(token)
    if (toolsFromGroup && toolsFromGroup.length > 0) {
      expanded.push(...toolsFromGroup)
      continue
    }
    expanded.push(token)
  }

  return Array.from(new Set(expanded.map((tool) => tool.trim()).filter(Boolean)))
}
