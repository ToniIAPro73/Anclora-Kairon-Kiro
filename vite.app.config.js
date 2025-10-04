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
        main: resolve(__dirname, 'src/app/index.html')
      }
    }
  },
  server: {
    port: 3002,
    open: true
  },
  publicDir: '../../public'
})