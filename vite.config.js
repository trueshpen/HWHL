import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages deployment: base path should be your repository name
// For example, if your repo is https://github.com/username/HWHL, use '/HWHL/'
// For local development, use './'
// Change '/HWHL/' to match your actual repository name
const base = process.env.GITHUB_PAGES === 'true'
  ? '/HWHL/' // Change this to match your repository name
  : './'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Wife Happiness App',
        short_name: 'HWHL',
        description: 'Keep track of everything that makes her smile.',
        theme_color: '#ff69b4',
        background_color: '#ffe4f2',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  base: base,
  server: {
    host: 'localhost',
    port: 5173,
    open: false, // Don't auto-open browser
  },
})

