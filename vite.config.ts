import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // expert-catalog corre en 8086 para evitar conflicto con expert-hub (8085)
    // cuando se tienen ambos `npm run dev` corriendo en paralelo.
    port: 8086,
    strictPort: false,
  },
})
