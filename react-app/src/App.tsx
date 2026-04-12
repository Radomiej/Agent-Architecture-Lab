import { Suspense, useEffect } from 'react'
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
import { DebugPanel } from './components/debug/DebugPanel'
import { MobileNav } from './components/layout/MobileNav'
import { useUiStore } from './store/uiStore'
import { useCanvasStore } from './store/canvasStore'
import { useSimulationStore } from './store/simulationStore'

function AppLayout() {
  useTheme()
  const { openModal, activeModal, closeModal, leftDrawerOpen, rightDrawerOpen, setLeftDrawer, setRightDrawer } = useUiStore()
  const { selected, removeNode } = useCanvasStore()
  const { toggleDebugPanel } = useSimulationStore()

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

      {/* Mobile drawer: Left sidebar */}
      {leftDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          onClick={() => setLeftDrawer(false)}
        >
          <div
            className="w-72 h-full flex flex-col shadow-2xl animate-[slideInLeft_0.22s_ease-out]"
            style={{ background: 'var(--bg-panel)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <LeftSidebar />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" />
        </div>
      )}

      {/* Mobile drawer: Right sidebar */}
      {rightDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-row-reverse md:hidden"
          onClick={() => setRightDrawer(false)}
        >
          <div
            className="w-80 h-full flex flex-col shadow-2xl animate-[slideInRight_0.22s_ease-out]"
            style={{ background: 'var(--bg-panel)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <RightSidebar />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" />
        </div>
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

      {/* Debug panel */}
      <DebugPanel />
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

