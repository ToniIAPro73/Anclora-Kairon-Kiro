import { defineConfig } from 'vite'
import { resolve } from 'path'

// App specific config
export default defineConfig({
  root: 'src/app',
  build: {
    outDir: '../../dist/app',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/app/index.html'),
        authCallback: resolve(__dirname, 'auth/callback.html'),
        authReset: resolve(__dirname, 'auth/reset-password.html')
      }
    }
  },
  server: {
    port: 5175,
    open: true
  },
  publicDir: '../../public'
})