import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  base: '/',

  server: {
    // Arena proxies the preview through a generated host, so it cannot be
    // hard-coded here. Vite still binds only to the sandbox interface below.
    allowedHosts: true
  }
})
