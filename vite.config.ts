import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      viteSingleFile(),
      {
        name: 'gas-bundle-server',
        configureServer(server) {
          server.middlewares.use('/api/gas-bundle', (req, res) => {
            const bundlePath = path.resolve(__dirname, 'dist', 'index.html');
            if (fs.existsSync(bundlePath)) {
              const html = fs.readFileSync(bundlePath, 'utf-8');
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(html);
            } else {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Bundle not found' }));
            }
          });

          server.middlewares.use('/api/download-gas-html', (req, res) => {
            const bundlePath = path.resolve(__dirname, 'dist', 'index.html');
            if (fs.existsSync(bundlePath)) {
              const html = fs.readFileSync(bundlePath, 'utf-8');
              res.setHeader('Content-Disposition', 'attachment; filename="Index.html"');
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(html);
            } else {
              res.statusCode = 404;
              res.end('Not built yet');
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
