import { Suspense } from 'react'
import './styles/tokens.css'
import './styles/animations.css'
import { useTheme } from './hooks/useTheme'
import { TopBar } from './components/layout/TopBar'
import { LeftSidebar } from './components/layout/LeftSidebar'
import { RightSidebar } from './components/layout/RightSidebar'
import { CanvasArea } from './components/canvas/CanvasArea'

function AppLayout() {
  useTheme()

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
