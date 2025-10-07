import { defineConfig } from 'vite'
import { resolve } from 'path'

// Default config for development - serves both landing and app
export default defineConfig({
  root: '.',
  envDir: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'src/landing/index.html'),
        app: resolve(__dirname, 'src/app/index.html'),
        authCallback: resolve(__dirname, 'auth/callback.html'),
        authReset: resolve(__dirname, 'auth/reset-password.html')
      }
    }
  },
  server: {
    port: 5173,
    open: '/src/landing/index.html'
  }
})