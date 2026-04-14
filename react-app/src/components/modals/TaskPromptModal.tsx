import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '../../store/uiStore'
import { useSimulationStore } from '../../store/simulationStore'
import { useCanvasStore } from '../../store/canvasStore'
import { AD_MAP } from '../../data/agents'

const PHASE_RANK: Record<string, number> = {
  strategy: 0, research: 1, debate1: 2, debate2: 3, build: 4, qa: 5, hitl: 6,
}

/**
 * TaskPromptModal — shown when user clicks "Run Pipeline" (real LLM mode).
 * User enters their task / prompt and the whole agent pipeline executes
 * sequentially with results passed between agents via connections.
 */
export function TaskPromptModal() {
  const { t } = useTranslation()
  const { activeModal, closeModal } = useUiStore()
  const { runPipelineLLM, isPipelineRunning } = useSimulationStore()
  const { nodes, connections } = useCanvasStore()

  const [task, setTask] = useState('')
  const [loops, setLoops] = useState<number>(1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isOpen = activeModal === 'taskPrompt'

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      setTask('')
      setLoops(1)
      setTimeout(() => textareaRef.current?.focus(), 80)
    }
  }, [isOpen])

  if (!isOpen) return null

  const agentCount = nodes.filter((n) => AD_MAP.has(n.agentId)).length

  // Build execution order preview (phase-sorted)
  const orderedNodes = [...nodes]
    .filter((n) => AD_MAP.has(n.agentId))
    .sort((a, b) => {
      const aP = AD_MAP.get(a.agentId)?.phase ?? 'strategy'
      const bP = AD_MAP.get(b.agentId)?.phase ?? 'strategy'
      const diff = (PHASE_RANK[aP] ?? 99) - (PHASE_RANK[bP] ?? 99)
      if (diff !== 0) return diff
      if (a.x !== b.x) return a.x - b.x
      return a.y - b.y
    })

  const handleRun = () => {
    if (!task.trim() || isPipelineRunning) return
    closeModal()
    void runPipelineLLM(task.trim(), orderedNodes, connections, { loops })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter submits
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleRun()
    }
  }

  const PHASE_COLORS: Record<string, string> = {
    strategy: '#5B8DEF', research: '#22C4E6', debate1: '#A78BFA', debate2: '#A78BFA',
    build: '#34D399', qa: '#F87171', hitl: '#FBBF24',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('pipeline.run', 'Run Pipeline')}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">▶</span>
            <h2 className="text-base font-semibold" style={{ color: 'var(--t1)' }}>
              {t('pipeline.run', 'Run Pipeline')}
            </h2>
          </div>
          <button
            onClick={closeModal}
            aria-label="Close"
            className="btn-ghost-app text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Task input */}
        <div className="px-5 pt-4 pb-2 flex flex-col gap-3">
          <label htmlFor="pipeline-task" className="text-sm font-medium" style={{ color: 'var(--t2)' }}>
            {t('pipeline.taskLabel', 'Your task / prompt')}
          </label>
          <textarea
            id="pipeline-task"
            ref={textareaRef}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('pipeline.taskPlaceholder', 'Describe what you want the agent team to work on…\ne.g. "Build a REST API for a food delivery app with auth, orders and payments"')}
            rows={5}
            className="w-full rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--t1)',
              lineHeight: '1.5',
            }}
          />
          <p className="text-xs" style={{ color: 'var(--t4)' }}>
            {t('pipeline.ctrlEnter', 'Ctrl+Enter to run')} · {agentCount} {t('pipeline.agents', 'agents')} · {t('pipeline.sequential', 'sequential, results passed forward')}
          </p>

          {/* Loop control */}
          <div className="flex items-center gap-2">
            <span className="text-xs shrink-0" style={{ color: 'var(--t3)' }}>Loop:</span>
            {([1, 2, 3, 5, -1] as const).map((v) => (
              <button
                key={v}
                onClick={() => setLoops(v)}
                className="px-2 py-0.5 rounded text-xs font-semibold transition-colors"
                style={{
                  background: loops === v ? 'rgba(167,139,250,0.2)' : 'var(--bg-input)',
                  color: loops === v ? '#A78BFA' : 'var(--t3)',
                  border: `1px solid ${loops === v ? 'rgba(167,139,250,0.4)' : 'var(--border)'}`,
                }}
              >
                {v === -1 ? '∞' : v === 1 ? '1×' : `${v}×`}
              </button>
            ))}
          </div>
        </div>

        {/* Execution order preview */}
        <div className="px-5 pb-4">
          <p className="text-[11px] font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--t4)' }}>
            {t('pipeline.executionOrder', 'Execution order')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {orderedNodes.map((node, i) => {
              const agent = AD_MAP.get(node.agentId)
              if (!agent) return null
              const color = PHASE_COLORS[agent.phase] ?? '#888'
              return (
                <span
                  key={node.id}
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                >
                  {i + 1}. {agent.name}
                </span>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={closeModal}
            className="px-3 py-1.5 rounded-md text-sm"
            style={{ background: 'var(--bg-input)', color: 'var(--t2)', border: '1px solid var(--border)' }}
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleRun}
            disabled={!task.trim() || isPipelineRunning}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{
              background: 'rgba(52,211,153,0.2)',
              color: '#34D399',
              border: '1px solid rgba(52,211,153,0.35)',
              cursor: task.trim() && !isPipelineRunning ? 'pointer' : 'not-allowed',
            }}
          >
            <span>▶</span>
            <span>{t('pipeline.startRun', 'Run')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
