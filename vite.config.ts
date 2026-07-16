import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/map_poi/',
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(root, 'src/components'),
      '@data': path.resolve(root, 'src/data'),
      '@hooks': path.resolve(root, 'src/hooks'),
      '@utils': path.resolve(root, 'src/utils'),
      '@type': path.resolve(root, 'src/types'),
      '@App': path.resolve(root, 'src/App.tsx'),
    },
  },
})
