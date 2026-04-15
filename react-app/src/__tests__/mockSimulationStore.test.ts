import { beforeEach, describe, expect, it, vi } from 'vitest'

// Isolate the store from its cross-store side-effects in tests
vi.mock('../store/orchestrationStore', () => ({
  useOrchestrationStore: {
    getState: () => ({
      reset: vi.fn(),
      setActiveAgents: vi.fn(),
    }),
  },
}))

vi.mock('../store/executionHistoryStore', () => ({
  useExecutionHistoryStore: {
    getState: () => ({
      clearMessages: vi.fn(),
      clearLog: vi.fn(),
      clearToolCalls: vi.fn(),
    }),
  },
}))

import { useMockSimulationStore } from '../store/mockSimulationStore'

describe('mockSimulationStore', () => {
  beforeEach(() => {
    useMockSimulationStore.setState({ isRunning: false, isPaused: false, step: 0 })
  })

  it('start sets isRunning=true and resets step', () => {
    useMockSimulationStore.getState().start()
    const s = useMockSimulationStore.getState()
    expect(s.isRunning).toBe(true)
    expect(s.isPaused).toBe(false)
    expect(s.step).toBe(0)
  })

  it('pause and resume toggle isPaused', () => {
    useMockSimulationStore.getState().start()
    useMockSimulationStore.getState().pause()
    expect(useMockSimulationStore.getState().isPaused).toBe(true)

    useMockSimulationStore.getState().resume()
    expect(useMockSimulationStore.getState().isPaused).toBe(false)
  })

  it('nextStep increments step', () => {
    useMockSimulationStore.getState().nextStep()
    useMockSimulationStore.getState().nextStep()
    expect(useMockSimulationStore.getState().step).toBe(2)
  })

  it('stop sets isRunning=false', () => {
    useMockSimulationStore.getState().start()
    useMockSimulationStore.getState().stop()
    expect(useMockSimulationStore.getState().isRunning).toBe(false)
  })

  it('reset clears all mock state', () => {
    useMockSimulationStore.setState({ isRunning: true, isPaused: true, step: 5 })
    useMockSimulationStore.getState().reset()
    const s = useMockSimulationStore.getState()
    expect(s.isRunning).toBe(false)
    expect(s.isPaused).toBe(false)
    expect(s.step).toBe(0)
  })
})
