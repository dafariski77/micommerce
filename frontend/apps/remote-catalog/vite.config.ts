import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from '@originjs/vite-plugin-federation'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/catalog-assets/',
  plugins: [
    vue(),
    tailwindcss(),
    federation({
      name: 'remote_catalog',
      filename: 'remoteEntry.js',
      exposes: {
        './CatalogPage': './src/pages/CatalogPage.vue',
      },
      shared: ['vue']
    })
  ],
  server: { port: 5001 },
  preview: { port: 5001 },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
