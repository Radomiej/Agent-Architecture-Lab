import { create } from 'zustand'
import { useOrchestrationStore } from './orchestrationStore'
import { useExecutionHistoryStore } from './executionHistoryStore'

interface MockSimulationStore {
  /** Whether the step-by-step demo simulation is running. */
  isRunning: boolean
  /** Whether the demo is paused mid-run. */
  isPaused: boolean
  /** Current agent index in the execution order. */
  step: number

  /** Start the demo simulation. Resets orchestration state and clears message history. */
  start: () => void
  /** Stop the demo simulation. */
  stop: () => void
  pause: () => void
  resume: () => void
  nextStep: () => void
  /** Full reset — clears demo state, orchestration and execution history. */
  reset: () => void
}

export const useMockSimulationStore = create<MockSimulationStore>((set) => ({
  isRunning: false,
  isPaused: false,
  step: 0,

  start: () => {
    useOrchestrationStore.getState().reset()
    useExecutionHistoryStore.getState().clearMessages()
    useExecutionHistoryStore.getState().clearToolCalls()
    set({ isRunning: true, isPaused: false, step: 0 })
  },

  stop: () => {
    useOrchestrationStore.getState().setActiveAgents([])
    set({ isRunning: false, isPaused: false })
  },

  pause: () => set({ isPaused: true }),

  resume: () => set({ isPaused: false }),

  nextStep: () => set((s) => ({ step: s.step + 1 })),

  reset: () => {
    useOrchestrationStore.getState().reset()
    useExecutionHistoryStore.getState().clearMessages()
    useExecutionHistoryStore.getState().clearLog()
    useExecutionHistoryStore.getState().clearToolCalls()
    set({ isRunning: false, isPaused: false, step: 0 })
  },
}))
