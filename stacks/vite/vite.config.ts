import { fileURLToPath, URL } from 'node:url'
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Breakpoints + mixins reach every stylesheet without an explicit @use (see docs/design-system.md).
        loadPaths: [fileURLToPath(new URL('./src/styles', import.meta.url))],
        additionalData: '@use "core" as *;\n',
      },
    },
  },
  // Same port as the Next stack so launch.json and E2E_BASE_URL are shared.
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
  build: {
    rolldownOptions: {
      output: {
        // Vendor code changes rarely; separate chunks keep it cached across deploys.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
            { name: 'antd', test: /node_modules[\\/](antd|@ant-design|@rc-component|rc-[^\\/]+)[\\/]/ },
          ],
        },
      },
    },
  },
})
