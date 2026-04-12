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
import { DecisionGateModal } from './components/modals/DecisionGateModal'
import { DebugPanel } from './components/debug/DebugPanel'
import { useUiStore } from './store/uiStore'
import { useCanvasStore } from './store/canvasStore'
import { useSimulationStore } from './store/simulationStore'

function AppLayout() {
  useTheme()
  const { openModal, activeModal, closeModal } = useUiStore()
  const { selected, removeNode } = useCanvasStore()
  const { toggleDebugPanel, hitlGateOpen, closeHitlGate } = useSimulationStore()

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
        || (document.activeElement as HTMLElement)?.isContentEditable

      if (e.key === 'Escape' && hitlGateOpen) { closeHitlGate(); return }
      if (e.key === 'Escape' && activeModal) { closeModal(); return }
      if (isInput || activeModal || hitlGateOpen) return

      if (e.key === 'k' || e.key === 'K') { openModal('cost'); return }
      if (e.key === 'm' || e.key === 'M') { openModal('mermaid'); return }
      if (e.key === ',') { openModal('settings'); return }
      if (e.key === 'd' || e.key === 'D') { toggleDebugPanel(); return }

      // Delete only (not Backspace - avoid conflicting with browser back navigation)
      if (e.key === 'Delete' && selected.length > 0) {
        e.preventDefault()
        selected.forEach(id => removeNode(id))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openModal, closeModal, activeModal, selected, removeNode, toggleDebugPanel, hitlGateOpen, closeHitlGate])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: 'var(--ff-sans)',
        color: 'var(--t1)',
        background: 'var(--bg0)',
      }}
    >
      {/* Skip link for accessibility */}
      <a
        href="#canvas"
        style={{
          position: 'absolute',
          left: '-999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.cssText = 'position:fixed;top:0;left:0;z-index:9999;padding:8px 16px;background:var(--accent);color:#fff;font-size:14px' }}
        onBlur={(e) => { (e.currentTarget as HTMLElement).style.cssText = 'position:absolute;left:-999px;top:auto;width:1px;height:1px;overflow:hidden' }}
      >
        Skip to canvas
      </a>

      <TopBar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftSidebar />
        <CanvasArea />
        <RightSidebar />
      </div>

      {/* Modals */}
      <CostModal />
      <MermaidModal />
      <LLMSettingsModal />
      <DecisionGateModal />

      {/* Debug panel (fixed bottom drawer) */}
      <DebugPanel />
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#06060A', color: '#E6E8EE', fontSize: '14px' }}>Loading...</div>}>
      <AppLayout />
    </Suspense>
  )
}

export default App
