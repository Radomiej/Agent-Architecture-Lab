import React, { useEffect, useRef } from 'react'
import { useUiStore } from '../../store/uiStore'

interface ModalBaseProps {
  modalId: string
  title: string
  width?: number
  children: React.ReactNode
}

export const ModalBase: React.FC<ModalBaseProps> = ({ modalId, title, width = 720, children }) => {
  const { activeModal, closeModal } = useUiStore()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeModal === modalId) {
      dialogRef.current?.focus()
    }
  }, [activeModal, modalId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModal === modalId) closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeModal, modalId, closeModal])

  if (activeModal !== modalId) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{
          width: '100%', maxWidth: width,
          maxHeight: '90vh',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--t1)' }}>{title}</h2>
          <button
            onClick={closeModal}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: '20px', lineHeight: 1, padding: '4px' }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
