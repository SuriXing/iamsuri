import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: '/iamsuri/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        '3d-world': resolve(__dirname, '3d-world.html'),
      },
    },
  },
})
