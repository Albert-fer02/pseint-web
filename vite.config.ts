import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const isGithubActions = process.env.GITHUB_ACTIONS === 'true'
const base = isGithubActions && repoName ? `/${repoName}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (
            id.includes('@uiw/react-codemirror') ||
            id.includes('@codemirror/') ||
            id.includes('@lezer/')
          ) {
            return 'codemirror'
          }

          if (id.includes('@tanstack/react-router')) {
            return 'router'
          }

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'react-vendor'
          }

          return undefined
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage/unit',
      include: [
        'src/shared/lib/pseint/**/*.ts',
        'src/features/runtime/model/**/*.ts',
        'src/features/ai/lib/json.ts',
      ],
      exclude: [
        'src/test/**',
        '**/*.spec.ts',
        '**/types.ts',
        'src/features/runtime/model/defaultProgram.ts',
        'src/features/runtime/model/examplePrograms.ts',
        'src/features/runtime/model/practice/exercises/**',
      ],
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 65,
        branches: 50,
      },
    },
  },
})
