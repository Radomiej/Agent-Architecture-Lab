import { create } from 'zustand'
import i18n from '../i18n'

type Theme = 'dark' | 'light'
type Lang = 'pl' | 'en'
type SidebarTab = 'agents' | 'presets' | 'saved'

function readTheme(): Theme {
  try {
    return (localStorage.getItem('acV32_theme') as Theme) ?? 'dark'
  } catch {
    return 'dark'
  }
}

function readLang(): Lang {
  try {
    return (localStorage.getItem('acV32_lang') as Lang) ?? 'pl'
  } catch {
    return 'pl'
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function applyLang(lang: Lang) {
  document.documentElement.setAttribute('lang', lang)
  i18n.changeLanguage(lang).catch(() => undefined)
}

interface UiStore {
  theme: Theme
  lang: Lang
  activeModal: string | null
  sidebarTab: SidebarTab
  agentPaletteSearch: string
  selectedAgentId: string | null
  selectedPresetId: string | null
  leftDrawerOpen: boolean
  rightDrawerOpen: boolean
  setTheme: (theme: Theme) => void
  setLang: (lang: Lang) => void
  toggleTheme: () => void
  toggleLang: () => void
  openModal: (id: string) => void
  closeModal: () => void
  setSidebarTab: (tab: SidebarTab) => void
  setSearch: (q: string) => void
  selectAgent: (id: string | null) => void
  selectPreset: (id: string | null) => void
  setLeftDrawer: (open: boolean) => void
  setRightDrawer: (open: boolean) => void
}

const initialTheme = readTheme()
const initialLang = readLang()

applyTheme(initialTheme)
applyLang(initialLang)

export const useUiStore = create<UiStore>((set) => ({
  theme: initialTheme,
  lang: initialLang,
  activeModal: null,
  sidebarTab: 'agents',
  agentPaletteSearch: '',
  selectedAgentId: null,
  selectedPresetId: null,
  leftDrawerOpen: false,
  rightDrawerOpen: false,

  setTheme: (theme) => {
    try { localStorage.setItem('acV32_theme', theme) } catch { /* noop */ }
    applyTheme(theme)
    set({ theme })
  },

  setLang: (lang) => {
    try { localStorage.setItem('acV32_lang', lang) } catch { /* noop */ }
    applyLang(lang)
    set({ lang })
  },

  toggleTheme: () =>
    set((s) => {
      const next: Theme = s.theme === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('acV32_theme', next) } catch { /* noop */ }
      applyTheme(next)
      return { theme: next }
    }),

  toggleLang: () =>
    set((s) => {
      const next: Lang = s.lang === 'pl' ? 'en' : 'pl'
      try { localStorage.setItem('acV32_lang', next) } catch { /* noop */ }
      applyLang(next)
      return { lang: next }
    }),

  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),

  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setSearch: (agentPaletteSearch) => set({ agentPaletteSearch }),

  selectAgent: (id) => set((s) => {
    // On mobile (left drawer open), auto-navigate to right panel
    const shouldNavigate = id !== null && s.leftDrawerOpen
    return {
      selectedAgentId: id,
      selectedPresetId: null,
      leftDrawerOpen: shouldNavigate ? false : s.leftDrawerOpen,
      rightDrawerOpen: shouldNavigate ? true : s.rightDrawerOpen,
    }
  }),
  selectPreset: (id) => set((s) => {
    const shouldNavigate = id !== null && s.leftDrawerOpen
    return {
      selectedPresetId: id,
      selectedAgentId: null,
      leftDrawerOpen: shouldNavigate ? false : s.leftDrawerOpen,
      rightDrawerOpen: shouldNavigate ? true : s.rightDrawerOpen,
    }
  }),

  setLeftDrawer: (open) => set({ leftDrawerOpen: open }),
  setRightDrawer: (open) => set({ rightDrawerOpen: open }),
}))
