import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 9360);
const startedAt = new Date().toISOString();

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, pid: process.pid, startedAt }));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('botmux plugin template service\n');
});

server.listen(port, '0.0.0.0');

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

