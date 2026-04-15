import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalBase } from './ModalBase'
import { useSimulationStore } from '../../store/simulationStore'
import { useVfsStore } from '../../store/vfsStore'
import { AD_MAP } from '../../data/agents'
import type { LLMCallLog } from '../../types'


type ReviewTab = 'timeline' | 'files' | 'tools' | 'summary' | 'agents'

const TAB_ICONS: Record<ReviewTab, string> = {
  timeline: '📜',
  agents: '🤖',
  files: '📁',
  tools: '🔧',
  summary: '📊',
}

export const SimulationReviewModal: React.FC = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState<ReviewTab>('timeline')

  return (
    <ModalBase modalId="review" title={t('review.title', 'Simulation Review')} width={900}>
      {/* Tab bar */}
      <div
        className="flex border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
        role="tablist"
      >
        {(['timeline', 'agents', 'files', 'tools', 'summary'] as ReviewTab[]).map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors"
            style={{
              color: tab === id ? 'var(--accent)' : 'var(--t3)',
              borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
            }}
            onClick={() => setTab(id)}
          >
            {TAB_ICONS[id]} {t(`review.tab.${id}`, id)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 300, maxHeight: '65vh' }}>
        {tab === 'timeline' && <TimelineTab />}
        {tab === 'agents' && <AgentsTab />}
        {tab === 'files' && <FilesTab />}
        {tab === 'tools' && <ToolsTab />}
        {tab === 'summary' && <SummaryTab />}
      </div>
    </ModalBase>
  )
}

// ─── Timeline Tab ──────────────────────────────────────────────────────────────

const TIMELINE_PREVIEW_LEN = 400

const TimelineTab: React.FC = () => {
  const { t } = useTranslation()
  const messages = useSimulationStore((s) => s.messages)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const toggleExpanded = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  if (messages.length === 0) {
    return <EmptyState text={t('review.noMessages', 'No simulation messages yet. Run a simulation first.')} />
  }

  return (
    <div className="flex flex-col gap-1.5">
      {messages.map((msg, idx) => {
        const agent = AD_MAP.get(msg.agentId)
        const isLong = msg.text.length > TIMELINE_PREVIEW_LEN
        const isExp = expanded.has(idx)
        const displayText = isLong && !isExp ? msg.text.slice(0, TIMELINE_PREVIEW_LEN) + '…' : msg.text
        return (
          <div
            key={`${msg.timestamp}-${idx}`}
            className="text-[12px] leading-relaxed rounded-lg px-3 py-2"
            style={{ background: 'var(--bg-input)', color: 'var(--t2)' }}
          >
            <span className="text-[10px] mr-2" style={{ color: 'var(--t4)' }}>
              {msg.phase ? `[${msg.phase}]` : ''}
            </span>
            <span className="font-semibold mr-1" style={{ color: 'var(--t1)' }}>
              {agent?.name ?? msg.agentId}:
            </span>
            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayText}</span>
            {isLong && (
              <button
                className="ml-2 text-[11px] font-semibold"
                style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => toggleExpanded(idx)}
              >
                {isExp ? t('review.showLess', 'Show less ▲') : t('review.showMore', 'Show more ▼')}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Agents Tab ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  done: '#34D399',
  error: '#F87171',
  streaming: '#60A5FA',
  pending: 'var(--t4)',
}

const CollapsibleSection: React.FC<{ label: string; content: string; defaultOpen?: boolean; mono?: boolean }> = ({
  label, content, defaultOpen = false, mono = false,
}) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-2">
      <button
        className="flex items-center gap-1.5 w-full text-left text-[10px] font-bold uppercase tracking-wide py-0.5"
        style={{ color: 'var(--t4)', background: 'none', border: 'none', cursor: 'pointer' }}
        onClick={() => setOpen((v) => !v)}
      >
        <span style={{ fontSize: 8 }}>{open ? '▼' : '▶'}</span>
        {label}
        {!open && content.length > 0 && (
          <span className="ml-2 font-normal normal-case" style={{ color: 'var(--t3)' }}>
            {content.slice(0, 60).replace(/\n/g, ' ')}…
          </span>
        )}
      </button>
      {open && (
        <pre
          className="text-[11px] p-2.5 rounded-lg mt-1 overflow-auto"
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--t2)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            border: '1px solid var(--border)',
            maxHeight: 320,
            fontFamily: mono ? 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' : 'inherit',
            lineHeight: 1.55,
          }}
        >
          {content || '(empty)'}
        </pre>
      )}
    </div>
  )
}

const AgentsTab: React.FC = () => {
  const { t } = useTranslation()
  const executionLog = useSimulationStore((s) => s.executionLog)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (executionLog.length === 0) {
    return <EmptyState text={t('review.noAgents', 'No LLM calls recorded. Run the real pipeline (⚡) first.')} />
  }

  const selected = selectedId
    ? executionLog.find((e) => e.id === selectedId) ?? executionLog[0]
    : executionLog[0]

  const fmtMs = (ms?: number) => ms == null ? '' : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
  const fmtTok = (log: LLMCallLog) => {
    if (!log.usage) return ''
    const { promptTokens, completionTokens } = log.usage
    return `${promptTokens.toLocaleString()}→${completionTokens.toLocaleString()} tok`
  }

  return (
    <div className="flex gap-3" style={{ minHeight: 360 }}>
      {/* Agent list (left panel) */}
      <div
        className="w-52 shrink-0 flex flex-col gap-0.5 overflow-y-auto rounded-lg border p-1"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-input)', maxHeight: '62vh' }}
      >
        {executionLog.map((entry) => {
          const isActive = (selectedId ?? executionLog[0]?.id) === entry.id
          const statusColor = STATUS_COLORS[entry.status] ?? 'var(--t4)'
          return (
            <button
              key={entry.id}
              className="w-full text-left px-2.5 py-2 rounded-md text-[11px] transition-colors"
              style={{
                background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: isActive ? 'var(--t1)' : 'var(--t2)',
                border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
              }}
              onClick={() => setSelectedId(entry.id)}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span style={{ color: statusColor, fontSize: 9 }}>●</span>
                <span className="font-semibold truncate">{entry.agentName}</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <span
                  className="text-[9px] px-1 py-0.5 rounded"
                  style={{ background: 'rgba(167,139,250,0.12)', color: '#A78BFA' }}
                >
                  {entry.model.split('/').pop()?.slice(0, 16) ?? entry.model}
                </span>
                {entry.latencyMs != null && (
                  <span className="text-[9px]" style={{ color: 'var(--t4)' }}>{fmtMs(entry.latencyMs)}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Detail panel (right) */}
      {selected && (
        <div className="flex-1 min-w-0 overflow-y-auto" style={{ maxHeight: '62vh' }}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--t1)' }}>{selected.agentName}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                  style={{ background: 'rgba(167,139,250,0.12)', color: '#A78BFA' }}
                >
                  {selected.model}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                  style={{
                    background: `rgba(${selected.status === 'done' ? '52,211,153' : selected.status === 'error' ? '248,113,113' : '96,165,250'},0.12)`,
                    color: STATUS_COLORS[selected.status] ?? 'var(--t4)',
                  }}
                >
                  {selected.status}
                </span>
                {selected.latencyMs != null && (
                  <span className="text-[10px]" style={{ color: 'var(--t4)' }}>⏱ {fmtMs(selected.latencyMs)}</span>
                )}
                {fmtTok(selected) && (
                  <span className="text-[10px]" style={{ color: 'var(--t4)' }}>🔢 {fmtTok(selected)}</span>
                )}
              </div>
            </div>
          </div>

          {selected.status === 'error' && selected.error && (
            <div
              className="mb-3 px-3 py-2 rounded-lg text-[12px]"
              style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' }}
            >
              ❌ {selected.error}
            </div>
          )}

          {/* Sections */}
          <CollapsibleSection
            label={t('review.systemPrompt', 'System Prompt')}
            content={selected.systemPrompt}
            defaultOpen={false}
            mono
          />
          <CollapsibleSection
            label={t('review.userMessage', 'User Message / Context')}
            content={selected.userMessage}
            defaultOpen={false}
            mono
          />
          <CollapsibleSection
            label={t('review.response', 'Agent Response')}
            content={selected.responseText || '(no response yet)'}
            defaultOpen
          />
        </div>
      )}
    </div>
  )
}

// ─── Files Tab ─────────────────────────────────────────────────────────────────

const FilesTab: React.FC = () => {
  const { t } = useTranslation()
  // Subscribe to the stable Map reference (only replaced on actual VFS writes, not every render)
  const vfsFiles = useVfsStore((s) => s.files)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  const snapshot = useMemo(
    () => Array.from(vfsFiles.values()).sort((a, b) => a.path.localeCompare(b.path)),
    [vfsFiles],
  )

  const files = useMemo(() => snapshot.filter((f) => f.type === 'file'), [snapshot])
  const dirs = useMemo(() => snapshot.filter((f) => f.type === 'dir'), [snapshot])

  if (files.length === 0 && dirs.length === 0) {
    return <EmptyState text={t('review.noFiles', 'No files in virtual file system.')} />
  }

  const selectedFile = files.find((f) => f.path === selectedPath)

  return (
    <div className="flex gap-3" style={{ minHeight: 300 }}>
      {/* File tree */}
      <div
        className="w-56 shrink-0 rounded-lg overflow-y-auto border"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-input)', maxHeight: '60vh' }}
      >
        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--t4)' }}>
          {t('review.fileTree', 'File Tree')} ({files.length})
        </div>
        {dirs.map((d) => (
          <div key={d.path} className="px-2 py-0.5 text-[11px]" style={{ color: 'var(--t4)' }}>
            📁 {d.path}
          </div>
        ))}
        {files.map((f) => (
          <button
            key={f.path}
            className="w-full text-left px-2 py-1 text-[11px] hover:opacity-80 transition-colors truncate"
            style={{
              color: selectedPath === f.path ? 'var(--accent)' : 'var(--t2)',
              background: selectedPath === f.path ? 'rgba(var(--accent-rgb, 99,102,241), 0.1)' : 'transparent',
            }}
            onClick={() => setSelectedPath(f.path)}
            title={f.path}
          >
            📄 {f.path}
            {f.createdBy !== 'system' && (
              <span className="ml-1 text-[9px] opacity-60">({f.createdBy})</span>
            )}
          </button>
        ))}
      </div>

      {/* File content viewer */}
      <div className="flex-1 min-w-0">
        {selectedFile ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] font-semibold" style={{ color: 'var(--t1)' }}>
                {selectedFile.path}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'var(--bg-input)', color: 'var(--t3)' }}
              >
                {t('review.createdBy', 'by')} {selectedFile.createdBy}
              </span>
            </div>
            <pre
              className="text-[11px] leading-relaxed p-3 rounded-lg overflow-auto whitespace-pre-wrap"
              style={{
                background: 'var(--bg-input)',
                color: 'var(--t2)',
                maxHeight: '50vh',
                border: '1px solid var(--border)',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
              }}
            >
              {selectedFile.content || '(empty file)'}
            </pre>
          </div>
        ) : (
          <EmptyState text={t('review.selectFile', 'Select a file from the tree to view its content.')} />
        )}
      </div>
    </div>
  )
}

// ─── Tools Tab ─────────────────────────────────────────────────────────────────

const ToolsTab: React.FC = () => {
  const { t } = useTranslation()
  const toolCalls = useSimulationStore((s) => s.toolCalls)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterTool, setFilterTool] = useState<string>('all')

  const toolTypes = useMemo(() => {
    const set = new Set(toolCalls.map((tc) => tc.tool))
    return ['all', ...Array.from(set).sort()]
  }, [toolCalls])

  const filtered = useMemo(
    () => filterTool === 'all' ? toolCalls : toolCalls.filter((tc) => tc.tool === filterTool),
    [toolCalls, filterTool],
  )

  if (toolCalls.length === 0) {
    return <EmptyState text={t('review.noTools', 'No tool calls recorded. Run a simulation first.')} />
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--t4)' }}>
          {t('review.filter', 'Filter')}:
        </span>
        {toolTypes.map((type) => (
          <button
            key={type}
            className="px-2 py-1 rounded text-[11px] transition-colors"
            style={{
              background: filterTool === type ? 'var(--accent)' : 'var(--bg-input)',
              color: filterTool === type ? '#fff' : 'var(--t3)',
              border: `1px solid ${filterTool === type ? 'var(--accent)' : 'var(--border)'}`,
            }}
            onClick={() => setFilterTool(type)}
          >
            {type === 'all' ? t('review.all', 'All') : type} {type === 'all' ? `(${toolCalls.length})` : ''}
          </button>
        ))}
      </div>

      {/* Tool call list */}
      <div className="flex flex-col gap-1">
        {filtered.map((tc) => {
          const agent = AD_MAP.get(tc.agentId)
          const isExpanded = expandedId === tc.id
          return (
            <div
              key={tc.id}
              className="rounded-lg overflow-hidden border"
              style={{ borderColor: tc.status === 'error' ? 'var(--ph-qa)' : 'var(--border)' }}
            >
              <button
                className="w-full text-left px-3 py-2 flex items-center gap-2 text-[12px]"
                style={{ background: 'var(--bg-input)', color: 'var(--t2)' }}
                onClick={() => setExpandedId(isExpanded ? null : tc.id)}
              >
                <span className={tc.status === 'error' ? 'text-red-400' : 'text-green-400'}>
                  {tc.status === 'error' ? '❌' : '✅'}
                </span>
                <span className="font-semibold" style={{ color: 'var(--t1)' }}>
                  {tc.tool}
                </span>
                <span style={{ color: 'var(--t4)' }}>
                  {agent?.name ?? tc.agentId}
                </span>
                <span className="flex-1 truncate" style={{ color: 'var(--t3)' }}>
                  {formatArgs(tc.args)}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--t4)' }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>

              {isExpanded && (
                <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-panel)' }}>
                  <div className="mb-2">
                    <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--t4)' }}>
                      {t('review.args', 'Arguments')}:
                    </span>
                    <pre
                      className="text-[11px] mt-1 p-2 rounded"
                      style={{
                        background: 'var(--bg-input)',
                        color: 'var(--t2)',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      }}
                    >
                      {JSON.stringify(tc.args, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--t4)' }}>
                      {t('review.result', 'Result')}:
                    </span>
                    <pre
                      className="text-[11px] mt-1 p-2 rounded whitespace-pre-wrap"
                      style={{
                        background: 'var(--bg-input)',
                        color: tc.status === 'error' ? 'var(--ph-qa)' : 'var(--t2)',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      {tc.result || '(no output)'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Summary Tab ───────────────────────────────────────────────────────────────

const SummaryTab: React.FC = () => {
  const { t } = useTranslation()
  const messages = useSimulationStore((s) => s.messages)
  const toolCalls = useSimulationStore((s) => s.toolCalls)
  // Subscribe to the stable Map reference to avoid infinite re-render loop
  const vfsFiles = useVfsStore((s) => s.files)

  const stats = useMemo(() => {
    const snapshot = Array.from(vfsFiles.values())
    const files = snapshot.filter((f) => f.type === 'file')
    const agentCreated = files.filter((f) => f.createdBy !== 'system')
    const errorCalls = toolCalls.filter((tc) => tc.status === 'error')

    // Per-agent breakdown
    const perAgent = new Map<string, { calls: number; errors: number; filesCreated: number }>()
    for (const tc of toolCalls) {
      const entry = perAgent.get(tc.agentId) ?? { calls: 0, errors: 0, filesCreated: 0 }
      entry.calls++
      if (tc.status === 'error') entry.errors++
      perAgent.set(tc.agentId, entry)
    }
    for (const f of agentCreated) {
      const entry = perAgent.get(f.createdBy) ?? { calls: 0, errors: 0, filesCreated: 0 }
      entry.filesCreated++
      perAgent.set(f.createdBy, entry)
    }

    // Per-tool breakdown
    const perTool = new Map<string, number>()
    for (const tc of toolCalls) {
      perTool.set(tc.tool, (perTool.get(tc.tool) ?? 0) + 1)
    }

    return {
      totalMessages: messages.length,
      totalToolCalls: toolCalls.length,
      totalFiles: files.length,
      agentCreatedFiles: agentCreated.length,
      seedFiles: files.length - agentCreated.length,
      errors: errorCalls.length,
      perAgent: [...perAgent.entries()].sort((a, b) => b[1].calls - a[1].calls),
      perTool: [...perTool.entries()].sort((a, b) => b[1] - a[1]),
    }
  }, [messages, toolCalls, vfsFiles])

  return (
    <div className="flex flex-col gap-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label={t('review.messages', 'Messages')} value={stats.totalMessages} />
        <KpiCard label={t('review.toolCallsTotal', 'Tool Calls')} value={stats.totalToolCalls} />
        <KpiCard label={t('review.filesCreated', 'Files Created')} value={stats.agentCreatedFiles} />
        <KpiCard label={t('review.errors', 'Errors')} value={stats.errors} accent={stats.errors > 0 ? 'var(--ph-qa)' : undefined} />
      </div>

      {/* Per-tool breakdown */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--t4)' }}>
          {t('review.byTool', 'By Tool')}
        </div>
        <div className="flex flex-wrap gap-2">
          {stats.perTool.map(([tool, count]) => (
            <div
              key={tool}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium"
              style={{ background: 'var(--bg-input)', color: 'var(--t2)', border: '1px solid var(--border)' }}
            >
              {tool}: <span className="font-bold" style={{ color: 'var(--t1)' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-agent breakdown */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--t4)' }}>
          {t('review.byAgent', 'By Agent')}
        </div>
        <div className="flex flex-col gap-1">
          {stats.perAgent.map(([agentId, data]) => {
            const agent = AD_MAP.get(agentId)
            return (
              <div
                key={agentId}
                className="flex items-center gap-2 px-3 py-1.5 rounded text-[11px]"
                style={{ background: 'var(--bg-input)' }}
              >
                <span className="font-semibold w-40 truncate" style={{ color: 'var(--t1)' }}>
                  {agent?.name ?? agentId}
                </span>
                <span style={{ color: 'var(--t3)' }}>
                  {data.calls} {t('review.calls', 'calls')}
                </span>
                {data.filesCreated > 0 && (
                  <span style={{ color: 'var(--ph-build)' }}>
                    📄 {data.filesCreated}
                  </span>
                )}
                {data.errors > 0 && (
                  <span style={{ color: 'var(--ph-qa)' }}>
                    ❌ {data.errors}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Shared Components ─────────────────────────────────────────────────────────

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center justify-center py-12 text-[13px]" style={{ color: 'var(--t4)' }}>
    {text}
  </div>
)

const KpiCard: React.FC<{ label: string; value: number; accent?: string }> = ({ label, value, accent }) => (
  <div
    className="rounded-lg px-4 py-3 text-center"
    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}
  >
    <div className="text-2xl font-bold mb-0.5" style={{ color: accent ?? 'var(--t1)' }}>
      {value}
    </div>
    <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--t4)' }}>
      {label}
    </div>
  </div>
)

function formatArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args)
  if (entries.length === 0) return ''
  if (entries.length === 1) return String(entries[0][1])
  return entries.map(([k, v]) => `${k}=${String(v).slice(0, 40)}`).join(', ')
}
