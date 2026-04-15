import { create } from 'zustand'
import { useCanvasStore } from './canvasStore'
import { useMcpStore } from './mcpStore'
import { AD_MAP } from '../data/agents'
import { resolveAgentTools } from '../utils/resolveAgentTools'
import type { CanvasNode } from '../types'

/** Phase execution rank — lower = runs first. */
export const PHASE_RANK: Record<string, number> = {
  strategy: 0,
  research: 1,
  debate1: 2,
  debate2: 3,
  build: 4,
  qa: 5,
  hitl: 6,
}

interface OrchestrationStore {
  /** Phase of the currently executing (or last executed) agent. */
  phase: string
  /** Node IDs currently being processed. */
  activeAgents: string[]
  /** Phases that have at least one finished agent. */
  completedPhases: string[]

  setPhase: (phase: string) => void
  setActiveAgents: (ids: string[]) => void
  completePhase: (phase: string) => void
  reset: () => void

  /**
   * Returns canvas nodes sorted by phase rank, then x, then y.
   * Reads from canvasStore at call time (not reactive — call inside actions).
   */
  getExecutionOrder: () => CanvasNode[]

  /**
   * Returns the resolved tool-name list for an agent, expanding any MCP tool-group
   * tokens and applying per-agent overrides from mcpStore.
   */
  getResolvedTools: (agentId: string) => string[]
}

export const useOrchestrationStore = create<OrchestrationStore>((set) => ({
  phase: 'strategy',
  activeAgents: [],
  completedPhases: [],

  setPhase: (phase) => set({ phase }),

  setActiveAgents: (ids) => set({ activeAgents: ids }),

  completePhase: (phase) =>
    set((s) => ({
      completedPhases: s.completedPhases.includes(phase)
        ? s.completedPhases
        : [...s.completedPhases, phase],
      phase,
    })),

  reset: () => set({ phase: 'strategy', activeAgents: [], completedPhases: [] }),

  getExecutionOrder: () => {
    const { nodes } = useCanvasStore.getState()
    return [...nodes]
      .filter((n) => AD_MAP.has(n.agentId))
      .sort((a, b) => {
        const aRank = PHASE_RANK[AD_MAP.get(a.agentId)?.phase ?? 'strategy'] ?? 99
        const bRank = PHASE_RANK[AD_MAP.get(b.agentId)?.phase ?? 'strategy'] ?? 99
        const diff = aRank - bRank
        if (diff !== 0) return diff
        if (a.x !== b.x) return a.x - b.x
        return a.y - b.y
      })
  },

  getResolvedTools: (agentId) => {
    const { agentToolOverrides, toolGroups } = useMcpStore.getState()
    const agentDef = AD_MAP.get(agentId)
    return resolveAgentTools(agentId, agentDef?.tools ?? '', agentToolOverrides, toolGroups)
  },
}))
