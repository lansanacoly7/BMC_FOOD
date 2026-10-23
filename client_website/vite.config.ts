import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Port fixe : le site client tourne obligatoirement sur 5173.
    port: 5173,
    strictPort: true,
  },
})
