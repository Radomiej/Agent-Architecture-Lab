import { create } from 'zustand'
import type { SimMessage } from '../types'

interface SimulationStore {
  isRunning: boolean
  isPaused: boolean
  step: number
  phase: string
  messages: SimMessage[]
  activeAgents: string[]
  completedPhases: string[]
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
  nextStep: () => void
  addMessage: (msg: SimMessage) => void
  setActiveAgents: (ids: string[]) => void
  completePhase: (phase: string) => void
  reset: () => void
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  isRunning: false,
  isPaused: false,
  step: 0,
  phase: 'strategy',
  messages: [],
  activeAgents: [],
  completedPhases: [],

  start: () => set({ isRunning: true, isPaused: false, step: 0, messages: [], completedPhases: [], phase: 'strategy' }),
  stop: () => set({ isRunning: false, isPaused: false, activeAgents: [] }),
  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),

  nextStep: () =>
    set((s) => ({ step: s.step + 1 })),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages.slice(-200), msg] })),

  setActiveAgents: (ids) => set({ activeAgents: ids }),

  completePhase: (phase) =>
    set((s) => ({
      completedPhases: s.completedPhases.includes(phase)
        ? s.completedPhases
        : [...s.completedPhases, phase],
      phase,
    })),

  reset: () =>
    set({
      isRunning: false,
      isPaused: false,
      step: 0,
      phase: 'strategy',
      messages: [],
      activeAgents: [],
      completedPhases: [],
    }),
}))
