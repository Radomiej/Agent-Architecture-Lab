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
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor'
          if (id.includes('node_modules/react-i18next') || id.includes('node_modules/i18next')) return 'i18n'
          if (id.includes('node_modules/zustand')) return 'zustand'
          return undefined
        },
      }
    }
  }
})
