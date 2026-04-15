import { beforeEach, describe, expect, it } from 'vitest'
import { useVfsStore } from '../store/vfsStore'

describe('vfsStore', () => {
  beforeEach(() => {
    useVfsStore.getState().reset()
  })

  it('writes and reads files while creating parent directories', () => {
    const store = useVfsStore.getState()

    store.writeFile('/src/utils/file.ts', 'export const x = 1', 'agent-a')

    expect(store.readFile('/src/utils/file.ts')).toBe('export const x = 1')
    expect(store.listDir('/')).toContain('src/')
    expect(store.listDir('/src')).toContain('utils/')
  })

  it('edits file content and returns false when file/needle is missing', () => {
    const store = useVfsStore.getState()

    store.writeFile('/notes.md', 'alpha beta', 'agent-a')
    expect(store.editFile('/notes.md', 'beta', 'gamma', 'agent-b')).toBe(true)
    expect(store.readFile('/notes.md')).toBe('alpha gamma')

    expect(store.editFile('/notes.md', 'missing', 'noop', 'agent-c')).toBe(false)
    expect(store.editFile('/ghost.md', 'a', 'b', 'agent-c')).toBe(false)
  })

  it('supports glob and grep queries', () => {
    const store = useVfsStore.getState()

    store.writeFile('/src/a.ts', 'const one = 1\nconst two = 2', 'agent-a')
    store.writeFile('/src/b.ts', 'const two = 2\nconst three = 3', 'agent-a')
    store.writeFile('/docs/readme.md', 'two everywhere', 'agent-a')

    expect(store.glob('/src/*.ts')).toEqual(['/src/a.ts', '/src/b.ts'])

    const grepTs = store.grep('two', '/src/*.ts')
    expect(grepTs).toHaveLength(2)
    expect(grepTs[0].path).toBe('/src/a.ts')
    expect(grepTs[1].path).toBe('/src/b.ts')
  })

  it('deletes single files and directory trees', () => {
    const store = useVfsStore.getState()

    store.writeFile('/src/a.ts', 'a', 'agent-a')
    store.writeFile('/src/nested/b.ts', 'b', 'agent-a')

    expect(store.deleteFile('/src/a.ts')).toBe(true)
    expect(store.readFile('/src/a.ts')).toBeNull()

    expect(store.deleteFile('/src')).toBe(true)
    expect(store.readFile('/src/nested/b.ts')).toBeNull()
    expect(store.deleteFile('/src')).toBe(false)
  })

  it('seeds project scaffold and exposes deterministic snapshot', () => {
    const store = useVfsStore.getState()
    store.seedProject()

    expect(store.readFile('/package.json')).toContain('multi-agent-project')
    expect(store.readFile('/src/app.ts')).toContain('Hello from multi-agent project')
    expect(store.listDir('/')).toContain('src/')

    const snapshot = store.getSnapshot()
    expect(snapshot.length).toBeGreaterThan(5)
    expect(snapshot[0].path <= snapshot[snapshot.length - 1].path).toBe(true)
  })
})
