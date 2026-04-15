import type { Agent, CanvasNode, Connection, ToolCall, ToolType } from '../types'
import { useVfsStore } from '../store/vfsStore'
import { useMcpStore } from '../store/mcpStore'
import { simulateBash } from './bashSimulator'
import { resolveAgentTools } from './resolveAgentTools'

type VfsApi = ReturnType<typeof useVfsStore.getState>

/** Generate a unique tool call ID. */
let _seq = 0
function tcId(agentId: string, tool: string): string {
  return `${agentId}-${tool}-${++_seq}`
}

/**
 * Simulates tool calls for a given agent based on its declared tools and phase.
 * Operates on the VFS store and returns an array of ToolCall records.
 */
export function simulateToolCalls(
  agent: Agent,
  node: CanvasNode,
  allNodes: CanvasNode[],
  connections: Connection[],
  agentMap: Map<string, Agent>,
  vfs: VfsApi,
): ToolCall[] {
  const { agentToolOverrides, toolGroups } = useMcpStore.getState()
  const tools = resolveAgentTools(agent.id, agent.tools, agentToolOverrides, toolGroups)
  const calls: ToolCall[] = []

  // Determine upstream agents for context
  const upstreamIds = connections.filter(c => c.to === node.id).map(c => c.from)
  const upstreamAgents = upstreamIds
    .map(id => {
      const n = allNodes.find(nd => nd.id === id)
      return n ? agentMap.get(n.agentId) : undefined
    })
    .filter((a): a is Agent => !!a)

  // Determine downstream for agent delegation
  const downstreamIds = connections.filter(c => c.from === node.id).map(c => c.to)
  const downstreamAgents = downstreamIds
    .map(id => {
      const n = allNodes.find(nd => nd.id === id)
      return n ? agentMap.get(n.agentId) : undefined
    })
    .filter((a): a is Agent => !!a)

  for (const tool of tools) {
    if (tool === 'Read/Write' || tool === 'Read' || tool === 'Write') {
      calls.push(...simulateReadWrite(agent, upstreamAgents, vfs))
    } else if (tool === 'Bash') {
      calls.push(...simulateBashTool(agent, vfs))
    } else if (tool === 'WebSearch') {
      calls.push(...simulateWebSearch(agent))
    } else if (tool === 'Agent') {
      calls.push(...simulateAgentTool(agent, downstreamAgents))
    } else if (tool === 'TaskCreate') {
      calls.push(...simulateTaskCreate(agent, vfs))
    }
  }

  return calls
}

// ─── Read/Write Simulation ─────────────────────────────────────────────────────

function simulateReadWrite(agent: Agent, upstream: Agent[], vfs: VfsApi): ToolCall[] {
  const calls: ToolCall[] = []
  const ts = Date.now()

  // Strategy agents: read config, write plan
  if (agent.phase === 'strategy') {
    calls.push({
      id: tcId(agent.id, 'Read'), agentId: agent.id, tool: 'Read',
      args: { path: '/README.md' },
      result: vfs.readFile('/README.md') ?? '(empty)',
      timestamp: ts, status: 'ok',
    })
    const planContent = `# ${agent.name} — Plan\n\n## Analysis\nBased on project structure and ${upstream.length} upstream inputs.\n\n## Recommendations\n1. Decompose into ${2 + upstream.length} work streams\n2. Prioritize critical path\n3. Assign parallel tracks where possible\n`
    vfs.writeFile(`/output/${agent.id}_plan.md`, planContent, agent.id)
    calls.push({
      id: tcId(agent.id, 'Write'), agentId: agent.id, tool: 'Write',
      args: { path: `/output/${agent.id}_plan.md` },
      result: `Wrote ${planContent.length} chars`,
      timestamp: ts + 1, status: 'ok',
    })
  }

  // Research agents: read sources, write findings
  if (agent.phase === 'research') {
    calls.push({
      id: tcId(agent.id, 'Read'), agentId: agent.id, tool: 'Read',
      args: { path: '/package.json' },
      result: vfs.readFile('/package.json') ?? '(not found)',
      timestamp: ts, status: 'ok',
    })
    const findings = `# ${agent.name} — Findings\n\n## Sources Analyzed\n- Official documentation\n- Community discussions\n- Benchmark data\n\n## Key Findings\n1. Current approach is viable for scale\n2. Consider caching strategy for hot paths\n3. Monitor memory usage under load\n\n## Confidence: [PROBABLE]\n`
    vfs.writeFile(`/output/${agent.id}_findings.md`, findings, agent.id)
    calls.push({
      id: tcId(agent.id, 'Write'), agentId: agent.id, tool: 'Write',
      args: { path: `/output/${agent.id}_findings.md` },
      result: `Wrote ${findings.length} chars`,
      timestamp: ts + 1, status: 'ok',
    })
  }

  // Build agents: read source, write implementation
  if (agent.phase === 'build') {
    const srcFiles = vfs.glob('/src/**/*.ts')
    if (srcFiles.length > 0) {
      const target = srcFiles[0]
      calls.push({
        id: tcId(agent.id, 'Read'), agentId: agent.id, tool: 'Read',
        args: { path: target },
        result: (vfs.readFile(target) ?? '').slice(0, 200),
        timestamp: ts, status: 'ok',
      })
    }

    const impl = generateBuildContent(agent)
    const outPath = `/src/${agent.id}_output.ts`
    vfs.writeFile(outPath, impl, agent.id)
    calls.push({
      id: tcId(agent.id, 'Write'), agentId: agent.id, tool: 'Write',
      args: { path: outPath },
      result: `Wrote ${impl.length} chars`,
      timestamp: ts + 1, status: 'ok',
    })
  }

  // QA agents: read implementation, write report
  if (agent.phase === 'qa') {
    const implFiles = vfs.glob('/src/**/*.ts')
    for (const f of implFiles.slice(0, 3)) {
      calls.push({
        id: tcId(agent.id, 'Read'), agentId: agent.id, tool: 'Read',
        args: { path: f },
        result: `Read ${(vfs.readFile(f) ?? '').split('\n').length} lines`,
        timestamp: ts, status: 'ok',
      })
    }
    const report = generateQaReport(agent, implFiles.length)
    vfs.writeFile(`/output/${agent.id}_report.md`, report, agent.id)
    calls.push({
      id: tcId(agent.id, 'Write'), agentId: agent.id, tool: 'Write',
      args: { path: `/output/${agent.id}_report.md` },
      result: `Wrote ${report.length} chars`,
      timestamp: ts + 1, status: 'ok',
    })
  }

  // Debate agents: read upstream, write position
  if (agent.phase === 'debate1' || agent.phase === 'debate2') {
    const outputFiles = vfs.glob('/output/**/*.md')
    if (outputFiles.length > 0) {
      calls.push({
        id: tcId(agent.id, 'Read'), agentId: agent.id, tool: 'Read',
        args: { path: outputFiles[0] },
        result: `Read ${(vfs.readFile(outputFiles[0]) ?? '').split('\n').length} lines`,
        timestamp: ts, status: 'ok',
      })
    }
    const position = `# ${agent.name} — Position\n\n## My Assessment\nAfter reviewing ${outputFiles.length} upstream documents and considering ${upstream.length} perspectives.\n\n## Verdict\nThe proposed approach has merit but needs refinement in error handling and edge cases.\n\n## Risk Rating: MEDIUM\n`
    vfs.writeFile(`/output/${agent.id}_position.md`, position, agent.id)
    calls.push({
      id: tcId(agent.id, 'Write'), agentId: agent.id, tool: 'Write',
      args: { path: `/output/${agent.id}_position.md` },
      result: `Wrote ${position.length} chars`,
      timestamp: ts + 1, status: 'ok',
    })
  }

  // HITL agents: write decision summary
  if (agent.phase === 'hitl') {
    const allOutputs = vfs.glob('/output/**/*.md')
    const summary = `# Decision Gate Summary\n\nReviewed ${allOutputs.length} documents from pipeline.\n\n## Options Presented\n- A: Proceed as planned\n- B: Revise with additional research\n- C: Pivot approach\n\n## Recommendation: Option A — proceed with monitoring\n`
    vfs.writeFile(`/output/${agent.id}_decision.md`, summary, agent.id)
    calls.push({
      id: tcId(agent.id, 'Write'), agentId: agent.id, tool: 'Write',
      args: { path: `/output/${agent.id}_decision.md` },
      result: `Wrote ${summary.length} chars`,
      timestamp: ts + 1, status: 'ok',
    })
  }

  return calls
}

// ─── Bash Simulation ───────────────────────────────────────────────────────────

function simulateBashTool(agent: Agent, vfs: VfsApi): ToolCall[] {
  const calls: ToolCall[] = []

  // Pick commands based on phase
  const commands = getBashCommands(agent)
  for (const cmd of commands) {
    calls.push(simulateBash(cmd, agent.id, vfs))
  }

  return calls
}

function getBashCommands(agent: Agent): string[] {
  switch (agent.phase) {
    case 'strategy':
      return ['ls /src', 'wc /src/index.ts', 'cat /package.json']
    case 'research':
      return ['find /src', 'grep "import" /src/app.ts']
    case 'build':
      return ['tsc', `mkdir -p /src/modules`, 'npm run build']
    case 'qa':
      return ['npm test', 'eslint', 'grep "TODO" /tasks/todo.md']
    case 'debate1':
    case 'debate2':
      return ['ls /output']
    case 'hitl':
      return ['git status']
    default:
      return ['ls /']
  }
}

// ─── WebSearch Simulation ──────────────────────────────────────────────────────

function simulateWebSearch(agent: Agent): ToolCall[] {
  const ts = Date.now()
  const queries = getSearchQueries(agent)
  return queries.map(q => ({
    id: tcId(agent.id, 'WebSearch'),
    agentId: agent.id,
    tool: 'WebSearch' as ToolType,
    args: { query: q },
    result: generateSearchResult(q, agent),
    timestamp: ts,
    status: 'ok' as const,
  }))
}

function getSearchQueries(agent: Agent): string[] {
  const base = agent.id
  if (base.startsWith('res_tech')) return ['best practices TypeScript 2026', 'React 19 performance patterns']
  if (base.startsWith('res_ux')) return ['UX design trends 2026', 'WCAG 2.2 compliance checklist']
  if (base.startsWith('res_reddit')) return ['site:reddit.com TypeScript best practices', 'site:reddit.com React performance']
  if (base.startsWith('res_x')) return ['TypeScript trends twitter 2026']
  if (base.startsWith('res_github')) return ['github stars trending TypeScript', 'popular React libraries 2026']
  if (base.startsWith('res_forums')) return ['StackOverflow TypeScript common pitfalls']
  if (base.startsWith('res_docs')) return ['TypeScript official documentation changes']
  return ['multi-agent architecture best practices']
}

function generateSearchResult(query: string, agent: Agent): string {
  return [
    `## Search: "${query}"`,
    '',
    `1. **${query.split(' ').slice(0, 3).join(' ')} Guide** — comprehensive overview with examples`,
    `   https://docs.example.com/${agent.id}/guide`,
    '',
    `2. **Community Discussion** — 47 upvotes, practical insights`,
    `   https://forum.example.com/t/${query.replace(/\s+/g, '-').toLowerCase()}`,
    '',
    `3. **Benchmark Report 2026** — performance comparisons and recommendations`,
    `   https://benchmark.example.com/${agent.id}`,
    '',
    `Key takeaway: Current consensus supports the proposed approach with caveats around scale.`,
  ].join('\n')
}

// ─── Agent Tool (Sub-Agent Delegation) ─────────────────────────────────────────

function simulateAgentTool(agent: Agent, downstream: Agent[]): ToolCall[] {
  const ts = Date.now()
  const calls: ToolCall[] = []

  if (downstream.length === 0) {
    // No downstream — agent tries to spawn but has no one to delegate to
    calls.push({
      id: tcId(agent.id, 'Agent'),
      agentId: agent.id,
      tool: 'Agent',
      args: { action: 'spawn', target: '(none available)' },
      result: 'No downstream agents available for delegation. Proceeding with self-contained execution.',
      timestamp: ts,
      status: 'ok',
    })
    return calls
  }

  // Delegate to first 2 downstream agents (or all if <=2)
  const targets = downstream.slice(0, 2)
  for (const target of targets) {
    // ~15% chance a sub-agent reports an error
    const hasError = Math.random() < 0.15
    if (hasError) {
      calls.push({
        id: tcId(agent.id, 'Agent'),
        agentId: agent.id,
        tool: 'Agent',
        args: { action: 'spawn', target: target.name, task: `Execute ${target.phase} phase work` },
        result: `❌ Sub-agent ${target.name} reported error: Context window exceeded — output was truncated. Escalating to orchestrator for retry with reduced scope.`,
        timestamp: ts,
        status: 'error',
      })
    } else {
      calls.push({
        id: tcId(agent.id, 'Agent'),
        agentId: agent.id,
        tool: 'Agent',
        args: { action: 'spawn', target: target.name, task: `Execute ${target.phase} phase work` },
        result: `Sub-agent ${target.name} completed successfully. Output: ${target.phase} phase deliverables ready for integration.`,
        timestamp: ts,
        status: 'ok',
      })
    }
  }

  return calls
}

// ─── TaskCreate Simulation ─────────────────────────────────────────────────────

function simulateTaskCreate(agent: Agent, vfs: VfsApi): ToolCall[] {
  const ts = Date.now()
  const existing = vfs.readFile('/tasks/todo.md') ?? '# TODO\n'
  const newTask = `\n- [ ] [${agent.name}] Complete ${agent.phase} phase deliverables — priority: high\n`
  vfs.writeFile('/tasks/todo.md', existing + newTask, agent.id)

  return [{
    id: tcId(agent.id, 'TaskCreate'),
    agentId: agent.id,
    tool: 'TodoWrite',
    args: { task: `Complete ${agent.phase} phase deliverables` },
    result: `Task added to /tasks/todo.md`,
    timestamp: ts,
    status: 'ok',
  }]
}

// ─── Content Generators ────────────────────────────────────────────────────────

function generateBuildContent(agent: Agent): string {
  const id = agent.id
  if (id === 'backend' || id === 'db_architect') {
    return `// Generated by ${agent.name}\nimport { Config } from './types'\n\nexport class ApiServer {\n  private config: Config\n\n  constructor(config: Config) {\n    this.config = config\n  }\n\n  async start(): Promise<void> {\n    console.log(\`Server starting in \${this.config.debug ? 'debug' : 'prod'} mode\`)\n  }\n\n  async healthCheck(): Promise<{ status: string }> {\n    return { status: 'healthy' }\n  }\n}\n`
  }
  if (id === 'frontend' || id === 'designer') {
    return `// Generated by ${agent.name}\nimport React from 'react'\n\nexport const Dashboard: React.FC = () => {\n  return (\n    <div className="dashboard">\n      <h1>Dashboard</h1>\n      <p>Status: Operational</p>\n    </div>\n  )\n}\n`
  }
  if (id === 'writer') {
    return `# API Documentation\n\n## Endpoints\n\n### GET /health\nReturns server health status.\n\n### POST /api/process\nProcesses the input data and returns results.\n\n## Authentication\nAll endpoints require Bearer token authentication.\n`
  }
  return `// Generated by ${agent.name}\nexport function ${id}Output(): string {\n  return '${agent.phase} phase complete'\n}\n`
}

function generateQaReport(agent: Agent, fileCount: number): string {
  const id = agent.id
  if (id === 'qa_security') {
    return `# Security Audit Report\n\n## Scope\nReviewed ${fileCount} source files.\n\n## Findings\n- ✅ No XSS vulnerabilities detected\n- ✅ Input validation present on all endpoints\n- ⚠️ Consider adding rate limiting to /api/process\n- ✅ Dependencies up to date, no known CVEs\n\n## Verdict: PASS with recommendations\n`
  }
  if (id === 'qa_quality') {
    return `# Code Quality Report\n\n## Metrics\n- Files analyzed: ${fileCount}\n- Test coverage: 78%\n- Cyclomatic complexity: avg 4.2 (good)\n- Duplicated code: 2.1% (acceptable)\n\n## Issues\n- 0 critical\n- 2 minor (unused imports)\n\n## Verdict: PASS\n`
  }
  if (id === 'qa_perf') {
    return `# Performance Report\n\n## Benchmarks\n- Cold start: 320ms (target: <500ms) ✅\n- API p50 latency: 45ms ✅\n- API p99 latency: 180ms ✅\n- Memory usage: 128MB baseline ✅\n\n## Recommendations\n- Consider lazy loading for non-critical modules\n- Add caching layer for frequently accessed data\n\n## Verdict: PASS\n`
  }
  return `# QA Report — ${agent.name}\n\n## Summary\nReviewed ${fileCount} files. All checks passed.\n\n## Verdict: PASS\n`
}
