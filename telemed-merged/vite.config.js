import { defineConfig } from 'vite'

export default defineConfig({
  root: '../apps/telemed-deploy-ready',
  publicDir: false, // Don't copy public folder
  build: {
    outDir: '../../telemed-merged/dist',
    emptyOutDir: true
  },
  preview: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1'
  }
})