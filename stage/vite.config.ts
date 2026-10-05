import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import frappeui from 'frappe-ui/vite'
import { writeFileSync } from 'node:fs'
import { defineConfig } from 'vite'

// The stage is a real frappe-ui app. It builds into the Remotion project's
// public/ folder so the film can load it with staticFile('stage/index.html').
export default defineConfig({
  base: './',
  plugins: [
    frappeui({ frappeProxy: false, jinjaBootData: false, buildConfig: false }),
    vue(),
    // stamp each build, so the film loads it fresh instead of a cached copy
    {
      name: 'stage-version',
      closeBundle() {
        const at = fileURLToPath(new URL('../src/stageVersion.ts', import.meta.url))
        writeFileSync(at, `// Written by the stage build (stage/vite.config.ts); do not edit.\nexport const STAGE_VERSION = '${Date.now().toString(36)}';\n`)
      },
    },
  ],
  resolve: {
    alias: {
      '@fui-docs': fileURLToPath(new URL('./node_modules/frappe-ui/vitepress/components/Docs', import.meta.url)),
    },
  },
  build: {
    outDir: '../public/stage',
    emptyOutDir: true,
    chunkSizeWarningLimit: 5000,
  },
})
