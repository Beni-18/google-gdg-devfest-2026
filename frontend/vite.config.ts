import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { searchForWorkspaceRoot } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        name: 'Passport Mitra',
        short_name: 'Mitra',
        description: "Check before you book. Fix it when you're stuck.",
        theme_color: '#1e3a8a',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  resolve: {
    // Read-only view of backend/data/reference (owned by Lane D): import pv from '@reference/pv_pending_2025.json'
    alias: { '@reference': fileURLToPath(new URL('../backend/data/reference', import.meta.url)) },
  },
  server: {
    // Dev: the browser talks to Vite only; /api is forwarded to FastAPI (no CORS needed).
    proxy: { '/api': `http://localhost:${process.env.API_PORT ?? 8000}` },
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), '../backend/data/reference'] },
  },
  test: {
    environment: 'node',
  },
})
