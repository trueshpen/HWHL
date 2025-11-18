import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages deployment: base path should be your repository name
// For example, if your repo is https://github.com/username/HWHL, use '/HWHL/'
// For local development, use './'
// Change '/HWHL/' to match your actual repository name
const base = process.env.GITHUB_PAGES === 'true'
  ? '/HWHL/' // Change this to match your repository name
  : './'

export default defineConfig({
  plugins: [react()],
  base: base,
  server: {
    host: 'localhost',
    port: 5173,
    open: false, // Don't auto-open browser
  },
})

