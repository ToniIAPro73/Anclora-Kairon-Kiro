import { defineConfig } from 'vite'
import { resolve } from 'path'

// Landing page specific config
export default defineConfig({
  root: 'src/landing',
  build: {
    outDir: '../../dist/landing',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/landing/index.html')
      }
    }
  },
  server: {
    port: 3001,
    open: true
  },
  publicDir: '../../public'
})