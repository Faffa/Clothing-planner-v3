import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

/** Dev-only middleware to proxy image fetches and bypass CORS. */
function imageFetchProxy(): Plugin {
  return {
    name: 'image-fetch-proxy',
    configureServer(server) {
      server.middlewares.use('/api/fetch-image', async (req, res) => {
        const url = new URL(req.url!, 'http://localhost');
        const imageUrl = url.searchParams.get('url');
        if (!imageUrl) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Missing url param');
          return;
        }
        try {
          const resp = await fetch(imageUrl);
          if (!resp.ok) {
            res.writeHead(resp.status, { 'Content-Type': 'text/plain' });
            res.end(`Upstream error: ${resp.status}`);
            return;
          }
          const contentType = resp.headers.get('content-type') || 'image/jpeg';
          const buffer = Buffer.from(await resp.arrayBuffer());
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': buffer.length.toString(),
          });
          res.end(buffer);
        } catch {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Fetch failed');
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), imageFetchProxy()],
  base: mode === 'production' ? '/Clothing-planner-v3/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'framer': ['framer-motion'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
}))
