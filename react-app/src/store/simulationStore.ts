import { create } from 'zustand'
import type { SimMessage, LLMCallLog, LLMCallStatus, ToolCall, CanvasNode, Connection } from '../types'
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
  /** Results keyed by nodeId from a real pipeline run */
  agentResults: Record<string, string>
  /** Whether a real LLM pipeline is currently executing */
  isPipelineRunning: boolean
  /** Current loop iteration (1-based) during a looped pipeline run */
  loopCount: number
  /** Maximum loops (1 = single run, -1 = infinite) */
  loopMax: number
  /** AbortController for cancelling in-flight pipeline calls */
  _pipelineAbort: AbortController | null
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
  /**
   * Run the entire pipeline sequentially via real LLM calls.
   * Agents execute in phase order; each agent receives the original user task
   * plus the actual output of all upstream agents (via connections).
   * If an orchestrator node is present it runs first and its output is
   * propagated as primary context to all subsequent agents.
   */
  runPipelineLLM: (
    userTask: string,
    simulationOrder: CanvasNode[],
    connections: Connection[],
    opts?: { presetName?: string; loops?: number },
  ) => Promise<void>
  /** Abort an in-flight pipeline run. */
  stopPipeline: () => void
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
  agentResults: {},
  isPipelineRunning: false,
  loopCount: 0,
  loopMax: 1,
  _pipelineAbort: null,

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
      agentResults: {},
      isPipelineRunning: false,
      loopCount: 0,
      loopMax: 1,
      _pipelineAbort: null,
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
      addMessage({ agentId: agentDef.id, text: result.text, timestamp: Date.now(), phase: agentDef.phase })
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

  stopPipeline: () => {
    const { _pipelineAbort } = get()
    _pipelineAbort?.abort()
    set({ isPipelineRunning: false, _pipelineAbort: null, activeAgents: [], loopCount: 0, loopMax: 1 })
    get().addMessage({
      agentId: 'orchestrator',
      text: '⛔ Pipeline stopped by user.',
      timestamp: Date.now(),
      phase: 'strategy',
    })
  },

  runPipelineLLM: async (userTask, simulationOrder, connections, opts) => {
    const llm = useLLMStore.getState()
    if (!llm.apiKey) return
    if (simulationOrder.length === 0) return

    const presetName = opts?.presetName
    const loops = opts?.loops ?? 1  // 1 = single run, -1 = infinite

    const abort = new AbortController()
    set({
      isPipelineRunning: true,
      _pipelineAbort: abort,
      debugPanelOpen: true,
      agentResults: {},
      messages: [],
      completedPhases: [],
      activeAgents: [],
      loopCount: 0,
      loopMax: loops,
    })

    const canvas = useCanvasStore.getState()
    const { _updateLog, addMessage } = get()

    // Detect if the pipeline has an orchestrator node as first agent
    const firstAgent = AD_MAP.get(simulationOrder[0]?.agentId ?? '')
    const hasOrchestrator = firstAgent?.id === 'orchestrator'

    let currentLoop = 0
    // prevLoopResults: carry last loop's output into next loop's context
    let prevLoopResults: Record<string, string> = {}

    while (!abort.signal.aborted) {
      currentLoop++
      set({ loopCount: currentLoop })

      const loopLabel = loops === 1
        ? `▶ Starting pipeline${presetName ? ` "${presetName}"` : ''} — ${simulationOrder.length} agents`
        : loops === -1
          ? `🔁 Loop ${currentLoop} (∞) — ${simulationOrder.length} agents`
          : `🔁 Loop ${currentLoop}/${loops} — ${simulationOrder.length} agents`

      addMessage({ agentId: 'orchestrator', text: loopLabel, timestamp: Date.now(), phase: 'strategy' })

      // Accumulate results within this loop iteration
      const accumulated: Record<string, string> = {}

      for (const node of simulationOrder) {
        if (abort.signal.aborted) break

        const agentDef = AD_MAP.get(node.agentId)
        if (!agentDef) continue

        set((s) => ({ activeAgents: [...s.activeAgents.filter((id) => id !== node.id), node.id] }))

        // Build upstream results: direct connections within this loop
        const upstreamNodeIds = connections
          .filter((c) => c.to === node.id)
          .map((c) => c.from)

        const upstreamResults: Record<string, string> = {}
        for (const upId of upstreamNodeIds) {
          // Prefer current-loop result; fall back to previous loop's result (for circular/loop presets)
          if (accumulated[upId]) upstreamResults[upId] = accumulated[upId]
          else if (prevLoopResults[upId]) upstreamResults[upId] = prevLoopResults[upId]
        }

        if (!hasOrchestrator || agentDef.id === 'orchestrator') {
          // no-op: use direct connections only
        } else if (upstreamNodeIds.length === 0 && simulationOrder[0]) {
          accumulated[simulationOrder[0].id]
            && (upstreamResults[simulationOrder[0].id] = accumulated[simulationOrder[0].id])
        }

        const userMessage = buildAgentContext({
          currentNode: node,
          allNodes: canvas.nodes,
          connections,
          agentMap: AD_MAP,
          presetName,
          phase: agentDef.phase,
          userTask,
          upstreamResults: Object.keys(upstreamResults).length > 0 ? upstreamResults : undefined,
        })

        const logId = `pipeline-${node.id}-loop${currentLoop}-${Date.now()}`
        const logEntry: LLMCallLog = {
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
        set((s) => ({ executionLog: [...s.executionLog, logEntry] }))
        addMessage({ agentId: agentDef.id, text: `⏳ ${agentDef.name}…`, timestamp: Date.now(), phase: agentDef.phase })
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
          signal: abort.signal,
          onChunk: (chunk) => {
            streamedText += chunk
            _updateLog(logId, { responseText: streamedText, status: 'streaming' })
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

        set((s) => ({ activeAgents: s.activeAgents.filter((id) => id !== node.id) }))

        if (abort.signal.aborted) break

        if (result.ok) {
          accumulated[node.id] = result.text
          set((s) => ({ agentResults: { ...s.agentResults, [node.id]: result.text } }))
          _updateLog(logId, { status: 'done', responseText: result.text, usage: result.usage, latencyMs: result.latencyMs })
          addMessage({ agentId: agentDef.id, text: result.text, timestamp: Date.now(), phase: agentDef.phase })
          get().completePhase(agentDef.phase)
        } else {
          _updateLog(logId, { status: 'error', error: result.error, latencyMs: result.latencyMs })
          addMessage({ agentId: agentDef.id, text: `❌ ${agentDef.name}: ${result.error ?? 'Unknown error'}`, timestamp: Date.now(), phase: agentDef.phase })
        }
      }

      if (abort.signal.aborted) break

      // Carry this loop's results into the next iteration
      prevLoopResults = { ...accumulated }

      addMessage({
        agentId: 'orchestrator',
        text: loops === 1
          ? `✅ Pipeline complete — ${Object.keys(accumulated).length}/${simulationOrder.length} agents finished.`
          : `✅ Loop ${currentLoop}${loops === -1 ? ' (∞)' : `/${loops}`} done — ${Object.keys(accumulated).length}/${simulationOrder.length} agents.`,
        timestamp: Date.now(),
        phase: 'strategy',
      })

      // Stop if finite loops exhausted
      if (loops !== -1 && currentLoop >= loops) break
    }

    set({ isPipelineRunning: false, _pipelineAbort: null, activeAgents: [], loopCount: 0, loopMax: 1 })
  },
}))
