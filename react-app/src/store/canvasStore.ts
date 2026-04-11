import { create } from 'zustand'
import type { CanvasNode, Connection } from '../types'
import type { Preset } from '../types'

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
  loadPreset: (preset: Preset) => void
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  connections: [],
  selected: [],
  zoom: 1,
  pan: { x: 0, y: 0 },

  addNode: (node) =>
    set((s) => ({ nodes: [...s.nodes, node] })),

  removeNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      connections: s.connections.filter((c) => c.from !== id && c.to !== id),
      selected: s.selected.filter((sid) => sid !== id),
    })),

  moveNode: (id, x, y) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    })),

  addConnection: (from, to) =>
    set((s) => {
      const exists = s.connections.some((c) => c.from === from && c.to === to)
      if (exists) return s
      return { connections: [...s.connections, { from, to }] }
    }),

  removeConnection: (from, to) =>
    set((s) => ({
      connections: s.connections.filter((c) => !(c.from === from && c.to === to)),
    })),

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

  setZoom: (zoom) => set({ zoom: Math.max(0.2, Math.min(3, zoom)) }),

  setPan: (pan) => set({ pan }),

  clearCanvas: () => set({ nodes: [], connections: [], selected: [] }),

  loadPreset: (preset) => {
    const nodes: CanvasNode[] = preset.nodes.map((pn) => ({
      id: `${pn.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      agentId: pn.id,
      x: pn.x,
      y: pn.y,
      connections: pn.c ?? [],
    }))

    const idMap = new Map<string, string>()
    preset.nodes.forEach((pn, i) => idMap.set(pn.id, nodes[i].id))

    const connections: Connection[] = []
    nodes.forEach((node, i) => {
      const pn = preset.nodes[i]
      if (pn.c) {
        pn.c.forEach((targetPresetId) => {
          const targetNodeId = idMap.get(targetPresetId)
          if (targetNodeId) {
            connections.push({ from: node.id, to: targetNodeId })
          }
        })
      }
      node.connections = node.connections
        .map((cid) => idMap.get(cid) ?? cid)
        .filter(Boolean)
    })

    const { clearCanvas } = get()
    clearCanvas()
    set({ nodes, connections })
  },
}))
