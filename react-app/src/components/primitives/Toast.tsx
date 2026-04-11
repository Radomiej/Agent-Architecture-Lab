import React, { useEffect, useRef } from 'react'

interface ToastProps {
  message: string
  type?: 'info' | 'success' | 'warn' | 'error'
  onDismiss: () => void
  duration?: number
}

const TYPE_COLORS = {
  info:    { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)',  text: '#60A5FA' },
  success: { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  text: '#34D399' },
  warn:    { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  text: '#FBBF24' },
  error:   { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', text: '#F87171' },
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onDismiss, duration = 3000 }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, duration)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [onDismiss, duration])

  const colors = TYPE_COLORS[type]

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderRadius: '8px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        backdropFilter: 'blur(12px)',
        color: colors.text,
        fontSize: '13px',
        fontWeight: 500,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        animation: 'slideIn 0.2s var(--ease-decelerate, ease)',
        maxWidth: '400px',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Zamknij powiadomienie"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: colors.text,
          opacity: 0.6,
          fontSize: '16px',
          lineHeight: 1,
          padding: '2px 4px',
        }}
      >
        ×
      </button>
    </div>
  )
}

interface ToastItem {
  id: string
  message: string
  type?: ToastProps['type']
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => (
  <>
    {toasts.map((t) => (
      <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => onDismiss(t.id)} />
    ))}
  </>
)
