import React, { useEffect, useId, useMemo, useState } from 'react'
import { useUiStore } from '../../store/uiStore'
import { useLLMStore } from '../../store/llmStore'
import { useMcpStore } from '../../store/mcpStore'
import {
  testConnection,
  testWebSearchConnection,
  COMETAPI_BASE_URL,
  OPENROUTER_BASE_URL,
  DEFAULT_MODEL_MAP,
  OPENROUTER_DEFAULT_MODEL_MAP,
  fetchModelCatalog,
  type ProviderModelCatalogItem,
} from '../../services/llmService'
import type { ModelType, LLMProvider, WebSearchProvider, SonarModelId, McpToolGroup } from '../../types'
import { SONAR_MODELS } from '../../types'
import { getEnvApiKey, getEnvWebSearchApiKey, getEnvWebSearchConfig, getDefaultLLMProvider } from '../../utils/env'
import { ModalBase } from './ModalBase'

const MODEL_TIERS: ModelType[] = ['opus', 'sonnet', 'haiku']
const TIER_LABELS: Record<ModelType, string> = {
  opus: 'Opus (complex reasoning)',
  sonnet: 'Sonnet (balanced)',
  haiku: 'Haiku (fast / cheap)',
}

const MODAL_ID = 'settings'

// ─── Tool Settings constants ──────────────────────────────────────────────────

const BUILTIN_TOOL_NAMES = ['Read', 'Write', 'Read/Write', 'Bash', 'WebSearch', 'Agent', 'TaskCreate'] as const

interface QuickGroup { name: string; toolNames: string[]; icon: string; hint: string }
const QUICK_START_GROUPS: QuickGroup[] = [
  { name: 'web_search',   toolNames: ['WebSearch'],                   icon: '🔍', hint: 'Web search via Sonar/Perplexity' },
  { name: 'file_tools',   toolNames: ['Read', 'Write', 'Read/Write'], icon: '📁', hint: 'File read/write operations' },
  { name: 'dev_tools',    toolNames: ['Bash', 'Read', 'Write'],       icon: '🛠', hint: 'Bash + file access for builders' },
  { name: 'docker_tools', toolNames: [],                              icon: '🐳', hint: 'Docker Desktop MCP tools (fill after connecting)' },
]

// Quick-pick model presets shown as chips under model inputs
const MODEL_PRESETS: Record<LLMProvider, Partial<Record<ModelType, string[]>>> = {
  cometapi: {
    opus:   ['claude-opus-4-5'],
    sonnet: ['claude-sonnet-4-5'],
    haiku:  ['claude-haiku-4-5'],
  },
  openrouter: {
    opus:   ['anthropic/claude-opus-4-5', 'openai/gpt-4o', 'google/gemini-2.5-pro'],
    sonnet: ['anthropic/claude-sonnet-4-5', 'openai/gpt-4o-mini', 'mistralai/mistral-large'],
    haiku:  ['anthropic/claude-haiku-4-5', 'openai/gpt-4.1-mini', 'mistralai/mistral-small'],
  },
}

type TestState = 'idle' | 'testing' | 'ok' | 'error'

interface CatalogState {
  loading: boolean
  error: string
  fromCache: boolean
  fetchedAt?: number
  models: ProviderModelCatalogItem[]
}

function fuzzyScore(text: string, query: string): number {
  const src = text.toLowerCase()
  const q = query.trim().toLowerCase()
  if (!q) return 1
  if (src === q) return 100
  if (src.startsWith(q)) return 80
  if (src.includes(q)) return 60

  let cursor = 0
  for (let idx = 0; idx < src.length && cursor < q.length; idx += 1) {
    if (src[idx] === q[cursor]) cursor += 1
  }
  return cursor === q.length ? 35 : 0
}

function filterModels(items: ProviderModelCatalogItem[], query: string): ProviderModelCatalogItem[] {
  const q = query.trim()
  if (!q) return items.slice(0, 8)

  return items
    .map((item) => {
      const scoreId = fuzzyScore(item.id, q)
      const scoreName = fuzzyScore(item.name, q)
      return { item, score: Math.max(scoreId, scoreName) }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.item.id.localeCompare(b.item.id)
    })
    .slice(0, 8)
    .map((entry) => entry.item)
}

// ─── Tiny primitives ──────────────────────────────────────────────────────────

const TabBtn: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '10px 18px',
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
      color: active ? 'var(--t1)' : 'var(--t4)',
      transition: 'color 0.15s, border-color 0.15s',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
)

// ─── Group card ───────────────────────────────────────────────────────────────

interface GroupCardProps {
  group: McpToolGroup
  mcpTools: { name: string; description?: string }[]
  onUpdate: (id: string, name: string, toolNames: string[]) => void
  onRemove: (id: string) => void
}

const GroupCard: React.FC<GroupCardProps> = ({ group, mcpTools, onUpdate, onRemove }) => {
  const [open, setOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState(group.name)
  const inputId = useId()

  const toggleTool = (tool: string) => {
    const next = group.toolNames.includes(tool)
      ? group.toolNames.filter((t) => t !== tool)
      : [...group.toolNames, tool]
    onUpdate(group.id, nameDraft || group.name, next)
  }

  const commitName = () => {
    if (nameDraft.trim() && nameDraft.trim() !== group.name) {
      onUpdate(group.id, nameDraft.trim(), group.toolNames)
    }
  }

  return (
    <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px' }}>
        {open ? (
          <input
            id={inputId}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
            placeholder="group name"
            style={{ ...inputStyle, fontSize: '12px', fontWeight: 600, flex: 1, height: '28px', padding: '4px 8px' }}
          />
        ) : (
          <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--t1)', fontFamily: 'var(--ff-mono)' }}>
            {group.name}
          </span>
        )}
        <span style={{ fontSize: '11px', color: 'var(--t4)', flexShrink: 0 }}>
          {group.toolNames.length} tool{group.toolNames.length !== 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{ ...smallBtnStyle, color: open ? '#A78BFA' : 'var(--t3)', background: open ? 'rgba(167,139,250,0.12)' : 'var(--bg-card)', border: `1px solid ${open ? 'rgba(167,139,250,0.35)' : 'var(--border)'}` }}
        >
          {open ? 'Done' : 'Edit'}
        </button>
        <button
          type="button"
          onClick={() => onRemove(group.id)}
          aria-label={`Delete group ${group.name}`}
          style={{ ...smallBtnStyle, color: '#F87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          ×
        </button>
      </div>

      {/* Current tools chips */}
      {group.toolNames.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0 10px 8px' }}>
          {group.toolNames.map((tool) => (
            <span
              key={tool}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--ff-mono)', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#C4B5FD' }}
            >
              {tool}
              {open && (
                <button type="button" onClick={() => toggleTool(tool)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F87171', fontSize: '11px', padding: 0, lineHeight: 1 }} aria-label={`Remove ${tool}`}>×</button>
              )}
            </span>
          ))}
        </div>
      )}

      {group.toolNames.length === 0 && !open && (
        <p style={{ padding: '0 10px 8px', fontSize: '11px', color: 'var(--t4)', margin: 0 }}>No tools — click Edit to add</p>
      )}

      {/* Tool picker (expanded) */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Built-in tools */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t4)', marginBottom: '5px' }}>
              Built-in
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {BUILTIN_TOOL_NAMES.map((tool) => {
                const isIn = group.toolNames.includes(tool)
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--ff-mono)',
                      background: isIn ? 'rgba(52,211,153,0.16)' : 'var(--bg-card)',
                      border: `1px solid ${isIn ? 'rgba(52,211,153,0.45)' : 'var(--border)'}`,
                      color: isIn ? '#34D399' : 'var(--t3)',
                    }}
                  >
                    {isIn ? '✓ ' : ''}{tool}
                  </button>
                )
              })}
            </div>
          </div>

          {/* MCP tools (if connected) */}
          {mcpTools.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t4)', marginBottom: '5px' }}>
                MCP tools ({mcpTools.length} available)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                {mcpTools.map((tool) => {
                  const isIn = group.toolNames.includes(tool.name)
                  return (
                    <button
                      key={tool.name}
                      type="button"
                      onClick={() => toggleTool(tool.name)}
                      title={tool.description}
                      style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--ff-mono)',
                        background: isIn ? 'rgba(52,211,153,0.16)' : 'rgba(52,211,153,0.06)',
                        border: `1px solid ${isIn ? 'rgba(52,211,153,0.45)' : 'rgba(52,211,153,0.2)'}`,
                        color: '#34D399',
                      }}
                    >
                      {isIn ? '✓ ' : ''}{tool.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const LLMSettingsContent: React.FC = () => {
  const { closeModal } = useUiStore()
  const llm = useLLMStore()
  const mcp = useMcpStore()

  const [activeTab, setActiveTab] = useState<'llm' | 'tools'>('llm')

  // ── MCP Gateway state ───────────────────────────────────────────────────────
  const [mcpUrl, setMcpUrl] = useState(mcp.config.gatewayUrl)
  const [mcpToken, setMcpToken] = useState(mcp.config.bearerToken)
  const [mcpEnabled, setMcpEnabled] = useState(mcp.config.enabled)
  const [showMcpToken, setShowMcpToken] = useState(false)
  const [mcpToolGroupsDraft, setMcpToolGroupsDraft] = useState<McpToolGroup[]>(mcp.toolGroups)
  const [newGroupName, setNewGroupName] = useState('')

  // ── LLM Provider state ──────────────────────────────────────────────────────
  const [provider, setProviderDraft] = useState<LLMProvider>(llm.provider)
  const [providerConfigsDraft, setProviderConfigsDraft] = useState(() => ({
    cometapi: {
      apiKey: llm.providerConfigs.cometapi.apiKey,
      baseUrl: llm.providerConfigs.cometapi.baseUrl,
      modelMap: { ...llm.providerConfigs.cometapi.modelMap },
    },
    openrouter: {
      apiKey: llm.providerConfigs.openrouter.apiKey,
      baseUrl: llm.providerConfigs.openrouter.baseUrl,
      modelMap: { ...llm.providerConfigs.openrouter.modelMap },
    },
  }))
  const apiKeyDraft = providerConfigsDraft[provider].apiKey
  const baseUrlDraft = providerConfigsDraft[provider].baseUrl
  const modelMapDraft = providerConfigsDraft[provider].modelMap
  const [debugDraft, setDebugDraft] = useState(llm.debugMode)
  const [showKey, setShowKey] = useState(false)
  const [testState, setTestState] = useState<TestState>('idle')
  const [testError, setTestError] = useState('')
  const [modelSearch, setModelSearch] = useState<Record<ModelType, string>>({ opus: '', sonnet: '', haiku: '' })
  const [catalogByProvider, setCatalogByProvider] = useState<Record<LLMProvider, CatalogState>>({
    cometapi: { loading: false, error: '', fromCache: false, models: [] },
    openrouter: { loading: false, error: '', fromCache: false, models: [] },
  })

  // ── Web Search Tool state ───────────────────────────────────────────────────
  const [wsEnabled, setWsEnabled] = useState(llm.webSearch.enabled)
  const [wsProvider, setWsProvider] = useState<WebSearchProvider>(llm.webSearch.provider)
  const [wsKey, setWsKey] = useState(llm.webSearch.apiKey)
  const [wsModel, setWsModel] = useState<SonarModelId>(llm.webSearch.model)
  const [showWsKey, setShowWsKey] = useState(false)
  const [wsTestState, setWsTestState] = useState<TestState>('idle')
  const [wsTestError, setWsTestError] = useState('')

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleProviderChange = (p: LLMProvider) => {
    setProviderDraft(p)
    setTestState('idle')
    setTestError('')
    setModelSearch({ opus: '', sonnet: '', haiku: '' })
  }

  const updateProviderDraft = (
    nextProvider: LLMProvider,
    update: (current: { apiKey: string; baseUrl: string; modelMap: Record<ModelType, string> }) => { apiKey: string; baseUrl: string; modelMap: Record<ModelType, string> },
  ) => {
    setProviderConfigsDraft((prev) => ({
      ...prev,
      [nextProvider]: update(prev[nextProvider]),
    }))
  }

  const loadModelCatalog = async (forceRefresh = false) => {
    if (!apiKeyDraft.trim()) return
    setCatalogByProvider((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], loading: true, error: '' },
    }))

    const result = await fetchModelCatalog(apiKeyDraft, baseUrlDraft, { forceRefresh })
    setCatalogByProvider((prev) => ({
      ...prev,
      [provider]: {
        loading: false,
        error: result.ok ? '' : (result.error ?? ''),
        fromCache: result.fromCache,
        fetchedAt: result.fetchedAt,
        models: result.models,
      },
    }))
  }

  useEffect(() => {
    const state = catalogByProvider[provider]
    if (!apiKeyDraft.trim() || state.loading || state.models.length > 0) return
    void loadModelCatalog(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])

  const catalog = catalogByProvider[provider]
  const fuzzyMatches = useMemo(() => ({
    opus: filterModels(catalog.models, modelSearch.opus),
    sonnet: filterModels(catalog.models, modelSearch.sonnet),
    haiku: filterModels(catalog.models, modelSearch.haiku),
  }), [catalog.models, modelSearch])

  const handleSave = () => {
    llm.setProviderConfigs(provider, providerConfigsDraft, debugDraft)
    llm.setWebSearch({ enabled: wsEnabled, provider: wsProvider, apiKey: wsKey, model: wsModel })
    // Save MCP config; (dis)connect based on enabled toggle
    mcp.setConfig({ gatewayUrl: mcpUrl, bearerToken: mcpToken, enabled: mcpEnabled })
    mcp.setToolGroups(mcpToolGroupsDraft)
    if (mcpEnabled) {
      void mcp.connect()
    } else {
      void mcp.disconnect()
    }
    closeModal()
  }

  const handleClearData = () => {
    llm.clearPersistedData()
    const freshProvider = getDefaultLLMProvider()
    const freshProviderConfigs = {
      cometapi: {
        apiKey: getEnvApiKey('cometapi'),
        baseUrl: COMETAPI_BASE_URL,
        modelMap: { ...DEFAULT_MODEL_MAP },
      },
      openrouter: {
        apiKey: getEnvApiKey('openrouter'),
        baseUrl: OPENROUTER_BASE_URL,
        modelMap: { ...OPENROUTER_DEFAULT_MODEL_MAP },
      },
    }
    const freshWS = getEnvWebSearchConfig()
    setProviderDraft(freshProvider)
    setProviderConfigsDraft(freshProviderConfigs)
    setDebugDraft(false)
    setModelSearch({ opus: '', sonnet: '', haiku: '' })
    setCatalogByProvider({
      cometapi: { loading: false, error: '', fromCache: false, models: [] },
      openrouter: { loading: false, error: '', fromCache: false, models: [] },
    })
    setWsEnabled(freshWS.enabled)
    setWsProvider(freshWS.provider)
    setWsKey(freshWS.apiKey)
    setWsModel(freshWS.model)
    setTestState('idle')
    setTestError('')
    setWsTestState('idle')
    setWsTestError('')
  }

  const handleTest = async () => {
    setTestState('testing'); setTestError('')
    const result = await testConnection(apiKeyDraft, baseUrlDraft)
    setTestState(result.ok ? 'ok' : 'error')
    if (!result.ok) setTestError(result.error ?? 'Unknown error')
  }

  const handleWsTest = async () => {
    setWsTestState('testing'); setWsTestError('')
    const result = await testWebSearchConnection({ provider: wsProvider, apiKey: wsKey })
    setWsTestState(result.ok ? 'ok' : 'error')
    if (!result.ok) setWsTestError(result.error ?? 'Unknown error')
  }

  const parseGroupTools = (raw: string): string[] =>
    Array.from(new Set(raw.split(',').map((tool) => tool.trim()).filter(Boolean)))

  const addGroup = (name: string, toolNames: string[]) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (mcpToolGroupsDraft.some((g) => g.name === trimmed)) return
    const nextGroup: McpToolGroup = {
      id: `grp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmed,
      toolNames: Array.from(new Set(toolNames.map((t) => t.trim()).filter(Boolean))),
    }
    setMcpToolGroupsDraft((groups) => [...groups, nextGroup])
  }

  const removeGroup = (id: string) => {
    setMcpToolGroupsDraft((groups) => groups.filter((group) => group.id !== id))
  }

  const updateGroup = (id: string, name: string, toolNames: string[]) => {
    setMcpToolGroupsDraft((groups) => groups.map((group) =>
      group.id === id ? { ...group, name, toolNames: parseGroupTools(toolNames.join(',')) } : group
    ))
  }
  const testLabel = (s: TestState) =>
    s === 'testing' ? '⏳ Testing…' : s === 'ok' ? '✓ Connected' : s === 'error' ? '✗ Failed' : 'Test Connection'

  const testBtnStyle = (s: TestState): React.CSSProperties => ({
    ...btnStyle,
    background: s === 'ok' ? 'rgba(52,211,153,0.15)' : s === 'error' ? 'rgba(248,113,113,0.15)' : 'var(--bg-card)',
    color: s === 'ok' ? '#34D399' : s === 'error' ? '#F87171' : 'var(--t2)',
    border: `1px solid ${s === 'ok' ? 'rgba(52,211,153,0.3)' : s === 'error' ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
    cursor: s === 'testing' ? 'not-allowed' : 'pointer',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '82vh' }}>

      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 4px', flexShrink: 0 }}>
        <TabBtn label="🤖 LLM Settings" active={activeTab === 'llm'} onClick={() => setActiveTab('llm')} />
        <TabBtn label="🔧 Tool Settings" active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} />
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ═══════════════════════════════ LLM TAB ═══════════════════════════════ */}
      {activeTab === 'llm' && <>

      {/* SECTION 1 — LLM Provider */}
      <div style={sectionBoxStyle}>
        <div style={sectionTitleStyle}>🤖 LLM Provider — for agents</div>

        {/* Provider selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {(['cometapi', 'openrouter'] as LLMProvider[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleProviderChange(p)}
              style={{
                ...providerBtnStyle,
                background: provider === p ? 'rgba(167,139,250,0.18)' : 'var(--bg-card)',
                border: `1px solid ${provider === p ? '#A78BFA' : 'var(--border)'}`,
                color: provider === p ? '#A78BFA' : 'var(--t2)',
                fontWeight: provider === p ? 700 : 400,
              }}
            >
              {p === 'cometapi' ? '☄️ CometAPI' : '🔀 OpenRouter'}
            </button>
          ))}
        </div>

        {provider === 'openrouter' && (
          <p style={{ ...hintStyle, marginBottom: '12px', color: 'var(--t3)' }}>
            OpenRouter routes to 300+ models. Key format: <code>sk-or-…</code>
            {' — '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: '#A78BFA' }}>Get key ↗</a>
          </p>
        )}
        {provider === 'cometapi' && (
          <p style={{ ...hintStyle, marginBottom: '12px', color: 'var(--t3)' }}>
            CometAPI aggregates Claude models. Key format: <code>sk-…</code>
            {' — '}
            <a href="https://cometapi.com" target="_blank" rel="noreferrer" style={{ color: '#A78BFA' }}>Get key ↗</a>
          </p>
        )}
        <p style={{ ...hintStyle, marginBottom: '12px' }}>
          If <code>.env</code> contains provider keys, they are loaded here automatically. Saving an empty field falls back to the env value.
        </p>

        {/* API Key */}
        <label style={labelStyle}>API Key</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKeyDraft}
            onChange={(e) => {
              updateProviderDraft(provider, (current) => ({ ...current, apiKey: e.target.value }))
              setTestState('idle')
            }}
            placeholder={provider === 'openrouter' ? 'sk-or-…' : 'sk-…'}
            aria-label="CometAPI key"
            style={inputStyle}
          />
          <button type="button" onClick={() => setShowKey((v) => !v)} style={iconBtnStyle} aria-label={showKey ? 'Hide key' : 'Show key'}>
            {showKey ? '🙈' : '👁'}
          </button>
        </div>

        {/* Base URL */}
        <label style={labelStyle}>Base URL</label>
        <input
          type="url"
          value={baseUrlDraft}
          onChange={(e) => {
            updateProviderDraft(provider, (current) => ({ ...current, baseUrl: e.target.value }))
            setTestState('idle')
          }}
          aria-label="CometAPI base URL"
          style={{ ...inputStyle, marginBottom: '16px' }}
        />

        {/* Model Map */}
        <label style={labelStyle}>Model IDs per tier</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {MODEL_TIERS.map((tier) => (
            <div key={tier}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '185px', fontSize: '12px', color: 'var(--t2)', flexShrink: 0 }}>
                  {TIER_LABELS[tier]}
                </span>
                <input
                  type="text"
                  value={modelMapDraft[tier]}
                  onChange={(e) => updateProviderDraft(provider, (current) => ({
                    ...current,
                    modelMap: { ...current.modelMap, [tier]: e.target.value },
                  }))}
                  aria-label={`Model ID for ${tier}`}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              {/* Quick-pick chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px', paddingLeft: '195px' }}>
                {(MODEL_PRESETS[provider][tier] ?? []).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => updateProviderDraft(provider, (current) => ({
                      ...current,
                      modelMap: { ...current.modelMap, [tier]: preset },
                    }))}
                    style={{
                      fontSize: '10px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer',
                      background: modelMapDraft[tier] === preset ? 'rgba(167,139,250,0.2)' : 'var(--bg-input)',
                      border: `1px solid ${modelMapDraft[tier] === preset ? '#A78BFA' : 'var(--border)'}`,
                      color: modelMapDraft[tier] === preset ? '#A78BFA' : 'var(--t4)',
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--t3)' }}>
              Model Finder ({provider === 'openrouter' ? 'OpenRouter' : 'CometAPI'} /models)
            </span>
            <button
              type="button"
              onClick={() => { void loadModelCatalog(true) }}
              disabled={catalog.loading || !apiKeyDraft.trim()}
              style={{ ...smallBtnStyle, color: '#A78BFA', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.35)', opacity: catalog.loading || !apiKeyDraft.trim() ? 0.6 : 1 }}
            >
              {catalog.loading ? 'Refreshing…' : 'Refresh models'}
            </button>
          </div>

          <p style={{ ...hintStyle, marginBottom: '8px' }}>
            Type to fuzzy-search model IDs and names, then click result to assign to tier.
            {catalog.fetchedAt ? ` Last updated: ${new Date(catalog.fetchedAt).toLocaleString()}.` : ''}
            {catalog.fromCache ? ' Loaded from cache.' : ''}
          </p>

          {catalog.error && (
            <div style={{ ...errorBoxStyle, marginBottom: '8px' }}>{catalog.error}</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MODEL_TIERS.map((tier) => (
              <div key={`finder-${tier}`} style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '68px', fontSize: '11px', color: 'var(--t3)', textTransform: 'uppercase' }}>{tier}</span>
                  <input
                    type="text"
                    value={modelSearch[tier]}
                    onChange={(e) => setModelSearch((prev) => ({ ...prev, [tier]: e.target.value }))}
                    placeholder="Search models…"
                    aria-label={`Search models for ${tier}`}
                    style={{ ...inputStyle, flex: 1, fontSize: '12px', padding: '6px 9px' }}
                  />
                </div>
                {fuzzyMatches[tier].length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {fuzzyMatches[tier].map((item) => (
                      <button
                        key={`${tier}-${item.id}`}
                        type="button"
                        onClick={() => {
                          updateProviderDraft(provider, (current) => ({
                            ...current,
                            modelMap: { ...current.modelMap, [tier]: item.id },
                          }))
                          setModelSearch((prev) => ({ ...prev, [tier]: item.id }))
                        }}
                        title={item.name}
                        style={{
                          fontSize: '10px',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          border: '1px solid var(--border)',
                          background: modelMapDraft[tier] === item.id ? 'rgba(167,139,250,0.2)' : 'var(--bg-card)',
                          color: modelMapDraft[tier] === item.id ? '#A78BFA' : 'var(--t3)',
                          fontFamily: 'var(--ff-mono)',
                        }}
                      >
                        {item.id}
                      </button>
                    ))}
                  </div>
                )}
                {modelSearch[tier].trim() && fuzzyMatches[tier].length === 0 && (
                  <p style={{ ...hintStyle, marginTop: '6px' }}>No matching models in catalog.</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Debug Mode */}
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '0' }}>
          <input type="checkbox" checked={debugDraft} onChange={(e) => setDebugDraft(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
          <span>Debug Mode — show LLM call logs panel</span>
        </label>

        {/* Test error */}
        {testState === 'error' && (
          <div style={{ ...errorBoxStyle, marginTop: '12px' }}>{testError}</div>
        )}

        {/* Test button (inline, right-aligned) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button type="button" onClick={() => { void handleTest() }} disabled={testState === 'testing' || !apiKeyDraft} style={testBtnStyle(testState)}>
            {testLabel(testState)}
          </button>
        </div>
      </div>

      {/* SECTION 2 — Web Search Tool */}
      <div style={sectionBoxStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={sectionTitleStyle}>🔍 Web Search Tool — for research agents</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: wsEnabled ? '#34D399' : 'var(--t4)' }}>
            <input type="checkbox" checked={wsEnabled} onChange={(e) => setWsEnabled(e.target.checked)} style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
            {wsEnabled ? 'Enabled' : 'Disabled'}
          </label>
        </div>

        <div style={{ opacity: wsEnabled ? 1 : 0.45, pointerEvents: wsEnabled ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Provider selector */}
          <div>
            <label style={labelStyle}>Provider (Sonar model with web access)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['perplexity', 'openrouter'] as WebSearchProvider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const currentEnvKey = getEnvWebSearchApiKey(wsProvider)
                    const nextEnvKey = getEnvWebSearchApiKey(p)
                    setWsProvider(p)
                    if (!wsKey.trim() || wsKey === currentEnvKey) {
                      setWsKey(nextEnvKey)
                    }
                    setWsTestState('idle')
                  }}
                  style={{
                    ...providerBtnStyle,
                    background: wsProvider === p ? 'rgba(6,182,212,0.15)' : 'var(--bg-card)',
                    border: `1px solid ${wsProvider === p ? '#06B6D4' : 'var(--border)'}`,
                    color: wsProvider === p ? '#06B6D4' : 'var(--t2)',
                    fontWeight: wsProvider === p ? 700 : 400,
                  }}
                >
                  {p === 'perplexity' ? '🟣 Perplexity (direct)' : '🔀 OpenRouter → Sonar'}
                </button>
              ))}
            </div>
            <p style={{ ...hintStyle, marginTop: '6px' }}>
              {wsProvider === 'perplexity'
                ? <>Key format: <code>pplx-…</code> — <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noreferrer" style={{ color: '#06B6D4' }}>perplexity.ai/settings/api ↗</a></>
                : <>Same OpenRouter key as above, or a separate one. Routes to <code>perplexity/sonar-*</code> models.</>
              }
            </p>
            <p style={hintStyle}>
              With <code>VITE_WEB_SEARCH_PROVIDER=openrouter</code>, web search can reuse <code>VITE_OPENROUTER_API_KEY</code> automatically.
            </p>
          </div>

          {/* API Key (only for Perplexity direct or separate OR key) */}
          <div>
            <label style={labelStyle}>
              {wsProvider === 'perplexity' ? 'Perplexity API Key' : 'OpenRouter API Key (can reuse LLM key)'}
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type={showWsKey ? 'text' : 'password'}
                value={wsKey}
                onChange={(e) => { setWsKey(e.target.value); setWsTestState('idle') }}
                placeholder={wsProvider === 'perplexity' ? 'pplx-…' : 'sk-or-…'}
                aria-label="Web search API key"
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowWsKey((v) => !v)} style={iconBtnStyle} aria-label={showWsKey ? 'Hide key' : 'Show key'}>
                {showWsKey ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Sonar model selector */}
          <div>
            <label style={labelStyle}>Sonar Model</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {SONAR_MODELS.map(({ id, label }) => (
                <label
                  key={id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
                    padding: '8px 10px', borderRadius: '6px',
                    background: wsModel === id ? 'rgba(6,182,212,0.08)' : 'transparent',
                    border: `1px solid ${wsModel === id ? 'rgba(6,182,212,0.3)' : 'transparent'}`,
                  }}
                >
                  <input
                    type="radio"
                    name="sonar-model"
                    value={id}
                    checked={wsModel === id}
                    onChange={() => setWsModel(id as SonarModelId)}
                    style={{ marginTop: '2px', accentColor: '#06B6D4' }}
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: wsModel === id ? '#06B6D4' : 'var(--t1)', fontFamily: 'var(--ff-mono)' }}>{id}</div>
                    <div style={{ fontSize: '11px', color: 'var(--t4)', marginTop: '1px' }}>{label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Web search test error */}
          {wsTestState === 'error' && (
            <div style={errorBoxStyle}>{wsTestError}</div>
          )}

          {/* Test button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { void handleWsTest() }} disabled={wsTestState === 'testing' || !wsKey} style={testBtnStyle(wsTestState)}>
              {testLabel(wsTestState)}
            </button>
          </div>
        </div>
      </div>

        </>}

        {/* ═══════════════════════════════ TOOLS TAB ══════════════════════════════ */}
      {activeTab === 'tools' && <>

      {/* SECTION A — Tool Sources */}
      <div style={sectionBoxStyle}>
        <div style={sectionTitleStyle}>🔌 Tool Sources</div>

        {/* Sonar card */}
        <div style={{ background: 'var(--bg-input)', border: `1px solid ${wsEnabled ? 'rgba(6,182,212,0.3)' : 'var(--border)'}`, borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '16px' }}>🔍</span>
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--t1)' }}>Sonar · Web Search</span>
            <span style={{
              marginLeft: 'auto', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', textTransform: 'uppercase',
              background: wsEnabled ? 'rgba(6,182,212,0.12)' : 'var(--bg-card)',
              color: wsEnabled ? '#06B6D4' : 'var(--t4)',
              border: `1px solid ${wsEnabled ? 'rgba(6,182,212,0.3)' : 'var(--border)'}`,
            }}>
              {wsEnabled ? 'enabled' : 'disabled'}
            </span>
          </div>
          {wsEnabled ? (
            <p style={{ ...hintStyle, margin: 0 }}>
              {wsProvider === 'perplexity' ? '🟣 Perplexity direct' : '🔀 via OpenRouter'} · Model: <code style={{ fontFamily: 'var(--ff-mono)' }}>{wsModel}</code> · Built-in tool token: <code style={{ fontFamily: 'var(--ff-mono)', color: '#C4B5FD' }}>WebSearch</code>
            </p>
          ) : (
            <p style={{ ...hintStyle, margin: 0 }}>
              Configure in <button type="button" onClick={() => setActiveTab('llm')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', fontSize: '11px', padding: 0, textDecoration: 'underline' }}>LLM Settings → Web Search Tool</button>
            </p>
          )}
        </div>

        {/* Docker Desktop MCP card */}
        <div style={{ background: 'var(--bg-input)', border: `1px solid ${mcp.status === 'connected' ? 'rgba(52,211,153,0.3)' : mcp.status === 'error' ? 'rgba(248,113,113,0.25)' : 'var(--border)'}`, borderRadius: '8px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '16px' }}>🐳</span>
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--t1)' }}>Docker Desktop · MCP Gateway</span>
            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '11px', color: mcpEnabled ? '#34D399' : 'var(--t4)' }}>
              <input type="checkbox" checked={mcpEnabled} onChange={(e) => setMcpEnabled(e.target.checked)} style={{ width: '13px', height: '13px', cursor: 'pointer' }} />
              {mcpEnabled ? 'Enabled' : 'Disabled'}
            </label>
          </div>
          <p style={{ ...hintStyle, marginBottom: '10px' }}>
            Run: <code style={{ userSelect: 'all', fontSize: '10px' }}>docker mcp gateway run --port 8808 --transport streaming</code>
          </p>
          <div style={{ opacity: mcpEnabled ? 1 : 0.5, pointerEvents: mcpEnabled ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="url" value={mcpUrl} onChange={(e) => setMcpUrl(e.target.value)} placeholder="http://localhost:8808/mcp" aria-label="MCP Gateway URL" style={{ ...inputStyle, fontSize: '12px', flex: 1 }} />
              <input type={showMcpToken ? 'text' : 'password'} value={mcpToken} onChange={(e) => setMcpToken(e.target.value)} placeholder="Bearer token (optional)" aria-label="MCP Bearer Token" style={{ ...inputStyle, fontSize: '12px', flex: 1 }} />
              <button type="button" onClick={() => setShowMcpToken((v) => !v)} style={iconBtnStyle} aria-label={showMcpToken ? 'Hide token' : 'Show token'}>{showMcpToken ? '🙈' : '👁'}</button>
            </div>

            {/* Status row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', background: mcp.status === 'connected' ? 'rgba(52,211,153,0.08)' : mcp.status === 'error' ? 'rgba(248,113,113,0.08)' : 'var(--bg-card)', border: `1px solid ${mcp.status === 'connected' ? 'rgba(52,211,153,0.2)' : mcp.status === 'error' ? 'rgba(248,113,113,0.2)' : 'var(--border)'}` }}>
              <span style={{ fontSize: '12px', color: mcp.status === 'connected' ? '#34D399' : mcp.status === 'error' ? '#F87171' : 'var(--t3)' }}>
                {mcp.status === 'connected' && `✓ ${mcp.tools.length} tool${mcp.tools.length !== 1 ? 's' : ''} available`}
                {mcp.status === 'connecting' && '⏳ Connecting…'}
                {mcp.status === 'error' && `✗ ${mcp.errorMsg ?? 'Connection failed'}`}
                {mcp.status === 'disconnected' && '○ Not connected'}
              </span>
              {mcp.status === 'connected' && (
                <button type="button" onClick={() => { void mcp.refreshTools() }} style={{ ...smallBtnStyle, marginLeft: 'auto', color: 'var(--t2)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>↺ Refresh</button>
              )}
            </div>

            {/* Tool grid (if connected) */}
            {mcp.status === 'connected' && mcp.tools.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '90px', overflowY: 'auto' }}>
                {mcp.tools.map((t) => (
                  <span key={t.name} title={t.description} style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '11px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399', fontFamily: 'var(--ff-mono)' }}>{t.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
          title="Removes API keys and model settings saved in this browser"
      {/* SECTION B — Tool Groups */}
      <div style={sectionBoxStyle}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
          <div style={sectionTitleStyle}>📦 Tool Groups</div>
          <span style={{ fontSize: '11px', color: 'var(--t4)', marginBottom: '14px' }}>{mcpToolGroupsDraft.length} group{mcpToolGroupsDraft.length !== 1 ? 's' : ''}</span>
        </div>
        <p style={{ ...hintStyle, marginBottom: '12px' }}>
          Add a group name to an agent's tool list → all tools in that group are injected at runtime. Groups work across both built-in tools and live MCP tools.
        </p>
        {/* Quick-start chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--t4)', alignSelf: 'center', marginRight: '2px' }}>Quick-start:</span>
          {QUICK_START_GROUPS.map((qg) => {
            const exists = mcpToolGroupsDraft.some((g) => g.name === qg.name)
            return (
              <button
                key={qg.name}
                type="button"
                disabled={exists}
                onClick={() => addGroup(qg.name, qg.toolNames)}
                title={qg.hint}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '3px 10px', borderRadius: '12px', fontSize: '11px', cursor: exists ? 'default' : 'pointer', fontFamily: 'var(--ff-mono)',
                  background: exists ? 'var(--bg-card)' : 'rgba(167,139,250,0.1)',
                  border: `1px solid ${exists ? 'var(--border)' : 'rgba(167,139,250,0.35)'}`,
                  color: exists ? 'var(--t4)' : '#C4B5FD',
                  opacity: exists ? 0.6 : 1,
                }}
              >
                {qg.icon} {qg.name} {exists ? '✓' : '+'}
              </button>
            )
          })}
        </div>
        {/* Group cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          {mcpToolGroupsDraft.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--t4)', textAlign: 'center', padding: '16px 0' }}>
              No groups yet — use quick-start above or create one below.
            </p>
          )}
          {mcpToolGroupsDraft.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              mcpTools={mcp.tools}
              onUpdate={updateGroup}
              onRemove={removeGroup}
            />
          ))}
        </div>
        {/* New group form */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { addGroup(newGroupName, []); setNewGroupName('') } }}
            placeholder="new group name…"
            style={{ ...inputStyle, fontSize: '12px', flex: 1 }}
          />
          <button
            type="button"
            onClick={() => { addGroup(newGroupName, []); setNewGroupName('') }}
            disabled={!newGroupName.trim()}
            style={{ ...smallBtnStyle, color: '#34D399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', opacity: newGroupName.trim() ? 1 : 0.5, cursor: newGroupName.trim() ? 'pointer' : 'default' }}
          >
            + Create
          </button>
        </div>
      </div>
      </>}

      <div style={{ flex: 1 }} />
      </div>{/* end scrollable body */}

      {/* ── Footer actions ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button type="button" onClick={closeModal} style={{ ...btnStyle, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--t2)', cursor: 'pointer' }}>
          Cancel
        </button>
        <button
          type="button"
          onClick={handleClearData}
          title="Removes API keys and model settings saved in this browser"
          style={{ ...btnStyle, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', cursor: 'pointer' }}
        >
          🗑 Clear saved data
        </button>
        <button type="button" onClick={handleSave} style={{ ...btnStyle, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Save
        </button>
      </div>
    </div>
  )
}

export const LLMSettingsModal: React.FC = () => (
  <ModalBase modalId={MODAL_ID} title="⚙ Settings" width={620}>
    <LLMSettingsContent />
  </ModalBase>
)

// ─── Shared styles ────────────────────────────────────────────────────────────

const sectionBoxStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '16px',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--t3)',
  marginBottom: '14px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--t3)',
  marginBottom: '5px',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-input, rgba(255,255,255,0.05))',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--t1)',
  fontSize: '13px',
  padding: '7px 10px',
  fontFamily: 'var(--ff-mono)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const hintStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--t4)',
  margin: '4px 0 0',
}

const iconBtnStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  cursor: 'pointer',
  padding: '6px 10px',
  fontSize: '14px',
  flexShrink: 0,
}

const btnStyle: React.CSSProperties = {
  padding: '7px 16px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 600,
}

const providerBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '6px',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'background 0.15s, border-color 0.15s',
}

const errorBoxStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '6px',
  background: 'rgba(248,113,113,0.1)',
  border: '1px solid rgba(248,113,113,0.3)',
  color: '#F87171',
  fontSize: '12px',
}

const smallBtnStyle: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: '5px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  flexShrink: 0,
}

