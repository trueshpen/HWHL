import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths so the app can be opened directly from file system
  server: {
    host: 'localhost',
    port: 5173,
    open: false, // Don't auto-open browser
  },
})

