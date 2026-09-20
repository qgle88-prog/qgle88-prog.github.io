/**
 * 本地预览服务器 —— 只用来本地看构建结果，不参与线上部署。
 * 用法:  node build/serve.mjs  [端口]
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, '_site');
const PORT = Number(process.argv[2] || 8899);

if (!fs.existsSync(SITE)) {
  console.error('找不到 _site/。请先运行: npm run build');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.yml': 'text/yaml; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(SITE, p);

    // 目录 → index.html；不存在 → 404.html
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const fallback = path.join(SITE, '404.html');
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.existsSync(fallback) ? fs.readFileSync(fallback) : 'Not found');
      console.log(`  404  ${p}`);
      return;
    }

    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(fs.readFileSync(file));
    console.log(`  200  ${p}`);
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`\n本地预览: http://127.0.0.1:${PORT}\nCtrl+C 停止\n`);
  });
