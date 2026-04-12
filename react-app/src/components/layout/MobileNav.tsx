import React from 'react'
import { useUiStore } from '../../store/uiStore'
import { useCanvasStore } from '../../store/canvasStore'

/**
 * Bottom navigation bar shown only on mobile (<md breakpoint).
 * Provides access to left/right sidebars and main actions.
 */
export const MobileNav: React.FC = () => {
  const { setLeftDrawer, setRightDrawer, leftDrawerOpen, rightDrawerOpen, openModal } = useUiStore()
  const nodes = useCanvasStore((s) => s.nodes)

  return (
    <nav
      className="md:hidden flex items-center justify-around h-14 shrink-0 border-t"
      style={{
        background: 'var(--bg-panel)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(20px)',
      }}
      aria-label="Mobile navigation"
    >
      <MobileNavBtn
        label="Agenci"
        icon="☰"
        active={leftDrawerOpen}
        onClick={() => { setLeftDrawer(!leftDrawerOpen); setRightDrawer(false) }}
      />
      <MobileNavBtn
        label="Canvas"
        icon="⬡"
        onClick={() => { setLeftDrawer(false); setRightDrawer(false) }}
      />
      {nodes.length > 0 && (
        <MobileNavBtn
          label="Koszt"
          icon="$"
          onClick={() => openModal('cost')}
        />
      )}
      <MobileNavBtn
        label="Eksport"
        icon="⬡"
        onClick={() => openModal('mermaid')}
      />
      <MobileNavBtn
        label="Szczegóły"
        icon="ℹ"
        active={rightDrawerOpen}
        onClick={() => { setRightDrawer(!rightDrawerOpen); setLeftDrawer(false) }}
      />
    </nav>
  )
}

const MobileNavBtn: React.FC<{
  label: string
  icon: string
  active?: boolean
  onClick: () => void
}> = ({ label, icon, active = false, onClick }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors text-xs font-semibold"
    style={{
      color: active ? 'var(--accent1)' : 'var(--t3)',
      background: active ? 'var(--state-selected)' : 'transparent',
      border: 'none',
      cursor: 'pointer',
    }}
  >
    <span className="text-base leading-none">{icon}</span>
    <span>{label}</span>
  </button>
)
