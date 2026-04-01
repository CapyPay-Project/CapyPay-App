// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  vite: {
    envPrefix: ['PUBLIC_', 'NEXT_PUBLIC_'],
    plugins: [tailwindcss()],
    optimizeDeps: {
      // Evita servir versiones pre-optimzadas obsoletas en dev.
      include: ['lucide-svelte', 'embla-carousel-svelte', 'embla-carousel-autoplay'],
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