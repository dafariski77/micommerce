import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appUrl = env.VITE_APP_URL || '';

  const remoteCatalogUrl = appUrl 
    ? `${appUrl}/catalog-assets/assets/remoteEntry.js`
    : 'http://localhost:5001/assets/remoteEntry.js';

  const remoteDashboardUrl = appUrl 
    ? `${appUrl}/dashboard-assets/assets/remoteEntry.js`
    : 'http://localhost:5002/assets/remoteEntry.js';

  return {
    plugins: [
      react(),
      tailwindcss(),
      federation({
        name: 'host_shell',
        remotes: {
          remote_catalog: remoteCatalogUrl,
          remote_dashboard: remoteDashboardUrl,
        },
        shared: ['react', 'react-dom', '@tanstack/react-router']
      })
    ],
    server: { port: 5000 },
    preview: { port: 5000 },
    build: {
      target: 'esnext',
      minify: false,
      cssCodeSplit: false
    }
  }
})
