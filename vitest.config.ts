import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/**', 'components/**', 'contexts/**', 'app/api/**'],
      exclude: ['**/.DS_Store', '**/*.d.ts'],
      reporter: ['text', 'html'],
    },
  },
})
