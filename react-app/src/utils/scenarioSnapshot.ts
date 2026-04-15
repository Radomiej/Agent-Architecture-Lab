import type { CanvasNode, Connection, SavedConfig } from '../types'
import type { PresetDef } from '../data/presets'

export interface CanvasExport {
  nodes: CanvasNode[]
  connections: Connection[]
  version: string
  exportedAt: string
}

/** Encodes canvas state to a URL-safe base64 string for sharing. */
export function encodeCanvasToHash(nodes: CanvasNode[], connections: Connection[]): string {
  const payload: CanvasExport = {
    nodes: nodes.map((n) => ({ ...n, connections: [...n.connections] })),
    connections: connections.map((c) => ({ ...c })),
    version: 'v33',
    exportedAt: new Date().toISOString(),
  }
  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)
  const b64 = btoa(String.fromCharCode(...bytes))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/** Decodes a hash string produced by encodeCanvasToHash. Returns null if invalid. */
export function decodeCanvasFromHash(hash: string): Pick<CanvasExport, 'nodes' | 'connections'> | null {
  try {
    const b64 = hash.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    const parsed = JSON.parse(json) as Partial<CanvasExport>
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.connections)) return null
    return { nodes: parsed.nodes, connections: parsed.connections }
  } catch {
    return null
  }
}

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
