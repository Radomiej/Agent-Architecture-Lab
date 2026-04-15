import { beforeEach, describe, expect, it } from 'vitest'
import { useOrchestrationStore } from '../store/orchestrationStore'

describe('orchestrationStore', () => {
  beforeEach(() => {
    useOrchestrationStore.setState({
      phase: 'strategy',
      activeAgents: [],
      completedPhases: [],
    })
  })

  it('setActiveAgents replaces the current list', () => {
    useOrchestrationStore.getState().setActiveAgents(['n1', 'n2'])
    expect(useOrchestrationStore.getState().activeAgents).toEqual(['n1', 'n2'])
  })

  it('completePhase appends phase and updates current phase', () => {
    useOrchestrationStore.getState().completePhase('build')
    const state = useOrchestrationStore.getState()
    expect(state.completedPhases).toContain('build')
    expect(state.phase).toBe('build')
  })

  it('completePhase is idempotent — does not duplicate entries', () => {
    useOrchestrationStore.getState().completePhase('qa')
    useOrchestrationStore.getState().completePhase('qa')
    expect(useOrchestrationStore.getState().completedPhases.filter((p) => p === 'qa')).toHaveLength(1)
  })

  it('reset clears phase, activeAgents and completedPhases', () => {
    useOrchestrationStore.getState().completePhase('build')
    useOrchestrationStore.getState().setActiveAgents(['n1'])
    useOrchestrationStore.getState().reset()
    const state = useOrchestrationStore.getState()
    expect(state.phase).toBe('strategy')
    expect(state.activeAgents).toHaveLength(0)
    expect(state.completedPhases).toHaveLength(0)
  })
})
