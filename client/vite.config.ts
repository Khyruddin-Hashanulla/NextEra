import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteCompression from 'vite-plugin-compression';

function robotsTxtPlugin(): import('vite').Plugin {
  return {
    name: 'robots-txt',
    configureServer(server) {
      server.middlewares.use('/robots.txt', (_req, res) => {
        res.setHeader('Content-Type', 'text/plain');
        res.end('User-agent: *\nDisallow: /\n');
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    robotsTxtPlugin(),
    viteCompression({
      verbose: false,
      threshold: 1024,
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
    }),
    viteCompression({
      verbose: false,
      threshold: 1024,
      algorithm: 'brotliCompress',
      ext: '.br',
      deleteOriginFile: false,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4053',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true,
    cssMinify: 'esbuild',
    chunkSizeWarningLimit: 600,
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          // Headless UI primitives + their positioning engine. Must precede the
          // react-family check: @floating-ui/react contains "/react/" in its path.
          if (id.includes('@radix-ui') || id.includes('@floating-ui')) {
            return 'vendor-radix';
          }

          // React runtime family (keeps react/jsx-runtime and scheduler together).
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
            return 'vendor-react';
          }

          // React Router ecosystem.
          if (id.includes('react-router') || id.includes('@remix-run')) {
            return 'vendor-router';
          }

          // Server-state fetching.
          if (id.includes('@tanstack') || id.includes('use-sync-external-store')) {
            return 'vendor-query';
          }

          // Animation (framer-motion + its motion-dom / motion-utils internals).
          if (id.includes('framer-motion') || id.includes('/motion-dom/') || id.includes('/motion-utils/')) {
            return 'vendor-motion';
          }

          // Form handling + validation.
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/zod/')) {
            return 'vendor-forms';
          }

          // HTTP + OAuth.
          if (id.includes('/axios/') || id.includes('@react-oauth')) {
            return 'vendor-http';
          }

          // Icons (tree-shaken to the icons actually used).
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }

          // UI utilities and small surface-area helpers.
          if (
            id.includes('/sonner/') ||
            id.includes('/cmdk/') ||
            id.includes('class-variance-authority') ||
            id.includes('tailwind-merge') ||
            id.includes('/clsx/')
          ) {
            return 'vendor-ui';
          }

          // Document head management.
          if (id.includes('react-helmet-async')) {
            return 'vendor-head';
          }

          return 'vendor-misc';
        },
      },
    },
  },
});
