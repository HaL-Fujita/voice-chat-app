const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

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
      hasKey: !!ANTHROPIC_API_KEY 
    }));
    return;
  }

  // API Proxy to Anthropic
  if (req.url === '/api/chat' && req.method === 'POST') {
    console.log('📥 Received chat request');
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      proxyToAnthropic(body, res);
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

function proxyToAnthropic(body, res) {
  try {
    // Parse incoming request (OpenAI format)
    const reqData = JSON.parse(body);
    
    // Convert to Anthropic format
    const anthropicBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: 'あなたは「オールイン番長」です。親しみやすく、時にユーモラスに会話してください。',
      messages: reqData.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    };

    const postData = JSON.stringify(anthropicBody);
    console.log('📤 Sending to Anthropic');

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      console.log('📥 Anthropic response status:', proxyRes.statusCode);
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        try {
          // Convert Anthropic response to OpenAI format
          const anthropicRes = JSON.parse(data);
          
          if (anthropicRes.error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: anthropicRes.error }));
            return;
          }

          const openaiFormat = {
            choices: [{
              message: {
                role: 'assistant',
                content: anthropicRes.content?.[0]?.text || ''
              }
            }]
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(openaiFormat));
        } catch (e) {
          console.error('❌ Parse error:', e);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Parse error', raw: data }));
        }
      });
    });

    proxyReq.on('error', (e) => {
      console.error('❌ Proxy error:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy error', message: e.message }));
    });

    proxyReq.write(postData);
    proxyReq.end();
  } catch (e) {
    console.error('❌ Setup error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Setup error', message: e.message }));
  }
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Anthropic API: ${ANTHROPIC_API_KEY ? 'configured' : 'NOT SET'}`);
});
