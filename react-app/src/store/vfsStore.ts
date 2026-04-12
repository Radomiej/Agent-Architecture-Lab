import { create } from 'zustand'
import type { VfsFile } from '../types'

interface VfsStore {
  files: Map<string, VfsFile>

  readFile: (path: string) => string | null
  writeFile: (path: string, content: string, agentId: string) => void
  editFile: (path: string, oldStr: string, newStr: string, agentId: string) => boolean
  mkdir: (path: string, agentId?: string) => void
  listDir: (path: string) => string[]
  glob: (pattern: string) => string[]
  grep: (query: string, pathPattern?: string) => Array<{ path: string; line: number; text: string }>
  deleteFile: (path: string) => boolean
  reset: () => void
  seedProject: () => void
  getSnapshot: () => VfsFile[]
}

function normPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '') || '/'
}

function simpleGlobToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§DOUBLESTAR§')
    .replace(/\*/g, '[^/]*')
    .replace(/§DOUBLESTAR§/g, '.*')
    .replace(/\?/g, '[^/]')
  return new RegExp(`^${escaped}$`, 'i')
}

export const useVfsStore = create<VfsStore>((set, get) => ({
  files: new Map<string, VfsFile>(),

  readFile: (path) => {
    const f = get().files.get(normPath(path))
    return f && f.type === 'file' ? f.content : null
  },

  writeFile: (path, content, agentId) => {
    const np = normPath(path)
    // Ensure parent dirs exist
    const parts = np.split('/').filter(Boolean)
    let current = ''
    const now = Date.now()
    set((s) => {
      const next = new Map(s.files)
      for (let i = 0; i < parts.length - 1; i++) {
        current += '/' + parts[i]
        if (!next.has(current)) {
          next.set(current, { path: current, content: '', createdBy: agentId, modifiedAt: now, type: 'dir' })
        }
      }
      next.set(np, { path: np, content, createdBy: agentId, modifiedAt: now, type: 'file' })
      return { files: next }
    })
  },

  editFile: (path, oldStr, newStr, agentId) => {
    const np = normPath(path)
    const f = get().files.get(np)
    if (!f || f.type !== 'file') return false
    if (!f.content.includes(oldStr)) return false
    set((s) => {
      const next = new Map(s.files)
      next.set(np, {
        ...f,
        content: f.content.replace(oldStr, newStr),
        createdBy: agentId,
        modifiedAt: Date.now(),
      })
      return { files: next }
    })
    return true
  },

  mkdir: (path, agentId = 'system') => {
    const np = normPath(path)
    const parts = np.split('/').filter(Boolean)
    let current = ''
    const now = Date.now()
    set((s) => {
      const next = new Map(s.files)
      for (const part of parts) {
        current += '/' + part
        if (!next.has(current)) {
          next.set(current, { path: current, content: '', createdBy: agentId, modifiedAt: now, type: 'dir' })
        }
      }
      return { files: next }
    })
  },

  listDir: (path) => {
    const np = normPath(path) || '/'
    const prefix = np === '/' ? '/' : np + '/'
    const entries: string[] = []
    const seen = new Set<string>()

    for (const [p] of get().files) {
      if (np === '/' ? p.startsWith('/') : p.startsWith(prefix)) {
        const rest = np === '/' ? p.slice(1) : p.slice(prefix.length)
        const firstPart = rest.split('/')[0]
        if (firstPart && !seen.has(firstPart)) {
          seen.add(firstPart)
          // Check if it's a direct child
          const childPath = np === '/' ? '/' + firstPart : prefix + firstPart
          const childFile = get().files.get(childPath)
          entries.push(childFile?.type === 'dir' ? firstPart + '/' : firstPart)
        }
      }
    }
    return entries.sort()
  },

  glob: (pattern) => {
    const re = simpleGlobToRegex(pattern)
    const results: string[] = []
    for (const [p, f] of get().files) {
      if (f.type === 'file' && re.test(p)) {
        results.push(p)
      }
    }
    return results.sort()
  },

  grep: (query, pathPattern) => {
    const results: Array<{ path: string; line: number; text: string }> = []
    const queryLower = query.toLowerCase()
    const files = pathPattern ? get().glob(pathPattern) : [...get().files.keys()]

    for (const p of files) {
      const f = get().files.get(p)
      if (!f || f.type !== 'file') continue
      const lines = f.content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(queryLower)) {
          results.push({ path: p, line: i + 1, text: lines[i] })
        }
      }
    }
    return results.slice(0, 50)
  },

  deleteFile: (path) => {
    const np = normPath(path)
    const had = get().files.has(np)
    if (!had) return false
    set((s) => {
      const next = new Map(s.files)
      // Delete the file/dir and all children if dir
      for (const key of next.keys()) {
        if (key === np || key.startsWith(np + '/')) {
          next.delete(key)
        }
      }
      return { files: next }
    })
    return true
  },

  reset: () => set({ files: new Map() }),

  seedProject: () => {
    const now = Date.now()
    const seed: Array<[string, string]> = [
      ['/package.json', JSON.stringify({
        name: 'multi-agent-project',
        version: '1.0.0',
        scripts: { dev: 'vite', build: 'vite build', test: 'vitest', lint: 'eslint src/' },
        dependencies: { react: '^19.0.0', typescript: '^5.8.0' },
      }, null, 2)],
      ['/tsconfig.json', JSON.stringify({
        compilerOptions: { target: 'ES2022', module: 'ESNext', strict: true, jsx: 'react-jsx', outDir: 'dist' },
        include: ['src'],
      }, null, 2)],
      ['/README.md', '# Multi-Agent Project\n\nGenerated by Agent Architecture Designer.\n'],
      ['/src/index.ts', 'import { main } from \'./app\'\n\nmain()\n'],
      ['/src/app.ts', 'export function main(): void {\n  console.log(\'Hello from multi-agent project\')\n}\n'],
      ['/src/utils/helpers.ts', 'export function formatDate(d: Date): string {\n  return d.toISOString().slice(0, 10)\n}\n\nexport function slugify(s: string): string {\n  return s.toLowerCase().replace(/\\s+/g, \'-\').replace(/[^a-z0-9-]/g, \'\')\n}\n'],
      ['/src/types.ts', 'export interface Config {\n  name: string\n  version: string\n  debug: boolean\n}\n\nexport type Status = \'idle\' | \'running\' | \'done\' | \'error\'\n'],
      ['/tests/app.test.ts', 'import { describe, it, expect } from \'vitest\'\nimport { main } from \'../src/app\'\n\ndescribe(\'main\', () => {\n  it(\'should run without errors\', () => {\n    expect(() => main()).not.toThrow()\n  })\n})\n'],
      ['/tasks/todo.md', '# TODO\n\n- [ ] Implement core functionality\n- [ ] Add error handling\n- [ ] Write tests\n- [ ] Documentation\n'],
      ['/.gitignore', 'node_modules/\ndist/\n.env\n'],
    ]

    set(() => {
      const files = new Map<string, VfsFile>()
      const dirs = new Set<string>()

      for (const [path, content] of seed) {
        // Create parent dirs
        const parts = path.split('/').filter(Boolean)
        let current = ''
        for (let i = 0; i < parts.length - 1; i++) {
          current += '/' + parts[i]
          if (!dirs.has(current)) {
            dirs.add(current)
            files.set(current, { path: current, content: '', createdBy: 'system', modifiedAt: now, type: 'dir' })
          }
        }
        files.set(path, { path, content, createdBy: 'system', modifiedAt: now, type: 'file' })
      }

      return { files }
    })
  },

  getSnapshot: () => {
    const arr: VfsFile[] = []
    for (const f of get().files.values()) {
      arr.push(f)
    }
    return arr.sort((a, b) => a.path.localeCompare(b.path))
  },
}))
