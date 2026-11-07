import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

const stylusVariables = fileURLToPath(new URL('./src/vars.styl', import.meta.url)).replace(/\\/g, '/')

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    VitePWA({
      // Keep the existing manifest and registration callback handling.
      manifest: false,
      filename: 'service-worker.js',
      injectRegister: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
        // A waiting worker is why phones kept the old build with all tabs open:
        // take control immediately and drop caches from previous precache revisions.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 1337
  },
  css: {
    preprocessorOptions: {
      stylus: {
        additionalData: '@import "' + stylusVariables + '"\n'
      }
    }
  }
})
