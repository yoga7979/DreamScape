import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

const server = createServer(async (req, res) => {
  const requestPath = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname;
  const relativePath = requestPath === '/manus-routes.json' ? '/public/manus-routes.json' : (requestPath === '/' ? '/index.html' : requestPath);
  const safePath = normalize(relativePath);
  const filePath = join(root, safePath);
  if (!filePath.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
  try {
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});
server.listen(port, '0.0.0.0', () => console.log(`DreamScape listening on ${port}`));
