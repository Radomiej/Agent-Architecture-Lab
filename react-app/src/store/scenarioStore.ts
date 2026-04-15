import { create } from 'zustand'
import type { PresetDef } from '../data/presets'
import type { SavedConfig } from '../types'
import { useCanvasStore } from './canvasStore'
import { usePresetStore } from './presetStore'
import { cloneGraph, presetToGraph } from '../utils/scenarioSnapshot'

interface ScenarioStore {
  saveScenario: (name: string) => boolean
  restoreScenario: (name: string) => boolean
  restoreSnapshot: (snapshot: SavedConfig['data']) => void
  loadPresetScenario: (preset: PresetDef) => void
  deleteScenario: (name: string) => void
}

export const useScenarioStore = create<ScenarioStore>(() => ({
  saveScenario: (name) => {
    const safeName = name.trim()
    if (!safeName) return false

    const canvas = useCanvasStore.getState()
    const presetStore = usePresetStore.getState()
    const snapshot = cloneGraph(canvas.nodes, canvas.connections)

    presetStore.saveConfig(safeName, snapshot)
    return true
  },

  restoreScenario: (name) => {
    const presetStore = usePresetStore.getState()
    const canvas = useCanvasStore.getState()
    const cfg = presetStore.loadConfig(name)
    if (!cfg) return false

    canvas.replaceGraph(cfg.data.nodes, cfg.data.connections)
    return true
  },

  restoreSnapshot: (snapshot) => {
    const canvas = useCanvasStore.getState()
    canvas.replaceGraph(snapshot.nodes, snapshot.connections)
  },

  loadPresetScenario: (preset) => {
    const canvas = useCanvasStore.getState()
    const graph = presetToGraph(preset)
    canvas.replaceGraph(graph.nodes, graph.connections)
  },

  deleteScenario: (name) => {
    usePresetStore.getState().deleteConfig(name)
  },
}))
