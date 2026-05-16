import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
    __GIT_HASH__: JSON.stringify(gitHash),
  },
  plugins: [tailwindcss(), react()],
  appType: "spa",
})
