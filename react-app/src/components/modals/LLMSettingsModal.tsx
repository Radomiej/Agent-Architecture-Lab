import React, { useState } from 'react'
import { useUiStore } from '../../store/uiStore'
import { useLLMStore } from '../../store/llmStore'
import { testConnection } from '../../services/llmService'
import type { ModelType } from '../../types'
import { ModalBase } from './ModalBase'

const MODEL_TIERS: ModelType[] = ['opus', 'sonnet', 'haiku']
const TIER_LABELS: Record<ModelType, string> = {
  opus: 'Opus (complex reasoning)',
  sonnet: 'Sonnet (balanced)',
  haiku: 'Haiku (fast / cheap)',
}

const MODAL_ID = 'settings'

const LLMSettingsContent: React.FC = () => {
  const { closeModal } = useUiStore()
  const llm = useLLMStore()

  const [apiKeyDraft, setApiKeyDraft] = useState(llm.apiKey)
  const [baseUrlDraft, setBaseUrlDraft] = useState(llm.baseUrl)
  const [modelMapDraft, setModelMapDraft] = useState({ ...llm.modelMap })
  const [debugDraft, setDebugDraft] = useState(llm.debugMode)
  const [showKey, setShowKey] = useState(false)
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [testError, setTestError] = useState('')

  const handleSave = () => {
    llm.setConfig({
      apiKey: apiKeyDraft,
      baseUrl: baseUrlDraft,
      modelMap: modelMapDraft,
      debugMode: debugDraft,
    })
    closeModal()
  }

  const handleTest = async () => {
    setTestState('testing')
    setTestError('')
    const result = await testConnection(apiKeyDraft, baseUrlDraft)
    if (result.ok) {
      setTestState('ok')
    } else {
      setTestState('error')
      setTestError(result.error ?? 'Unknown error')
    }
  }

  const testLabel = testState === 'testing' ? '⏳ Testing…'
    : testState === 'ok' ? '✓ Connected'
    : testState === 'error' ? '✗ Failed'
    : 'Test Connection'

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* API Key */}
      <section>
        <label style={labelStyle}>API Key</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKeyDraft}
            onChange={(e) => { setApiKeyDraft(e.target.value); setTestState('idle') }}
            placeholder="sk-…"
            aria-label="CometAPI key"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            style={iconBtnStyle}
            aria-label={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? '🙈' : '👁'}
          </button>
        </div>
        <p style={hintStyle}>
          Your key is stored only in browser localStorage — never sent anywhere except CometAPI.
        </p>
      </section>

      {/* Base URL */}
      <section>
        <label style={labelStyle}>Base URL</label>
        <input
          type="url"
          value={baseUrlDraft}
          onChange={(e) => { setBaseUrlDraft(e.target.value); setTestState('idle') }}
          aria-label="CometAPI base URL"
          style={inputStyle}
        />
      </section>

      {/* Model Map */}
      <section>
        <label style={labelStyle}>Model IDs per tier</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MODEL_TIERS.map((tier) => (
            <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '200px', fontSize: '12px', color: 'var(--t2)', flexShrink: 0 }}>
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
          ))}
        </div>
      </section>

      {/* Debug Mode */}
      <section>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={debugDraft}
            onChange={(e) => setDebugDraft(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span>Debug Mode — show LLM call logs panel</span>
        </label>
        <p style={hintStyle}>
          When enabled, right-clicking any canvas agent and selecting &quot;Run with LLM&quot; will call the real API and show logs.
        </p>
      </section>

      {/* Test connection result */}
      {testState === 'error' && (
        <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', fontSize: '13px' }}>
          {testError}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => { void handleTest() }}
          disabled={testState === 'testing' || !apiKeyDraft}
          style={{
            ...btnStyle,
            background: testState === 'ok' ? 'rgba(52,211,153,0.15)' : testState === 'error' ? 'rgba(248,113,113,0.15)' : 'var(--bg-card)',
            color: testState === 'ok' ? '#34D399' : testState === 'error' ? '#F87171' : 'var(--t2)',
            border: `1px solid ${testState === 'ok' ? 'rgba(52,211,153,0.3)' : testState === 'error' ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
            cursor: testState === 'testing' || !apiKeyDraft ? 'not-allowed' : 'pointer',
          }}
        >
          {testLabel}
        </button>
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
  <ModalBase modalId={MODAL_ID} title="⚙ LLM Settings — CometAPI" width={560}>
    <LLMSettingsContent />
  </ModalBase>
)

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--t3)',
  marginBottom: '6px',
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
  marginTop: '4px',
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
