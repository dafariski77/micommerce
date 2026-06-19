import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/dashboard-assets/',
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'remote_dashboard',
      filename: 'remoteEntry.js',
      exposes: {
        './DashboardMain': './src/pages/DashboardMain.tsx',
      },
      shared: ['react', 'react-dom']
    })
  ],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  server: { port: 5002 },
  preview: { port: 5002 },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
