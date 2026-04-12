import React, { useEffect, useRef } from 'react'
import { useSimulationStore, HITL_GATE_OPTIONS } from '../../store/simulationStore'
import { AGENT_SVG } from '../../data/agentSvg'

const OPTION_COLORS: Record<string, string> = {
  A: '#34D399', // green  — continue
  B: '#FBBF24', // amber  — adjust
  C: '#F87171', // red    — stop
}

// Semi-transparent hover backgrounds matching option colors
const OPTION_HOVER_BG: Record<string, string> = {
  A: 'rgba(52,211,153,0.06)',
  B: 'rgba(251,191,36,0.06)',
  C: 'rgba(248,113,113,0.06)',
}

export const DecisionGateModal: React.FC = () => {
  const { hitlGateOpen, closeHitlGate } = useSimulationStore()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hitlGateOpen) dialogRef.current?.focus()
  }, [hitlGateOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hitlGateOpen) closeHitlGate()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hitlGateOpen, closeHitlGate])

  if (!hitlGateOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        // Start below TopBar (z-index 2010) so Stop button remains accessible
        paddingTop: '72px',
      }}
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) closeHitlGate() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="HITL Decision Gate"
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--bg-panel)',
          border: '1px solid rgba(251,191,36,0.4)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          outline: 'none',
          boxShadow: '0 0 40px rgba(251,191,36,0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(251,191,36,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="#FBBF24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: AGENT_SVG.decision_presenter }}
            />
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--t1)' }}>
                HITL Decision Gate
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--t3)' }}>
                Decision Presenter — wybierz jak kontynuować
              </p>
            </div>
          </div>
          <button
            onClick={() => closeHitlGate()}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--t3)',
              fontSize: '20px',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--t2)', lineHeight: 1.5 }}>
            Symulacja osiągnęła punkt decyzyjny. Wybierz jedną z opcji poniżej,
            aby określić jak zespół agentów powinien kontynuować.
          </p>

          {HITL_GATE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => closeHitlGate(opt.id)}
              aria-label={`Option ${opt.id}: ${opt.label}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '14px 16px',
                background: 'var(--bg-card)',
                border: `1px solid var(--border)`,
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.borderColor = OPTION_COLORS[opt.id]
                el.style.background = OPTION_HOVER_BG[opt.id]
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.borderColor = 'var(--border)'
                el.style.background = 'var(--bg-card)'
              }}
            >
              {/* Badge */}
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: OPTION_COLORS[opt.id],
                  color: '#06060A',
                  fontWeight: 800,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '1px',
                }}
              >
                {opt.id}
              </span>

              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--t1)', marginBottom: '3px' }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--t3)', lineHeight: 1.4 }}>
                  {opt.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 20px 14px',
            borderTop: '1px solid var(--border)',
            fontSize: '11px',
            color: 'var(--t3)',
            textAlign: 'center',
          }}
        >
          Press <kbd style={{ fontFamily: 'monospace', padding: '1px 5px', background: 'var(--bg-input)', borderRadius: '3px', border: '1px solid var(--border)' }}>Esc</kbd> to dismiss
        </div>
      </div>
    </div>
  )
}
