import { create } from 'zustand'
import type { SimMessage, LLMCallLog, LLMCallStatus, ToolCall } from '../types'
import { callAgent } from '../services/llmService'
import { useLLMStore } from './llmStore'
import { useCanvasStore } from './canvasStore'
import { AD_MAP } from '../data/agents'
import { buildAgentContext } from '../utils/buildAgentContext'

interface SimulationStore {
  isRunning: boolean
  isPaused: boolean
  step: number
  phase: string
  messages: SimMessage[]
  activeAgents: string[]
  completedPhases: string[]
  executionLog: LLMCallLog[]
  toolCalls: ToolCall[]
  debugPanelOpen: boolean
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
  nextStep: () => void
  addMessage: (msg: SimMessage) => void
  setActiveAgents: (ids: string[]) => void
  completePhase: (phase: string) => void
  reset: () => void
  setDebugPanelOpen: (open: boolean) => void
  toggleDebugPanel: () => void
  addToolCall: (call: ToolCall) => void
  addToolCalls: (calls: ToolCall[]) => void
  /** Run a single agent node via the real LLM (debug mode). */
  runAgentLLM: (nodeId: string, presetName?: string) => Promise<void>
  _updateLog: (id: string, patch: Partial<LLMCallLog>) => void
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  isRunning: false,
  isPaused: false,
  step: 0,
  phase: 'strategy',
  messages: [],
  activeAgents: [],
  completedPhases: [],
  executionLog: [],
  toolCalls: [],
  debugPanelOpen: false,

  start: () => set({ isRunning: true, isPaused: false, step: 0, messages: [], completedPhases: [], toolCalls: [], phase: 'strategy' }),
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

  addToolCall: (call) =>
    set((s) => ({ toolCalls: [...s.toolCalls, call] })),

  addToolCalls: (calls) =>
    set((s) => ({ toolCalls: [...s.toolCalls, ...calls] })),

  reset: () =>
    set({
      isRunning: false,
      isPaused: false,
      step: 0,
      phase: 'strategy',
      messages: [],
      activeAgents: [],
      completedPhases: [],
      executionLog: [],
      toolCalls: [],
    }),

  setDebugPanelOpen: (open) => set({ debugPanelOpen: open }),
  toggleDebugPanel: () => set((s) => ({ debugPanelOpen: !s.debugPanelOpen })),

  _updateLog: (id, patch) =>
    set((s) => ({
      executionLog: s.executionLog.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  runAgentLLM: async (nodeId, presetName) => {
    const llm = useLLMStore.getState()
    const canvas = useCanvasStore.getState()

    // Graceful degradation: no key → skip
    if (!llm.apiKey) return

    const node = canvas.nodes.find((n) => n.id === nodeId)
    if (!node) return

    const agentDef = AD_MAP.get(node.agentId)
    if (!agentDef) return

    const logId = `${nodeId}-${Date.now()}`
    const userMessage = buildAgentContext({
      currentNode: node,
      allNodes: canvas.nodes,
      connections: canvas.connections,
      agentMap: AD_MAP,
      presetName,
      phase: agentDef.phase,
    })

    const log: LLMCallLog = {
      id: logId,
      agentId: agentDef.id,
      agentName: agentDef.name,
      model: llm.modelMap[agentDef.model] ?? agentDef.model,
      status: 'pending' as LLMCallStatus,
      systemPrompt: agentDef.prompt,
      userMessage,
      responseText: '',
      startedAt: Date.now(),
    }

    set((s) => ({
      executionLog: [...s.executionLog, log],
      debugPanelOpen: true,
      activeAgents: [...s.activeAgents.filter((id) => id !== nodeId), nodeId],
    }))

    // Add a placeholder message to the dialog timeline
    get().addMessage({ agentId: agentDef.id, text: '⏳ Calling LLM…', timestamp: Date.now(), phase: agentDef.phase })

    const { _updateLog, addMessage } = get()
    _updateLog(logId, { status: 'streaming' })

    let streamedText = ''

    const result = await callAgent({
      agentId: agentDef.id,
      systemPrompt: agentDef.prompt,
      userMessage,
      model: agentDef.model,
      apiKey: llm.apiKey,
      baseUrl: llm.baseUrl,
      modelMap: llm.modelMap,
      onChunk: (chunk) => {
        streamedText += chunk
        _updateLog(logId, { responseText: streamedText, status: 'streaming' })
        // Update the last message with streamed text preview
        set((s) => {
          const msgs = [...s.messages]
          const last = msgs[msgs.length - 1]
          if (last && last.agentId === agentDef.id) {
            msgs[msgs.length - 1] = { ...last, text: streamedText.slice(0, 200) }
          }
          return { messages: msgs }
        })
      },
    })

    if (result.ok) {
      _updateLog(logId, {
        status: 'done',
        responseText: result.text,
        usage: result.usage,
        latencyMs: result.latencyMs,
      })
      addMessage({ agentId: agentDef.id, text: result.text.slice(0, 200), timestamp: Date.now(), phase: agentDef.phase })
    } else {
      _updateLog(logId, {
        status: 'error',
        error: result.error,
        latencyMs: result.latencyMs,
      })
      addMessage({ agentId: agentDef.id, text: `❌ Error: ${result.error ?? 'Unknown error'}`, timestamp: Date.now(), phase: agentDef.phase })
    }

    set((s) => ({ activeAgents: s.activeAgents.filter((id) => id !== nodeId) }))
  },
}))
