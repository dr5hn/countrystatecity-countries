import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // No special configuration needed for @countrystatecity/countries!
  // The import.meta.glob approach works out of the box
})
