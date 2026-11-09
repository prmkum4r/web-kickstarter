import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Pure logic is unit-tested; UI is covered by e2e. Widen as tested areas grow.
      include: ['src/lib/**', 'src/features/*/services/**'],
    },
  },
})
