import type { CanvasNode, Connection, SavedConfig } from '../types'
import type { PresetDef } from '../data/presets'

export function cloneGraph(nodes: CanvasNode[], connections: Connection[]): SavedConfig['data'] {
  return {
    nodes: nodes.map((node) => ({ ...node, connections: [...node.connections] })),
    connections: connections.map((connection) => ({ ...connection })),
    version: 'v33',
  }
}

export function presetToGraph(preset: PresetDef, timestamp = Date.now()): Pick<SavedConfig['data'], 'nodes' | 'connections'> {
  const nodes: CanvasNode[] = preset.nodes.map((presetNode, idx) => ({
    id: `${presetNode.id}-${timestamp}-${idx}`,
    agentId: presetNode.id,
    x: presetNode.x,
    y: presetNode.y,
    connections: [],
  }))

  const connections: Connection[] = []
  preset.nodes.forEach((presetNode, idx) => {
    if (!presetNode.c) return
    for (const targetIdx of presetNode.c) {
      if (targetIdx < 0 || targetIdx >= nodes.length) {
        console.warn(`Preset "${preset.id}" node[${idx}] has out-of-bounds connection index ${targetIdx}`)
        continue
      }
      connections.push({ from: nodes[idx].id, to: nodes[targetIdx].id })
    }
  })

  return { nodes, connections }
}
