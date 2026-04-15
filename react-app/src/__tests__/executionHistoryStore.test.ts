import { beforeEach, describe, expect, it } from 'vitest'
import { useExecutionHistoryStore } from '../store/executionHistoryStore'
import type { LLMCallLog, SimMessage, ToolCall } from '../types'

function makeLog(id: string): LLMCallLog {
  return {
    id,
    agentId: 'orchestrator',
    agentName: 'Orchestrator',
    model: 'claude-sonnet-4-5',
    status: 'pending',
    systemPrompt: 'You are…',
    userMessage: 'Do the thing',
    responseText: '',
    startedAt: Date.now(),
  }
}

function makeMsg(text: string): SimMessage {
  return { agentId: 'orchestrator', text, timestamp: Date.now(), phase: 'strategy' }
}

function makeToolCall(id: string): ToolCall {
  return { id, agentId: 'backend', tool: 'Read', args: {}, result: 'ok', timestamp: Date.now(), status: 'ok' }
}

describe('executionHistoryStore', () => {
  beforeEach(() => {
    useExecutionHistoryStore.setState({
      messages: [],
      executionLog: [],
      toolCalls: [],
      debugPanelOpen: false,
    })
  })

  // ─── Messages ─────────────────────────────────────────────────────────────

  it('addMessage appends to messages', () => {
    useExecutionHistoryStore.getState().addMessage(makeMsg('Hello'))
    expect(useExecutionHistoryStore.getState().messages).toHaveLength(1)
    expect(useExecutionHistoryStore.getState().messages[0].text).toBe('Hello')
  })

  it('clearMessages empties the list', () => {
    useExecutionHistoryStore.getState().addMessage(makeMsg('Hello'))
    useExecutionHistoryStore.getState().clearMessages()
    expect(useExecutionHistoryStore.getState().messages).toHaveLength(0)
  })

  // ─── Execution log ────────────────────────────────────────────────────────

  it('addLogEntry appends entry', () => {
    useExecutionHistoryStore.getState().addLogEntry(makeLog('l1'))
    expect(useExecutionHistoryStore.getState().executionLog).toHaveLength(1)
  })

  it('updateLogEntry patches the matching entry by id', () => {
    useExecutionHistoryStore.getState().addLogEntry(makeLog('l1'))
    useExecutionHistoryStore.getState().updateLogEntry('l1', { status: 'done', responseText: 'Result' })
    const entry = useExecutionHistoryStore.getState().executionLog.find((e) => e.id === 'l1')
    expect(entry?.status).toBe('done')
    expect(entry?.responseText).toBe('Result')
  })

  it('updateLogEntry does not affect other entries', () => {
    useExecutionHistoryStore.getState().addLogEntry(makeLog('l1'))
    useExecutionHistoryStore.getState().addLogEntry(makeLog('l2'))
    useExecutionHistoryStore.getState().updateLogEntry('l1', { status: 'error' })
    const l2 = useExecutionHistoryStore.getState().executionLog.find((e) => e.id === 'l2')
    expect(l2?.status).toBe('pending')
  })

  it('clearLog empties executionLog', () => {
    useExecutionHistoryStore.getState().addLogEntry(makeLog('l1'))
    useExecutionHistoryStore.getState().clearLog()
    expect(useExecutionHistoryStore.getState().executionLog).toHaveLength(0)
  })

  // ─── Tool calls ───────────────────────────────────────────────────────────

  it('addToolCall appends a call', () => {
    useExecutionHistoryStore.getState().addToolCall(makeToolCall('t1'))
    expect(useExecutionHistoryStore.getState().toolCalls).toHaveLength(1)
  })

  it('addToolCalls appends multiple calls', () => {
    useExecutionHistoryStore.getState().addToolCalls([makeToolCall('t1'), makeToolCall('t2')])
    expect(useExecutionHistoryStore.getState().toolCalls).toHaveLength(2)
  })

  it('clearToolCalls empties the list', () => {
    useExecutionHistoryStore.getState().addToolCalls([makeToolCall('t1'), makeToolCall('t2')])
    useExecutionHistoryStore.getState().clearToolCalls()
    expect(useExecutionHistoryStore.getState().toolCalls).toHaveLength(0)
  })

  // ─── Debug panel ──────────────────────────────────────────────────────────

  it('toggleDebugPanel flips debugPanelOpen', () => {
    expect(useExecutionHistoryStore.getState().debugPanelOpen).toBe(false)
    useExecutionHistoryStore.getState().toggleDebugPanel()
    expect(useExecutionHistoryStore.getState().debugPanelOpen).toBe(true)
    useExecutionHistoryStore.getState().toggleDebugPanel()
    expect(useExecutionHistoryStore.getState().debugPanelOpen).toBe(false)
  })

  it('setDebugPanelOpen sets an explicit value', () => {
    useExecutionHistoryStore.getState().setDebugPanelOpen(true)
    expect(useExecutionHistoryStore.getState().debugPanelOpen).toBe(true)
    useExecutionHistoryStore.getState().setDebugPanelOpen(false)
    expect(useExecutionHistoryStore.getState().debugPanelOpen).toBe(false)
  })
})
