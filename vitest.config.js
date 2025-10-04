import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/shared/test/setup.js'],
    css: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './src/shared'),
      '@landing': resolve(__dirname, './src/landing'),
      '@app': resolve(__dirname, './src/app'),
    },
  },
})