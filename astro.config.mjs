import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://httpscanner.com',
  output: 'static',
  outDir: './dist-astro',
  build: {
    format: 'directory',
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/\/$/, '') || '/';
        return pathname !== '/reports' && !pathname.startsWith('/report/');
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '^/api(?:/|$)': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        },
        '^/share(?:/|$)': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
  },
});
