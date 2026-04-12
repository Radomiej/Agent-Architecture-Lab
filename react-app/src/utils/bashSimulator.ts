import type { ToolCall } from '../types'
import { useVfsStore } from '../store/vfsStore'

type VfsApi = ReturnType<typeof useVfsStore.getState>

/**
 * Simulates a bash command on the VFS. Returns a ToolCall with the output.
 * Recognizes common dev commands; unknown commands return a generic response.
 */
export function simulateBash(command: string, agentId: string, vfs: VfsApi): ToolCall {
  const ts = Date.now()
  const id = `${agentId}-bash-${ts}`
  const trimmed = command.trim()
  const parts = trimmed.split(/\s+/)
  const cmd = parts[0]

  try {
    const result = exec(cmd, parts.slice(1), trimmed, agentId, vfs)
    return { id, agentId, tool: 'Bash', args: { command: trimmed }, result, timestamp: ts, status: 'ok' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { id, agentId, tool: 'Bash', args: { command: trimmed }, result: msg, timestamp: ts, status: 'error' }
  }
}

function exec(cmd: string, args: string[], full: string, agentId: string, vfs: VfsApi): string {
  switch (cmd) {
    case 'ls': return execLs(args, vfs)
    case 'cat': return execCat(args, vfs)
    case 'echo': return execEcho(args, full, agentId, vfs)
    case 'grep': return execGrep(args, vfs)
    case 'mkdir': return execMkdir(args, agentId, vfs)
    case 'touch': return execTouch(args, agentId, vfs)
    case 'rm': return execRm(args, vfs)
    case 'pwd': return '/project'
    case 'cd': return ''
    case 'head': return execHead(args, vfs)
    case 'tail': return execTail(args, vfs)
    case 'wc': return execWc(args, vfs)
    case 'find': return execFind(args, vfs)
    case 'npm': return execNpm(args)
    case 'npx': return execNpx(args)
    case 'node': return 'Node.js v22.0.0'
    case 'tsc': return execTsc(vfs)
    case 'git': return execGit(args, vfs)
    case 'eslint': return execEslint(vfs)
    case 'vitest':
    case 'jest': return execTest()
    case 'curl':
    case 'wget': return '[mock] HTTP 200 OK — response body omitted in simulation'
    default:
      return `bash: ${cmd}: command not found`
  }
}

function execLs(args: string[], vfs: VfsApi): string {
  const path = args.find(a => !a.startsWith('-')) ?? '/'
  const entries = vfs.listDir(path)
  if (entries.length === 0) return `ls: cannot access '${path}': No such file or directory`
  return entries.join('\n')
}

function execCat(args: string[], vfs: VfsApi): string {
  if (args.length === 0) return ''
  const path = args[args.length - 1]
  const content = vfs.readFile(path)
  if (content === null) return `cat: ${path}: No such file or directory`
  return content
}

function execEcho(args: string[], full: string, agentId: string, vfs: VfsApi): string {
  // echo "content" > file  OR  echo "content" >> file
  const redirectIdx = full.indexOf('>')
  if (redirectIdx === -1) {
    return args.join(' ').replace(/^["']|["']$/g, '')
  }

  const append = full[redirectIdx + 1] === '>'
  const filePart = full.slice(redirectIdx + (append ? 2 : 1)).trim()
  const contentPart = full.slice(full.indexOf(' ') + 1, redirectIdx).trim().replace(/^["']|["']$/g, '')

  if (filePart) {
    const existing = vfs.readFile(filePart)
    if (append && existing !== null) {
      vfs.writeFile(filePart, existing + '\n' + contentPart, agentId)
    } else {
      vfs.writeFile(filePart, contentPart, agentId)
    }
  }
  return ''
}

function execGrep(args: string[], vfs: VfsApi): string {
  // grep pattern file(s)
  const nonFlags = args.filter(a => !a.startsWith('-'))
  if (nonFlags.length < 1) return 'Usage: grep PATTERN [FILE...]'
  const pattern = nonFlags[0]
  const filePath = nonFlags[1]
  const results = vfs.grep(pattern, filePath ? filePath : undefined)
  if (results.length === 0) return ''
  return results.map(r => `${r.path}:${r.line}: ${r.text}`).join('\n')
}

function execMkdir(args: string[], agentId: string, vfs: VfsApi): string {
  const dirs = args.filter(a => !a.startsWith('-'))
  for (const d of dirs) {
    vfs.mkdir(d, agentId)
  }
  return ''
}

function execTouch(args: string[], agentId: string, vfs: VfsApi): string {
  for (const f of args) {
    if (!f.startsWith('-') && !vfs.readFile(f)) {
      vfs.writeFile(f, '', agentId)
    }
  }
  return ''
}

function execRm(args: string[], vfs: VfsApi): string {
  const files = args.filter(a => !a.startsWith('-'))
  for (const f of files) {
    vfs.deleteFile(f)
  }
  return ''
}

function execHead(args: string[], vfs: VfsApi): string {
  const n = 10
  const file = args.find(a => !a.startsWith('-'))
  if (!file) return ''
  const content = vfs.readFile(file)
  if (content === null) return `head: ${file}: No such file or directory`
  return content.split('\n').slice(0, n).join('\n')
}

function execTail(args: string[], vfs: VfsApi): string {
  const n = 10
  const file = args.find(a => !a.startsWith('-'))
  if (!file) return ''
  const content = vfs.readFile(file)
  if (content === null) return `tail: ${file}: No such file or directory`
  return content.split('\n').slice(-n).join('\n')
}

function execWc(args: string[], vfs: VfsApi): string {
  const file = args.find(a => !a.startsWith('-'))
  if (!file) return '0 0 0'
  const content = vfs.readFile(file)
  if (content === null) return `wc: ${file}: No such file or directory`
  const lines = content.split('\n').length
  const words = content.split(/\s+/).filter(Boolean).length
  const chars = content.length
  return `  ${lines}  ${words}  ${chars} ${file}`
}

function execFind(args: string[], vfs: VfsApi): string {
  const pattern = args.find(a => !a.startsWith('-')) ?? '/'
  const globPattern = pattern.includes('*') ? pattern : pattern + '/**'
  const results = vfs.glob(globPattern)
  return results.join('\n') || '(no files found)'
}

function execNpm(args: string[]): string {
  const sub = args[0]
  switch (sub) {
    case 'install':
    case 'i':
      return 'added 142 packages in 3.2s\n\n12 packages are looking for funding\n  run `npm fund` for details'
    case 'test':
    case 't':
      return execTest()
    case 'run': {
      const script = args[1]
      if (script === 'build') return '✓ built in 1.24s\n  dist/index.js  12.4 kB'
      if (script === 'lint') return execEslint({ glob: () => [] } as unknown as VfsApi)
      if (script === 'dev') return 'VITE v8.0.0  ready in 320 ms\n\n  ➜  Local:   http://localhost:5173/'
      return `npm run ${script} — executed successfully`
    }
    default:
      return `npm ${sub ?? ''} — ok`
  }
}

function execNpx(args: string[]): string {
  const cmd = args[0]
  if (cmd === 'playwright' || cmd === 'vitest') return execTest()
  if (cmd === 'tsc') return '✓ No errors found.'
  return `npx ${cmd} — executed successfully`
}

function execTsc(vfs: VfsApi): string {
  const tsFiles = vfs.glob('/src/**/*.ts')
  if (tsFiles.length === 0) return '✓ No input files found.'
  return `✓ Found 0 errors. Checking ${tsFiles.length} files.`
}

function execGit(args: string[], vfs: VfsApi): string {
  const sub = args[0]
  switch (sub) {
    case 'status':
      return 'On branch main\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n\n\tmodified:   src/app.ts\n\nno changes added to commit'
    case 'diff': {
      const files = vfs.glob('/src/**')
      const changed = files.slice(0, 2)
      if (changed.length === 0) return '(no diff)'
      return changed.map(f => `diff --git a${f} b${f}\n--- a${f}\n+++ b${f}\n@@ -1,3 +1,5 @@\n+// Updated by agent\n import ...\n`).join('\n')
    }
    case 'log':
      return 'commit abc1234 (HEAD -> main)\nAuthor: Agent <agent@pipeline>\nDate:   Sat Apr 12 2026\n\n    Initial commit'
    case 'add': return ''
    case 'commit': return '[main abc1235] Agent update\n 2 files changed, 15 insertions(+), 3 deletions(-)'
    case 'branch': return '* main\n  feature/update'
    default:
      return `git ${sub} — ok`
  }
}

function execEslint(vfs: VfsApi): string {
  const files = vfs.glob('/src/**/*.ts')
  return `✓ ${files.length} files linted — 0 errors, 0 warnings`
}

function execTest(): string {
  const passed = 4 + Math.floor(Math.random() * 8)
  return ` ✓ src/app.test.ts (${passed} tests) ${passed * 12}ms\n\n Tests  ${passed} passed\n Time   ${(passed * 0.12).toFixed(2)}s`
}
