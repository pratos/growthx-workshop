import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' }, auxiliaryWorkers: [{ configPath: '../api/wrangler.jsonc' }], persistState: { path: '../api/.wrangler/state' } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
