import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: [
        'src/store/canvasStore.ts',
        'src/store/costStore.ts',
        'src/store/llmStore.ts',
        'src/store/presetStore.ts',
        'src/store/simulationStore.ts',
        'src/store/uiStore.ts',
        'src/store/vfsStore.ts',
        'src/services/llmService.ts',
        'src/utils/buildAgentContext.ts',
        'src/utils/env.ts',
      ],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
})
