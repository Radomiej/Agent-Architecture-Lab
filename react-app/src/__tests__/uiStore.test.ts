import { beforeEach, describe, expect, it, vi } from 'vitest'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

const changeLanguage = vi.fn().mockResolvedValue(undefined)

async function freshStore() {
  vi.resetModules()
  vi.doMock('../i18n', () => ({
    default: { changeLanguage },
  }))
  const { useUiStore } = await import('../store/uiStore')
  return useUiStore
}

describe('uiStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    changeLanguage.mockClear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('lang')
  })

  it('sets and toggles theme with DOM + localStorage side effects', async () => {
    const store = await freshStore()

    store.getState().setTheme('light')
    expect(store.getState().theme).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    store.getState().toggleTheme()
    expect(store.getState().theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorageMock.getItem('acV32_theme')).toBe('dark')
  })

  it('sets and toggles language with i18n side effects', async () => {
    const store = await freshStore()

    store.getState().setLang('en')
    expect(store.getState().lang).toBe('en')
    expect(document.documentElement.getAttribute('lang')).toBe('en')
    expect(changeLanguage).toHaveBeenCalledWith('en')

    store.getState().toggleLang()
    expect(store.getState().lang).toBe('pl')
    expect(document.documentElement.getAttribute('lang')).toBe('pl')
    expect(localStorageMock.getItem('acV32_lang')).toBe('pl')
  })

  it('handles modal and sidebar actions', async () => {
    const store = await freshStore()

    store.getState().openModal('cost')
    expect(store.getState().activeModal).toBe('cost')

    store.getState().setSidebarTab('presets')
    store.getState().setSearch('qa')
    expect(store.getState().sidebarTab).toBe('presets')
    expect(store.getState().agentPaletteSearch).toBe('qa')

    store.getState().closeModal()
    expect(store.getState().activeModal).toBeNull()
  })

  it('navigates from left drawer to right drawer on mobile selection', async () => {
    const store = await freshStore()

    store.getState().setLeftDrawer(true)
    store.getState().setRightDrawer(false)

    store.getState().selectAgent('orchestrator')
    expect(store.getState().selectedAgentId).toBe('orchestrator')
    expect(store.getState().selectedPresetId).toBeNull()
    expect(store.getState().leftDrawerOpen).toBe(false)
    expect(store.getState().rightDrawerOpen).toBe(true)
  })

  it('selecting preset clears selected agent and keeps drawer state when no mobile nav', async () => {
    const store = await freshStore()

    store.getState().setLeftDrawer(false)
    store.getState().setRightDrawer(false)
    store.getState().selectAgent('orchestrator')
    store.getState().selectPreset('solo')

    expect(store.getState().selectedAgentId).toBeNull()
    expect(store.getState().selectedPresetId).toBe('solo')
    expect(store.getState().leftDrawerOpen).toBe(false)
    expect(store.getState().rightDrawerOpen).toBe(false)
  })
})
