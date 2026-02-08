const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const OPENCLAW_API = process.env.OPENCLAW_API || 'https://clawd-sensei-v2.fly.dev';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '';

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      api: OPENCLAW_API,
      hasToken: !!OPENCLAW_TOKEN 
    }));
    return;
  }

  // API Proxy
  if (req.url === '/api/chat' && req.method === 'POST') {
    console.log('📥 Received chat request');
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      console.log('📤 Proxying to OpenClaw:', OPENCLAW_API);
      proxyToOpenClaw(body, res);
    });
    return;
  }

  // Static files
  let filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

function proxyToOpenClaw(body, res) {
  try {
    const url = new URL(OPENCLAW_API + '/v1/chat/completions');
    console.log('🌐 Target URL:', url.href);
    
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    };
    if (OPENCLAW_TOKEN) {
      headers['Authorization'] = `Bearer ${OPENCLAW_TOKEN}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: headers
    };

    console.log('📡 Request options:', { hostname: options.hostname, path: options.path });

    const proxyReq = https.request(options, (proxyRes) => {
      console.log('📥 Proxy response status:', proxyRes.statusCode);
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        console.log('📥 Proxy response length:', data.length);
        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    });

    proxyReq.on('error', (e) => {
      console.error('❌ Proxy error:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy error', message: e.message }));
    });

    proxyReq.write(body);
    proxyReq.end();
  } catch (e) {
    console.error('❌ Proxy setup error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Setup error', message: e.message }));
  }
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OpenClaw API: ${OPENCLAW_API}`);
});
