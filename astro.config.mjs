import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const reportPathPattern = /^\/report\/[0-9a-f]{32}\/?$/i;
const localWorkerOrigin = (
  process.env.LOCAL_WORKER_ORIGIN ?? 'http://localhost:8787'
).replace(/\/$/, '');

function reportDevRedirect() {
  return {
    name: 'report-dev-redirect',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestUrl = new URL(request.url ?? '/', 'http://localhost');
        if (!reportPathPattern.test(requestUrl.pathname)) {
          next();
          return;
        }

        response.statusCode = 307;
        response.setHeader(
          'Location',
          `${localWorkerOrigin}${requestUrl.pathname}${requestUrl.search}`
        );
        response.end();
      });
    },
  };
}

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
        return pathname !== '/reports'
          && pathname !== '/report'
          && !pathname.startsWith('/report/');
      },
    }),
  ],
  vite: {
    plugins: [reportDevRedirect(), tailwindcss()],
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
