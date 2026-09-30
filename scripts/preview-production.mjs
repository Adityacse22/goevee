import express from 'express';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve, extname } from 'node:path';
const app = express();
const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
app.use((req, res, next) => {
  for (const { key, value } of config.headers[0].headers) res.setHeader(key, value);
  next();
});
app.use('/api', (_req, res) => res.status(503).json({ error: 'API unavailable in static preview.' }));
app.get(['/contact', '/reset-password'], (_req, res) => res.redirect('/help'));
// Match the compressed delivery used by the production CDN in local speed checks.
app.use((req, res, next) => {
  const root = resolve('dist');
  let file = resolve(root, '.' + req.path);
  if (!file.startsWith(root + '/') && file !== root) { next(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = resolve(file, 'index.html');
  if (req.method === 'GET' && /\.(js|css|html|svg)$/.test(file) && existsSync(file) && req.acceptsEncodings('gzip')) {
    res.type(extname(file)).set('Content-Encoding', 'gzip').set('Vary', 'Accept-Encoding').send(gzipSync(readFileSync(file)));
    return;
  }
  next();
});
app.use(express.static('dist', { redirect: false }));
app.get('*', (req, res) => {
  const route = config.rewrites.find(item => item.source === req.path);
  if (route && existsSync(resolve('dist', '.' + route.destination))) { res.sendFile(resolve('dist', '.' + route.destination)); return; }
  if (/^\/stations\/[^/]+\/?$/.test(req.path)) { res.sendFile(resolve('dist/station.html')); return; }
  res.status(404).sendFile(resolve('dist/404.html'));
});
app.listen(4173, '127.0.0.1', () => console.log('Production preview: http://127.0.0.1:4173'));
