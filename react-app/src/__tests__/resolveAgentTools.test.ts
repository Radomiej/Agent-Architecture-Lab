import { describe, it, expect } from 'vitest'
import { getAgentToolTokens, resolveAgentTools } from '../utils/resolveAgentTools'
import type { McpToolGroup } from '../types'

// ─── fixtures ─────────────────────────────────────────────────────────────────

const GROUPS: McpToolGroup[] = [
  { id: 'grp-1', name: 'webtool',  toolNames: ['docker_pull', 'docker_search', 'browser_fetch'] },
  { id: 'grp-2', name: 'devtools', toolNames: ['bash_exec', 'file_read', 'file_write'] },
  { id: 'grp-3', name: 'empty',    toolNames: [] },
]

const NO_OVERRIDES: Record<string, string[]> = {}

// ─── getAgentToolTokens ───────────────────────────────────────────────────────

describe('getAgentToolTokens', () => {
  it('parses comma-separated base tools when no override exists', () => {
    const result = getAgentToolTokens('orchestrator', 'Read, Write, Bash', NO_OVERRIDES)
    expect(result).toEqual(['Read', 'Write', 'Bash'])
  })

  it('trims whitespace from each token', () => {
    const result = getAgentToolTokens('orchestrator', '  Read ,  Write  ,Bash ', NO_OVERRIDES)
    expect(result).toEqual(['Read', 'Write', 'Bash'])
  })

  it('deduplicates base tools', () => {
    const result = getAgentToolTokens('orchestrator', 'Read, Read, Write', NO_OVERRIDES)
    expect(result).toEqual(['Read', 'Write'])
  })

  it('returns override list when override exists for agent', () => {
    const overrides = { orchestrator: ['AgentTool', 'Bash'] }
    const result = getAgentToolTokens('orchestrator', 'Read, Write', overrides)
    expect(result).toEqual(['AgentTool', 'Bash'])
  })

  it('override does not affect other agents', () => {
    const overrides = { orchestrator: ['AgentTool'] }
    const result = getAgentToolTokens('backend', 'Read, Write', overrides)
    expect(result).toEqual(['Read', 'Write'])
  })

  it('returns empty array for empty base tools string', () => {
    const result = getAgentToolTokens('orchestrator', '', NO_OVERRIDES)
    expect(result).toEqual([])
  })

  it('handles override with empty array', () => {
    const overrides = { orchestrator: [] }
    const result = getAgentToolTokens('orchestrator', 'Read, Write', overrides)
    expect(result).toEqual([])
  })

  it('deduplicates override tools', () => {
    const overrides = { orchestrator: ['Read', '  Read  ', 'Write'] }
    const result = getAgentToolTokens('orchestrator', 'Bash', overrides)
    expect(result).toEqual(['Read', 'Write'])
  })
})

// ─── resolveAgentTools ────────────────────────────────────────────────────────

describe('resolveAgentTools', () => {
  it('passes through plain tools that do not match any group', () => {
    const result = resolveAgentTools('orchestrator', 'Read, Write, Bash', NO_OVERRIDES, GROUPS)
    expect(result).toEqual(['Read', 'Write', 'Bash'])
  })

  it('expands a group token to its MCP tool names', () => {
    const result = resolveAgentTools('orchestrator', 'webtool', NO_OVERRIDES, GROUPS)
    expect(result).toEqual(['docker_pull', 'docker_search', 'browser_fetch'])
  })

  it('expands multiple group tokens in one call', () => {
    const result = resolveAgentTools('orchestrator', 'webtool, devtools', NO_OVERRIDES, GROUPS)
    expect(result).toEqual(['docker_pull', 'docker_search', 'browser_fetch', 'bash_exec', 'file_read', 'file_write'])
  })

  it('mixes plain tools and group tokens', () => {
    const result = resolveAgentTools('orchestrator', 'Read, webtool, Write', NO_OVERRIDES, GROUPS)
    expect(result).toContain('Read')
    expect(result).toContain('Write')
    expect(result).toContain('docker_pull')
    expect(result).toContain('docker_search')
    expect(result).toContain('browser_fetch')
    expect(result).not.toContain('webtool')
  })

  it('passes through group token that has no matching group name (unknown token)', () => {
    const result = resolveAgentTools('orchestrator', 'Read, unknowntool', NO_OVERRIDES, GROUPS)
    expect(result).toEqual(['Read', 'unknowntool'])
  })

  it('does NOT expand group token when group toolNames is empty', () => {
    const result = resolveAgentTools('orchestrator', 'Read, empty', NO_OVERRIDES, GROUPS)
    // empty group has no toolNames so the 'empty' token passes through
    expect(result).toEqual(['Read', 'empty'])
  })

  it('expands group token from overrided tools list', () => {
    const overrides = { orchestrator: ['webtool', 'Read'] }
    const result = resolveAgentTools('orchestrator', 'Bash', overrides, GROUPS)
    expect(result).toContain('docker_pull')
    expect(result).toContain('docker_search')
    expect(result).toContain('browser_fetch')
    expect(result).toContain('Read')
    expect(result).not.toContain('Bash')
  })

  it('deduplicates when group tools overlap with plain tools', () => {
    const groups: McpToolGroup[] = [
      { id: 'g1', name: 'readgroup', toolNames: ['Read', 'Write'] },
    ]
    const result = resolveAgentTools('orchestrator', 'Read, readgroup', NO_OVERRIDES, groups)
    expect(result).toEqual(['Read', 'Write'])
  })

  it('returns empty array when no tools at all', () => {
    const result = resolveAgentTools('orchestrator', '', NO_OVERRIDES, GROUPS)
    expect(result).toEqual([])
  })

  it('handles groups array being empty — all tokens pass through', () => {
    const result = resolveAgentTools('orchestrator', 'Read, Write', NO_OVERRIDES, [])
    expect(result).toEqual(['Read', 'Write'])
  })
})
