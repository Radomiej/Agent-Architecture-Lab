import { create } from 'zustand'
import type { CanvasNode, Connection, LLMCallLog, LLMCallStatus } from '../types'
import { callAgent } from '../services/llmService'
import { useLLMStore } from './llmStore'
import { useCanvasStore } from './canvasStore'
import { useOrchestrationStore } from './orchestrationStore'
import { useExecutionHistoryStore } from './executionHistoryStore'
import { AD_MAP } from '../data/agents'
import { buildAgentContext } from '../utils/buildAgentContext'

interface PipelineStore {
  /** Whether a real LLM pipeline is currently executing. */
  isPipelineRunning: boolean
  /** Current loop iteration (1-based). */
  loopCount: number
  /** Maximum loops (1 = single run, -1 = infinite). */
  loopMax: number
  /** Results keyed by nodeId from the most recent pipeline run. */
  agentResults: Record<string, string>
  /** AbortController for cancelling in-flight pipeline calls. */
  _pipelineAbort: AbortController | null

  /** Run a single agent node via the real LLM (debug / single-shot mode). */
  runAgentLLM: (nodeId: string, presetName?: string) => Promise<void>
  /**
   * Run the entire pipeline sequentially via real LLM calls.
   * Agents execute in phase order; each receives the original user task plus
   * actual output of all upstream agents (via connections).
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
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  isPipelineRunning: false,
  loopCount: 0,
  loopMax: 1,
  agentResults: {},
  _pipelineAbort: null,

  runAgentLLM: async (nodeId, presetName) => {
    const llm = useLLMStore.getState()
    const canvas = useCanvasStore.getState()
    const history = useExecutionHistoryStore.getState()
    const orch = useOrchestrationStore.getState()

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

    history.addLogEntry(log)
    history.setDebugPanelOpen(true)
    orch.setActiveAgents([...orch.activeAgents.filter((id) => id !== nodeId), nodeId])
    history.addMessage({ agentId: agentDef.id, text: '⏳ Calling LLM…', timestamp: Date.now(), phase: agentDef.phase })
    history.updateLogEntry(logId, { status: 'streaming' })

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
        history.updateLogEntry(logId, { responseText: streamedText, status: 'streaming' })
        // Update the last timeline message with the streamed preview
        useExecutionHistoryStore.setState((s) => {
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
      history.updateLogEntry(logId, {
        status: 'done',
        responseText: result.text,
        usage: result.usage,
        latencyMs: result.latencyMs,
      })
      history.addMessage({ agentId: agentDef.id, text: result.text, timestamp: Date.now(), phase: agentDef.phase })
    } else {
      history.updateLogEntry(logId, {
        status: 'error',
        error: result.error,
        latencyMs: result.latencyMs,
      })
      history.addMessage({
        agentId: agentDef.id,
        text: `❌ Error: ${result.error ?? 'Unknown error'}`,
        timestamp: Date.now(),
        phase: agentDef.phase,
      })
    }

    orch.setActiveAgents(orch.activeAgents.filter((id) => id !== nodeId))
  },

  stopPipeline: () => {
    const { _pipelineAbort } = get()
    _pipelineAbort?.abort()
    useOrchestrationStore.getState().setActiveAgents([])
    useExecutionHistoryStore.getState().addMessage({
      agentId: 'orchestrator',
      text: '⛔ Pipeline stopped by user.',
      timestamp: Date.now(),
      phase: 'strategy',
    })
    set({ isPipelineRunning: false, _pipelineAbort: null, loopCount: 0, loopMax: 1 })
  },

  runPipelineLLM: async (userTask, simulationOrder, connections, opts) => {
    const llm = useLLMStore.getState()
    if (!llm.apiKey) return
    if (simulationOrder.length === 0) return

    const presetName = opts?.presetName
    const loops = opts?.loops ?? 1

    const abort = new AbortController()
    const history = useExecutionHistoryStore.getState()
    const orch = useOrchestrationStore.getState()

    // Reset shared state before run
    history.clearMessages()
    orch.reset()
    history.setDebugPanelOpen(true)

    set({
      isPipelineRunning: true,
      _pipelineAbort: abort,
      agentResults: {},
      loopCount: 0,
      loopMax: loops,
    })

    const canvas = useCanvasStore.getState()

    // Detect orchestrator as first node
    const firstAgent = AD_MAP.get(simulationOrder[0]?.agentId ?? '')
    const hasOrchestrator = firstAgent?.id === 'orchestrator'

    let currentLoop = 0
    let prevLoopResults: Record<string, string> = {}

    while (!abort.signal.aborted) {
      currentLoop++
      set({ loopCount: currentLoop })

      const loopLabel = loops === 1
        ? `▶ Starting pipeline${presetName ? ` "${presetName}"` : ''} — ${simulationOrder.length} agents`
        : loops === -1
          ? `🔁 Loop ${currentLoop} (∞) — ${simulationOrder.length} agents`
          : `🔁 Loop ${currentLoop}/${loops} — ${simulationOrder.length} agents`

      history.addMessage({ agentId: 'orchestrator', text: loopLabel, timestamp: Date.now(), phase: 'strategy' })

      const accumulated: Record<string, string> = {}

      for (const node of simulationOrder) {
        if (abort.signal.aborted) break

        const agentDef = AD_MAP.get(node.agentId)
        if (!agentDef) continue

        // Re-read orch state each iteration (may have changed)
        const orchState = useOrchestrationStore.getState()
        orchState.setActiveAgents([...orchState.activeAgents.filter((id) => id !== node.id), node.id])

        // Build upstream results
        const upstreamNodeIds = connections
          .filter((c) => c.to === node.id)
          .map((c) => c.from)

        const upstreamResults: Record<string, string> = {}
        for (const upId of upstreamNodeIds) {
          if (accumulated[upId]) upstreamResults[upId] = accumulated[upId]
          else if (prevLoopResults[upId]) upstreamResults[upId] = prevLoopResults[upId]
        }

        if (hasOrchestrator && agentDef.id !== 'orchestrator' && upstreamNodeIds.length === 0 && simulationOrder[0]) {
          if (accumulated[simulationOrder[0].id]) {
            upstreamResults[simulationOrder[0].id] = accumulated[simulationOrder[0].id]
          }
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

        // Re-read history to get latest addMessage/updateLogEntry
        const hist = useExecutionHistoryStore.getState()
        hist.addLogEntry(logEntry)
        hist.addMessage({ agentId: agentDef.id, text: `⏳ ${agentDef.name}…`, timestamp: Date.now(), phase: agentDef.phase })
        hist.updateLogEntry(logId, { status: 'streaming' })

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
            useExecutionHistoryStore.getState().updateLogEntry(logId, { responseText: streamedText, status: 'streaming' })
            useExecutionHistoryStore.setState((s) => {
              const msgs = [...s.messages]
              const last = msgs[msgs.length - 1]
              if (last && last.agentId === agentDef.id) {
                msgs[msgs.length - 1] = { ...last, text: streamedText.slice(0, 200) }
              }
              return { messages: msgs }
            })
          },
        })

        useOrchestrationStore.getState().setActiveAgents(
          useOrchestrationStore.getState().activeAgents.filter((id) => id !== node.id),
        )

        if (abort.signal.aborted) break

        const histAfter = useExecutionHistoryStore.getState()
        if (result.ok) {
          accumulated[node.id] = result.text
          set((s) => ({ agentResults: { ...s.agentResults, [node.id]: result.text } }))
          histAfter.updateLogEntry(logId, { status: 'done', responseText: result.text, usage: result.usage, latencyMs: result.latencyMs })
          histAfter.addMessage({ agentId: agentDef.id, text: result.text, timestamp: Date.now(), phase: agentDef.phase })
          useOrchestrationStore.getState().completePhase(agentDef.phase)
        } else {
          histAfter.updateLogEntry(logId, { status: 'error', error: result.error, latencyMs: result.latencyMs })
          histAfter.addMessage({
            agentId: agentDef.id,
            text: `❌ ${agentDef.name}: ${result.error ?? 'Unknown error'}`,
            timestamp: Date.now(),
            phase: agentDef.phase,
          })
        }
      }

      if (abort.signal.aborted) break

      prevLoopResults = { ...accumulated }

      useExecutionHistoryStore.getState().addMessage({
        agentId: 'orchestrator',
        text: loops === 1
          ? `✅ Pipeline complete — ${Object.keys(accumulated).length}/${simulationOrder.length} agents finished.`
          : `✅ Loop ${currentLoop}${loops === -1 ? ' (∞)' : `/${loops}`} done — ${Object.keys(accumulated).length}/${simulationOrder.length} agents.`,
        timestamp: Date.now(),
        phase: 'strategy',
      })

      if (loops !== -1 && currentLoop >= loops) break
    }

    set({ isPipelineRunning: false, _pipelineAbort: null, loopCount: 0, loopMax: 1 })
    useOrchestrationStore.getState().setActiveAgents([])
  },
}))
