// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    // Forzamos tipo `any` aquí para evitar incompatibilidades de tipos entre
    // diferentes versiones de `vite` en dependencias (evita TS2322).
    plugins: /** @type {any} */ ([tailwindcss()])
  }
});