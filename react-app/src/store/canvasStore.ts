import { create } from 'zustand'
import type { CanvasNode, Connection } from '../types'
import type { PresetDef } from '../data/presets'
import { AD_MAP } from '../data/agents'

const LS_KEY = 'acCanvas'

interface CanvasPersisted {
  nodes: CanvasNode[]
  connections: Connection[]
  zoom: number
  pan: { x: number; y: number }
}

const DEFAULT_PERSISTED: CanvasPersisted = {
  nodes: [],
  connections: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
}

function loadCanvas(): CanvasPersisted {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT_PERSISTED
    const parsed = JSON.parse(raw) as Partial<CanvasPersisted>

    const nodes = Array.isArray(parsed.nodes)
      ? parsed.nodes.filter((node): node is CanvasNode => {
        return !!node && typeof node.id === 'string' && typeof node.agentId === 'string' && AD_MAP.has(node.agentId)
      })
      : []

    const validNodeIds = new Set(nodes.map((node) => node.id))
    const connections = Array.isArray(parsed.connections)
      ? parsed.connections.filter((connection): connection is Connection => {
        return !!connection
          && typeof connection.from === 'string'
          && typeof connection.to === 'string'
          && validNodeIds.has(connection.from)
          && validNodeIds.has(connection.to)
      })
      : []

    const zoom = typeof parsed.zoom === 'number' ? Math.max(0.2, Math.min(3, parsed.zoom)) : 1
    const pan = parsed.pan && typeof parsed.pan.x === 'number' && typeof parsed.pan.y === 'number'
      ? parsed.pan
      : { x: 0, y: 0 }

    return { nodes, connections, zoom, pan }
  } catch {
    return DEFAULT_PERSISTED
  }
}

function saveCanvas(data: CanvasPersisted): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

const initialCanvas = loadCanvas()

interface CanvasStore {
  nodes: CanvasNode[]
  connections: Connection[]
  selected: string[]
  zoom: number
  pan: { x: number; y: number }
  addNode: (node: CanvasNode) => void
  removeNode: (id: string) => void
  moveNode: (id: string, x: number, y: number) => void
  addConnection: (from: string, to: string) => void
  removeConnection: (from: string, to: string) => void
  selectNode: (id: string, multi?: boolean) => void
  selectAll: () => void
  clearSelection: () => void
  setZoom: (zoom: number) => void
  setPan: (pan: { x: number; y: number }) => void
  clearCanvas: () => void
  loadPreset: (preset: PresetDef) => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  nodes: initialCanvas.nodes,
  connections: initialCanvas.connections,
  selected: [],
  zoom: initialCanvas.zoom,
  pan: initialCanvas.pan,

  addNode: (node) =>
    set((s) => {
      const nextNodes = [...s.nodes, node]
      saveCanvas({ nodes: nextNodes, connections: s.connections, zoom: s.zoom, pan: s.pan })
      return { nodes: nextNodes }
    }),

  removeNode: (id) =>
    set((s) => {
      const nodes = s.nodes.filter((n) => n.id !== id)
      const connections = s.connections.filter((c) => c.from !== id && c.to !== id)
      saveCanvas({ nodes, connections, zoom: s.zoom, pan: s.pan })
      return {
        nodes,
        connections,
        selected: s.selected.filter((sid) => sid !== id),
      }
    }),

  moveNode: (id, x, y) =>
    set((s) => {
      const nodes = s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n))
      saveCanvas({ nodes, connections: s.connections, zoom: s.zoom, pan: s.pan })
      return { nodes }
    }),

  addConnection: (from, to) =>
    set((s) => {
      const exists = s.connections.some((c) => c.from === from && c.to === to)
      if (exists) return s
      const connections = [...s.connections, { from, to }]
      saveCanvas({ nodes: s.nodes, connections, zoom: s.zoom, pan: s.pan })
      return { connections }
    }),

  removeConnection: (from, to) =>
    set((s) => {
      const connections = s.connections.filter((c) => !(c.from === from && c.to === to))
      saveCanvas({ nodes: s.nodes, connections, zoom: s.zoom, pan: s.pan })
      return { connections }
    }),

  selectNode: (id, multi = false) =>
    set((s) => {
      if (multi) {
        const already = s.selected.includes(id)
        return { selected: already ? s.selected.filter((sid) => sid !== id) : [...s.selected, id] }
      }
      return { selected: [id] }
    }),

  selectAll: () =>
    set((s) => ({ selected: s.nodes.map((n) => n.id) })),

  clearSelection: () => set({ selected: [] }),

  setZoom: (zoom) => set((s) => {
    const nextZoom = Math.max(0.2, Math.min(3, zoom))
    saveCanvas({ nodes: s.nodes, connections: s.connections, zoom: nextZoom, pan: s.pan })
    return { zoom: nextZoom }
  }),

  setPan: (pan) => set((s) => {
    saveCanvas({ nodes: s.nodes, connections: s.connections, zoom: s.zoom, pan })
    return { pan }
  }),

  clearCanvas: () => {
    saveCanvas(DEFAULT_PERSISTED)
    set({ nodes: [], connections: [], selected: [], zoom: 1, pan: { x: 0, y: 0 } })
  },

  loadPreset: (preset) => {
    const ts = Date.now()
    const nodes: CanvasNode[] = preset.nodes.map((pn, i) => ({
      id: `${pn.id}-${ts}-${i}`,
      agentId: pn.id,
      x: pn.x,
      y: pn.y,
      connections: [],
    }))

    const connections: Connection[] = []
    preset.nodes.forEach((pn, i) => {
      if (pn.c) {
        for (const targetIdx of pn.c) {
          if (targetIdx < 0 || targetIdx >= nodes.length) {
            console.warn(`Preset "${preset.id}" node[${i}] has out-of-bounds connection index ${targetIdx}`)
            continue
          }
          const targetNode = nodes[targetIdx]
          if (targetNode) {
            connections.push({ from: nodes[i].id, to: targetNode.id })
          }
        }
      }
    })

    saveCanvas({ nodes, connections, zoom: 1, pan: { x: 0, y: 0 } })
    set({ nodes, connections, selected: [], zoom: 1, pan: { x: 0, y: 0 } })
  },
}))
