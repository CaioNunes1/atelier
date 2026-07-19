import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features':   path.resolve(__dirname, './src/features'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib':        path.resolve(__dirname, './src/lib'),
      '@types':      path.resolve(__dirname, './src/types'),
      '@routes':     path.resolve(__dirname, './src/routes'),
    },
  },
  server: {
    port: 5174,
    proxy: { '/api': { target: 'http://localhost:3333', changeOrigin: true } },
  },
})
