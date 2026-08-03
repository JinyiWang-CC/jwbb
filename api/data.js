// Vercel Serverless Function — 纯代理转发到 Cloudflare Worker
// 解决国内部分运营商屏蔽 *.workers.dev 域名的问题

const TARGET = 'https://jwbb-api.jinyiwang109.workers.dev';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url);
  // /api/* -> /*  (去掉 /api 前缀)
  let path = url.pathname.replace(/^\/api/, '');
  if (!path) path = '/';
  const targetUrl = TARGET + path + (url.search || '');

  try {
    const headers = {};
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    const fetchOptions = { method: req.method, headers };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      if (typeof req.body === 'string') {
        fetchOptions.body = req.body;
      } else if (req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }
    }

    const resp = await fetch(targetUrl, fetchOptions);
    const data = await resp.text();
    return res.status(resp.status).setHeader('Content-Type', 'application/json').send(data);
  } catch (e) {
    return res.status(502).json({ error: 'proxy_failed', detail: e.message });
  }
}
