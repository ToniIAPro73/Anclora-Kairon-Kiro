import { defineConfig } from 'vite'
import { resolve } from 'path'

// Default config for development - serves both landing and app
export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'src/landing/index.html'),
        app: resolve(__dirname, 'src/app/index.html')
      }
    }
  },
  server: {
    port: 5173,
    open: '/test-auth-complete.html'
  }
})