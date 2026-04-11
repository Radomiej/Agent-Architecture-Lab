import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'

export function useTheme() {
  const { theme, toggleTheme, setTheme } = useUiStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return { theme, toggleTheme, setTheme }
}
