/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
  plugins: [react(), robotsTxtPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-query';
            }
            if (id.includes('lucide')) {
              return 'vendor-icons';
            }
            if (id.includes('recharts') || id.includes('chart')) {
              return 'vendor-charts';
            }
            if (id.includes('@codemirror') || id.includes('@uiw')) {
              return 'vendor-editor';
            }
            return 'vendor-other';
          }
          if (id.includes('/features/admin/')) return 'feature-admin';
          if (id.includes('/features/instructor/')) return 'feature-instructor';
          if (id.includes('/features/student/')) return 'feature-student';
          if (id.includes('/features/public/')) return 'feature-public';
          if (id.includes('/features/auth/')) return 'feature-auth';
          if (id.includes('/features/blog/')) return 'feature-blog';
          if (id.includes('/features/certificates/')) return 'feature-certificates';
          if (id.includes('/features/ai/')) return 'feature-ai';
        },
      },
    },
  },
});
