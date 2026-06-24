import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Local CORS proxy plugin – fetches URLs server-side so the browser never hits CORS
function urlProxyPlugin() {
  return {
    name: 'url-proxy',
    configureServer(server) {
      server.middlewares.use('/api/scrape', async (req, res) => {
        const url = new URL(req.url, 'http://localhost').searchParams.get('url');
        if (!url) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Missing ?url= parameter' }));
        }
        try {
          const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (StudyQuest Bot)' }
          });
          const html = await response.text();
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ contents: html }));
        } catch (err) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    urlProxyPlugin(),
  ],
})
