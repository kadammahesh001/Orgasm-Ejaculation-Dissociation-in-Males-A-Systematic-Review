// Simple HTTP server for the research paper website
// Run: node server.js
// Then open: http://localhost:8080

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DIR = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url === '/' ? '/index.html' : req.url);
  const filePath = path.join(DIR, url);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404); res.end('Not found');
    return;
  }

  const ext = path.extname(filePath);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
  });
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log(`\n  Research Paper Website running at:\n`);
  console.log(`  ➜  http://localhost:${PORT}\n`);
  console.log(`  Press Ctrl+C to stop.\n`);
});
