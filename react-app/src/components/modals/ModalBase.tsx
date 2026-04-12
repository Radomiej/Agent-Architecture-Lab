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
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="flex flex-col w-full rounded-2xl overflow-hidden outline-none"
        style={{
          maxWidth: width,
          maxHeight: '90vh',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="m-0 text-[15px] font-bold" style={{ color: 'var(--t1)' }}>{title}</h2>
          <button
            onClick={closeModal}
            aria-label="Close"
            className="btn-ghost-app text-xl leading-none p-1"
            style={{ color: 'var(--t3)' }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

