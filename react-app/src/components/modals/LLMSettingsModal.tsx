import React, { useState } from 'react'
import { useUiStore } from '../../store/uiStore'
import { useLLMStore } from '../../store/llmStore'
import { useMcpStore } from '../../store/mcpStore'
import { testConnection, testWebSearchConnection, COMETAPI_BASE_URL, OPENROUTER_BASE_URL, DEFAULT_MODEL_MAP, OPENROUTER_DEFAULT_MODEL_MAP } from '../../services/llmService'
import type { ModelType, LLMProvider, WebSearchProvider, SonarModelId } from '../../types'
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

const LLMSettingsContent: React.FC = () => {
  const { closeModal } = useUiStore()
  const llm = useLLMStore()
  const mcp = useMcpStore()

  // ── MCP Gateway state ───────────────────────────────────────────────────────
  const [mcpUrl, setMcpUrl] = useState(mcp.config.gatewayUrl)
  const [mcpToken, setMcpToken] = useState(mcp.config.bearerToken)
  const [mcpEnabled, setMcpEnabled] = useState(mcp.config.enabled)
  const [showMcpToken, setShowMcpToken] = useState(false)

  // ── LLM Provider state ──────────────────────────────────────────────────────
  const [provider, setProviderDraft] = useState<LLMProvider>(llm.provider)
  const [apiKeyDraft, setApiKeyDraft] = useState(llm.apiKey)
  const [baseUrlDraft, setBaseUrlDraft] = useState(llm.baseUrl)
  const [modelMapDraft, setModelMapDraft] = useState({ ...llm.modelMap })
  const [debugDraft, setDebugDraft] = useState(llm.debugMode)
  const [showKey, setShowKey] = useState(false)
  const [testState, setTestState] = useState<TestState>('idle')
  const [testError, setTestError] = useState('')

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
    const currentEnvKey = getEnvApiKey(provider)
    const nextEnvKey = getEnvApiKey(p)

    setProviderDraft(p)
    setBaseUrlDraft(p === 'openrouter' ? OPENROUTER_BASE_URL : COMETAPI_BASE_URL)
    if (!apiKeyDraft.trim() || apiKeyDraft === currentEnvKey) {
      setApiKeyDraft(nextEnvKey)
    }
    // Reset model map to provider defaults (user can still override)
    setModelMapDraft(
      p === 'openrouter'
        ? { opus: 'anthropic/claude-opus-4-5', sonnet: 'anthropic/claude-sonnet-4-5', haiku: 'anthropic/claude-haiku-4-5' }
        : { opus: 'claude-opus-4-5', sonnet: 'claude-sonnet-4-5', haiku: 'claude-haiku-4-5' }
    )
    setTestState('idle')
  }

  const handleSave = () => {
    llm.setConfig({ provider, apiKey: apiKeyDraft, baseUrl: baseUrlDraft, modelMap: modelMapDraft, debugMode: debugDraft })
    llm.setWebSearch({ enabled: wsEnabled, provider: wsProvider, apiKey: wsKey, model: wsModel })
    // Save MCP config; (dis)connect based on enabled toggle
    mcp.setConfig({ gatewayUrl: mcpUrl, bearerToken: mcpToken, enabled: mcpEnabled })
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
    const freshBaseUrl = freshProvider === 'openrouter' ? OPENROUTER_BASE_URL : COMETAPI_BASE_URL
    const freshModelMap = freshProvider === 'openrouter' ? { ...OPENROUTER_DEFAULT_MODEL_MAP } : { ...DEFAULT_MODEL_MAP }
    const freshWS = getEnvWebSearchConfig()
    setProviderDraft(freshProvider)
    setApiKeyDraft(getEnvApiKey(freshProvider))
    setBaseUrlDraft(freshBaseUrl)
    setModelMapDraft(freshModelMap)
    setDebugDraft(false)
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
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1 — LLM Provider
          ═══════════════════════════════════════════════════════════════════════ */}
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
            onChange={(e) => { setApiKeyDraft(e.target.value); setTestState('idle') }}
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
          onChange={(e) => { setBaseUrlDraft(e.target.value); setTestState('idle') }}
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
                  onChange={(e) => setModelMapDraft((m) => ({ ...m, [tier]: e.target.value }))}
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
                    onClick={() => setModelMapDraft((m) => ({ ...m, [tier]: preset }))}
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

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2 — Web Search Tool
          ═══════════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3 — MCP Gateway (Docker Desktop)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div style={sectionBoxStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={sectionTitleStyle}>🐳 MCP Gateway — Docker Desktop tools</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: mcpEnabled ? '#34D399' : 'var(--t4)' }}>
            <input
              type="checkbox"
              checked={mcpEnabled}
              onChange={(e) => setMcpEnabled(e.target.checked)}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }}
            />
            {mcpEnabled ? 'Enabled' : 'Disabled'}
          </label>
        </div>

        <div style={{ opacity: mcpEnabled ? 1 : 0.45, pointerEvents: mcpEnabled ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={hintStyle}>
            Start the gateway with:{' '}
            <code style={{ userSelect: 'all' }}>docker mcp gateway run --port 8808 --transport streaming</code>
            {' '}and paste the URL + Bearer token shown in the output.
          </p>

          {/* Gateway URL */}
          <div>
            <label style={labelStyle}>Gateway URL</label>
            <input
              type="url"
              value={mcpUrl}
              onChange={(e) => setMcpUrl(e.target.value)}
              placeholder="http://localhost:8808/mcp"
              aria-label="MCP Gateway URL"
              style={inputStyle}
            />
          </div>

          {/* Bearer Token */}
          <div>
            <label style={labelStyle}>Bearer Token</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type={showMcpToken ? 'text' : 'password'}
                value={mcpToken}
                onChange={(e) => setMcpToken(e.target.value)}
                placeholder="h0eagz… (leave empty if not required)"
                aria-label="MCP Bearer Token"
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowMcpToken((v) => !v)} style={iconBtnStyle} aria-label={showMcpToken ? 'Hide token' : 'Show token'}>
                {showMcpToken ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Current status + tool count */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 12px', borderRadius: '6px',
            background: mcp.status === 'connected'
              ? 'rgba(52,211,153,0.08)'
              : mcp.status === 'error'
              ? 'rgba(248,113,113,0.08)'
              : 'var(--bg-input)',
            border: `1px solid ${mcp.status === 'connected' ? 'rgba(52,211,153,0.25)' : mcp.status === 'error' ? 'rgba(248,113,113,0.25)' : 'var(--border)'}`,
          }}>
            <span style={{ fontSize: '12px', color: mcp.status === 'connected' ? '#34D399' : mcp.status === 'error' ? '#F87171' : 'var(--t3)' }}>
              {mcp.status === 'connected' && `✓ Connected — ${mcp.tools.length} tool${mcp.tools.length !== 1 ? 's' : ''} available`}
              {mcp.status === 'connecting' && '⏳ Connecting…'}
              {mcp.status === 'error' && `✗ ${mcp.errorMsg ?? 'Connection failed'}`}
              {mcp.status === 'disconnected' && '○ Disconnected'}
            </span>
            {mcp.status === 'connected' && (
              <button
                type="button"
                onClick={() => { void mcp.refreshTools() }}
                style={{ ...btnStyle, padding: '3px 10px', fontSize: '11px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--t2)', cursor: 'pointer', marginLeft: 'auto' }}
              >
                ↺ Refresh
              </button>
            )}
          </div>

          {/* Tool list (collapsed) */}
          {mcp.status === 'connected' && mcp.tools.length > 0 && (
            <details style={{ fontSize: '11px', color: 'var(--t3)' }}>
              <summary style={{ cursor: 'pointer', userSelect: 'none', color: 'var(--t2)', marginBottom: '6px' }}>
                Available tools ({mcp.tools.length})
              </summary>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
                {mcp.tools.map((t) => (
                  <span
                    key={t.name}
                    title={t.description}
                    style={{
                      padding: '2px 7px', borderRadius: '4px', fontSize: '11px',
                      background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
                      color: '#34D399', fontFamily: 'var(--ff-mono)',
                    }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* ── Global actions ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleClearData}
          title="Removes API keys and model settings saved in this browser"
          style={{ ...btnStyle, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', cursor: 'pointer' }}
        >
          🗑 Clear saved data
        </button>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={closeModal} style={{ ...btnStyle, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--t2)', cursor: 'pointer' }}>
          Cancel
        </button>
        <button type="button" onClick={handleSave} style={{ ...btnStyle, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Save
        </button>
      </div>
    </div>
  )
}

export const LLMSettingsModal: React.FC = () => (
  <ModalBase modalId={MODAL_ID} title="⚙ LLM Settings" width={600}>
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

