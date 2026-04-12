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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-[13px] font-medium max-w-sm whitespace-nowrap"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        backdropFilter: 'blur(12px)',
        color: colors.text,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        animation: 'slideIn 0.2s var(--ease-decelerate, ease)',
      }}
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Zamknij powiadomienie"
        className="opacity-60 hover:opacity-100 transition-opacity text-base leading-none px-1"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text }}
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

