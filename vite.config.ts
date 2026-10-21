import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works both at the site root and under
  // a project sub-path such as https://<user>.github.io/<repo>/.
  base: './',
})
