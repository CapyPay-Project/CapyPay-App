// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // Evita servir una version pre-optimizada obsoleta en dev para nanostores.
      exclude: ['nanostores']
    },
    server: {
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        clientPort: 4321
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    }
  }
});