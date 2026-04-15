import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import './styles/tokens.css'
import './styles/animations.css'
import { useTheme } from './hooks/useTheme'
import { TopBar } from './components/layout/TopBar'
import { LeftSidebar } from './components/layout/LeftSidebar'
import { RightSidebar } from './components/layout/RightSidebar'
import { CanvasArea } from './components/canvas/CanvasArea'
import { CostModal } from './components/modals/CostModal'
import { MermaidModal } from './components/modals/MermaidModal'
import { LLMSettingsModal } from './components/modals/LLMSettingsModal'
import { SimulationReviewModal } from './components/modals/SimulationReviewModal'
import { TaskPromptModal } from './components/modals/TaskPromptModal'
import { DebugPanel } from './components/debug/DebugPanel'
import { MobileNav } from './components/layout/MobileNav'
import { useUiStore } from './store/uiStore'
import { useCanvasStore } from './store/canvasStore'
import { useSimulationStore } from './store/simulationStore'
import { useVfsStore } from './store/vfsStore'
import { AD_MAP } from './data/agents'
import { ToastContainer } from './components/primitives/Toast'
import { simulateToolCalls } from './utils/toolSimulator'
import type { ToolType } from './types'

const TOOL_ICONS: Record<ToolType, string> = {
  Read: '📖', Write: '✏️', Edit: '📝', Bash: '💻', Glob: '🔍',
  Grep: '🔎', LS: '📁', WebSearch: '🌐', WebFetch: '🌐',
  Agent: '👤', TodoRead: '📋', TodoWrite: '📋', TaskCreate: '📌',
}

function AppLayout() {
  useTheme()
  const { openModal, activeModal, closeModal, leftDrawerOpen, rightDrawerOpen, setLeftDrawer, setRightDrawer } = useUiStore()
  const { selected, removeNode, nodes } = useCanvasStore()
  const {
    toggleDebugPanel,
    isRunning,
    isPaused,
    step,
    nextStep,
    setActiveAgents,
    completePhase,
    addMessage,
    addToolCalls,
    stop,
    messages,
    isPipelineRunning,
  } = useSimulationStore()
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'info' | 'success' | 'warn' | 'error' }>>([])
  const msgCursorRef = useRef(0)
  const vfsSeededRef = useRef(false)
  const prevPipelineRunningRef = useRef(false)

  // Auto-open review modal when real pipeline finishes
  useEffect(() => {
    if (prevPipelineRunningRef.current && !isPipelineRunning) {
      openModal('review')
    }
    prevPipelineRunningRef.current = isPipelineRunning
  }, [isPipelineRunning, openModal])

  const simulationOrder = useMemo(() => {
    const phaseRank: Record<string, number> = {
      strategy: 0,
      research: 1,
      debate1: 2,
      debate2: 3,
      build: 4,
      qa: 5,
      hitl: 6,
    }

    return [...nodes]
      .filter((node) => AD_MAP.has(node.agentId))
      .sort((a, b) => {
        const aPhase = AD_MAP.get(a.agentId)?.phase ?? 'strategy'
        const bPhase = AD_MAP.get(b.agentId)?.phase ?? 'strategy'
        const rankDiff = (phaseRank[aPhase] ?? 99) - (phaseRank[bPhase] ?? 99)
        if (rankDiff !== 0) return rankDiff
        if (a.x !== b.x) return a.x - b.x
        return a.y - b.y
      })
  }, [nodes])

  // Seed VFS when simulation starts
  useEffect(() => {
    if (isRunning && !vfsSeededRef.current) {
      const vfs = useVfsStore.getState()
      vfs.reset()
      vfs.seedProject()
      vfsSeededRef.current = true
    }
    if (!isRunning) {
      vfsSeededRef.current = false
    }
  }, [isRunning])

  const { connections } = useCanvasStore()

  useEffect(() => {
    if (!isRunning || isPaused) return

    if (simulationOrder.length === 0) return

    if (step >= simulationOrder.length) {
      setActiveAgents([])
      addMessage({
        agentId: 'orchestrator',
        text: 'Symulacja zakonczona. Wszystkie kroki zostaly wykonane.',
        timestamp: Date.now(),
        phase: 'strategy',
      })
      stop()
      openModal('review')
      return
    }

    const node = simulationOrder[step]
    const agent = AD_MAP.get(node.agentId)
    if (!agent) {
      nextStep()
      return
    }

    setActiveAgents([node.id])
    addMessage({
      agentId: agent.id,
      text: `Przetwarzam etap ${agent.phase} i przygotowuje wynik dla kolejnych agentow.`,
      timestamp: Date.now(),
      phase: agent.phase,
    })

    // Generate tool calls for this agent
    const vfs = useVfsStore.getState()
    const toolCalls = simulateToolCalls(agent, node, nodes, connections, AD_MAP, vfs)
    if (toolCalls.length > 0) {
      addToolCalls(toolCalls)
      // Add tool call messages to timeline
      for (const tc of toolCalls) {
        const icon = TOOL_ICONS[tc.tool] ?? '🔧'
        const preview = tc.result.length > 80 ? tc.result.slice(0, 80) + '…' : tc.result
        const statusMark = tc.status === 'error' ? '❌ ' : ''
        addMessage({
          agentId: agent.id,
          text: `${icon} ${tc.tool}: ${statusMark}${preview}`,
          timestamp: tc.timestamp,
          phase: agent.phase,
        })
      }
    }

    // Time per step scales with tool calls: base 800ms + 200ms per tool call
    const stepTime = 800 + toolCalls.length * 200

    const timer = window.setTimeout(() => {
      setActiveAgents([])
      completePhase(agent.phase)
      nextStep()
    }, stepTime)

    return () => window.clearTimeout(timer)
  }, [isRunning, isPaused, simulationOrder, step, setActiveAgents, addMessage, addToolCalls, completePhase, nextStep, stop, nodes, connections, openModal])

  useEffect(() => {
    if (messages.length <= msgCursorRef.current) return
    const startIndex = msgCursorRef.current
    const newMessages = messages.slice(startIndex)
    if (newMessages.length === 0) return
    msgCursorRef.current = messages.length

    setToasts((prev) => {
      const nextToasts = newMessages.map((message, idx) => {
        const agentName = AD_MAP.get(message.agentId)?.name ?? message.agentId
        const preview = message.text.length > 88 ? `${message.text.slice(0, 88)}...` : message.text
        const type: 'info' | 'success' = message.text.startsWith('Symulacja zakonczona') ? 'success' : 'info'

        return {
          id: `${message.timestamp}-${startIndex + idx}`,
          message: `${agentName}: ${preview}`,
          type,
        }
      })

      return [...prev, ...nextToasts].slice(-3)
    })
  }, [messages])

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
        || (document.activeElement as HTMLElement)?.isContentEditable

      if (e.key === 'Escape' && activeModal) { closeModal(); return }
      if (e.key === 'Escape' && leftDrawerOpen) { setLeftDrawer(false); return }
      if (e.key === 'Escape' && rightDrawerOpen) { setRightDrawer(false); return }
      if (isInput || activeModal) return

      if (e.key === 'k' || e.key === 'K') { openModal('cost'); return }
      if (e.key === 'm' || e.key === 'M') { openModal('mermaid'); return }
      if (e.key === 'r' || e.key === 'R') { openModal('review'); return }
      if (e.key === 'p' || e.key === 'P') { openModal('taskPrompt'); return }
      if (e.key === ',') { openModal('settings'); return }
      if (e.key === 'd' || e.key === 'D') { toggleDebugPanel(); return }

      if (e.key === 'Delete' && selected.length > 0) {
        e.preventDefault()
        selected.forEach(id => removeNode(id))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openModal, closeModal, activeModal, selected, removeNode, toggleDebugPanel, leftDrawerOpen, rightDrawerOpen, setLeftDrawer, setRightDrawer])

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans" style={{ color: 'var(--t1)', background: 'var(--bg0)' }}>
      {/* Skip link for accessibility */}
      <a
        href="#canvas"
        className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-br-lg focus:text-sm"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        Skip to canvas
      </a>

      <TopBar />

      {/* Mobile drawer: Left sidebar — stops above MobileNav (bottom-14), starts below TopBar (top-12) */}
      {leftDrawerOpen && (
        <>
          <div
            data-testid="left-drawer-backdrop"
            aria-label="Close menu"
            className="fixed inset-x-0 top-0 bottom-14 z-[45] bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setLeftDrawer(false)}
          />
          <div
            className="fixed left-0 top-12 bottom-14 z-[50] w-72 flex flex-col shadow-2xl animate-[slideInLeft_0.22s_ease-out] md:hidden overflow-hidden"
            style={{ background: 'var(--bg-panel)' }}
          >
            <LeftSidebar />
          </div>
        </>
      )}

      {/* Mobile drawer: Right sidebar — stops above MobileNav (bottom-14), starts below TopBar (top-12) */}
      {rightDrawerOpen && (
        <>
          <div
            data-testid="right-drawer-backdrop"
            aria-label="Close menu"
            className="fixed inset-x-0 top-0 bottom-14 z-[45] bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setRightDrawer(false)}
          />
          <div
            className="fixed right-0 top-12 bottom-14 z-[50] w-80 flex flex-col shadow-2xl animate-[slideInRight_0.22s_ease-out] md:hidden overflow-hidden"
            style={{ background: 'var(--bg-panel)' }}
          >
            <RightSidebar />
          </div>
        </>
      )}

      {/* Desktop 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — hidden on mobile, shown on md+ */}
        <div className="hidden md:flex md:flex-col" style={{ width: 260, minWidth: 260, borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
          <LeftSidebar />
        </div>

        <CanvasArea />

        {/* Right sidebar — hidden on mobile, shown on md+ */}
        <div className="hidden md:flex md:flex-col" style={{ width: 300, minWidth: 300, borderLeft: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
          <RightSidebar />
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />

      {/* Modals */}
      <CostModal />
      <MermaidModal />
      <LLMSettingsModal />
      <SimulationReviewModal />
      <TaskPromptModal />

      {/* Debug panel */}
      <DebugPanel />

      {/* Toast notifications for simulation and agent activity */}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen text-sm" style={{ background: '#06060A', color: '#E6E8EE' }}>
        Loading...
      </div>
    }>
      <AppLayout />
    </Suspense>
  )
}

export default App

