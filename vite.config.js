import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],

  base: '/',

  server: {
    allowedHosts: [
      'chrome-alberta-racks-foundations.trycloudflare.com'
    ]
  }
})