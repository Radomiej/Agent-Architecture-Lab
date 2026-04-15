import { create } from 'zustand'
import type { LLMCallLog, LLMCallStatus, SimMessage, ToolCall } from '../types'

interface ExecutionHistoryStore {
  /** Dialog messages from both mock simulation and real pipeline. */
  messages: SimMessage[]
  /** Detailed per-call LLM logs (system prompt, user message, streamed response, usage). */
  executionLog: LLMCallLog[]
  /** Tool calls recorded during mock or real execution. */
  toolCalls: ToolCall[]
  /** Whether the debug/log panel is open. */
  debugPanelOpen: boolean

  addMessage: (msg: SimMessage) => void
  clearMessages: () => void

  addLogEntry: (entry: LLMCallLog) => void
  updateLogEntry: (id: string, patch: Partial<LLMCallLog>) => void
  clearLog: () => void

  addToolCall: (call: ToolCall) => void
  addToolCalls: (calls: ToolCall[]) => void
  clearToolCalls: () => void

  setDebugPanelOpen: (open: boolean) => void
  toggleDebugPanel: () => void
}

export const useExecutionHistoryStore = create<ExecutionHistoryStore>((set) => ({
  messages: [],
  executionLog: [],
  toolCalls: [],
  debugPanelOpen: false,

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages.slice(-200), msg] })),

  clearMessages: () => set({ messages: [] }),

  addLogEntry: (entry) =>
    set((s) => ({ executionLog: [...s.executionLog, entry] })),

  updateLogEntry: (id, patch) =>
    set((s) => ({
      executionLog: s.executionLog.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  clearLog: () => set({ executionLog: [] }),

  addToolCall: (call) =>
    set((s) => ({ toolCalls: [...s.toolCalls, call] })),

  addToolCalls: (calls) =>
    set((s) => ({ toolCalls: [...s.toolCalls, ...calls] })),

  clearToolCalls: () => set({ toolCalls: [] }),

  setDebugPanelOpen: (open) => set({ debugPanelOpen: open }),

  toggleDebugPanel: () => set((s) => ({ debugPanelOpen: !s.debugPanelOpen })),
}))

// Keep the legacy internal helper name working from callers that imported it
export const _updateLog = (id: string, patch: Partial<LLMCallLog>) =>
  useExecutionHistoryStore.getState().updateLogEntry(id, patch)

// Allow stores to access status type without re-importing types
export type { LLMCallStatus }
