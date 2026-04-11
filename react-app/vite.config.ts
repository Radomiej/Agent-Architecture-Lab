import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('react-dom') || id.includes('react/')) return 'vendor'
          if (id.includes('react-i18next') || id.includes('i18next')) return 'i18n'
          if (id.includes('zustand')) return 'zustand'
          return undefined
        },
      }
    }
  }
})
