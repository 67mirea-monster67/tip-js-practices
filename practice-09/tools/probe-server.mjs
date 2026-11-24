import http from 'node:http';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('./http-probe.html', import.meta.url));
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(html);
}).listen(5519, '127.0.0.1', () => console.log('Проверка API: http://127.0.0.1:5519'));
