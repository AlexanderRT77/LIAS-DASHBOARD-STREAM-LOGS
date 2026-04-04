import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api/artificial-analysis': {
        target: 'https://artificialanalysis.ai',
        changeOrigin: true,
        rewrite: (path) => '/api/v2/data/llms/models',
        headers: {
          'x-api-key': 'aa_KyNNsybVlshlVoYJmjwEOMnpeMVeimxE',
        },
      },
    },
  },
  build: {
    outDir: 'build'
  }
})
