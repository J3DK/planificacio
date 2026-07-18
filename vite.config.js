import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5000000,
        runtimeCaching: [
          {
            urlPattern: /^\/panel-operario/,
            handler: 'NetworkFirst',
            options: { cacheName: 'panel-operario-cache' }
          },
          {
            urlPattern: /^\/panel-calidad/,
            handler: 'NetworkFirst',
            options: { cacheName: 'panel-calidad-cache' }
          }
        ]
      },
      manifest: {
        name: 'MES NextGen',
        short_name: 'MES',
        description: 'Sistema MES PWA',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    open: true,
  },
})
