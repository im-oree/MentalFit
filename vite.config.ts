import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    host: true,
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
})
