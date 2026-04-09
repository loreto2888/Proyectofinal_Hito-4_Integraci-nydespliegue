import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración básica de Vite para React (Hito 4)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
