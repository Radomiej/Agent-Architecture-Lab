import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: './',
  server: {
    allowedHosts: true,
    proxy: {
      '/mcp-proxy': {
        target: 'http://localhost:8808',
        rewrite: (path) => path.replace(/^\/mcp-proxy/, '/mcp'),
        changeOrigin: true,
        headers: { Origin: 'http://localhost:8808' },
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id === 'react') return 'vendor'
          if (id.includes('node_modules/react-i18next') || id.includes('node_modules/i18next')) return 'i18n'
          if (id.includes('node_modules/zustand')) return 'zustand'
          return undefined
        },
      }
    }
  }
})
