import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base so the same build works on GitHub Pages and inside the
// Capacitor Android WebView (served from https://localhost).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
