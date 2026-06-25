import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function urlProxyPlugin() {
  return {
    name: 'url-proxy',
    configureServer(server) {
      server.middlewares.use('/api/scrape', async (req, res) => {
        const requestedUrl = new URL(req.url, 'http://localhost').searchParams.get('url');
        if (!requestedUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Missing ?url= parameter' }));
        }

        let target;
        try {
          target = new URL(requestedUrl);
          if (!['http:', 'https:'].includes(target.protocol)) {
            throw new Error('Only HTTP and HTTPS URLs are supported');
          }
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: err.message }));
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(target, {
            headers: { 'User-Agent': 'Mozilla/5.0 (StudyQuest Bot)' },
            signal: controller.signal,
          });
          const html = await response.text();
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          return res.end(JSON.stringify({ contents: html }));
        } catch (err) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: err.message }));
        } finally {
          clearTimeout(timeout);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), urlProxyPlugin()],
});
