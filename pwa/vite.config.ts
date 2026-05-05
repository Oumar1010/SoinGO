import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SoinGo',
        short_name: 'SoinGo',
        description: 'Tournées de soins à domicile',
        theme_color: '#2D8CFF',
        background_color: '#F5F6FA',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/app_icon_iPad_1024.png', sizes: '1024x1024', type: 'image/png' },
          { src: '/favicon_32x32.png', sizes: '32x32', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5174,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
