/**
 * Serves the built site (dist/client) as GitHub Pages does, for the
 * end-to-end tests: `node scripts/serve.ts [port]`.
 */

import { createServer } from 'node:http';
import { join } from 'node:path';

import { serveFile } from './static.ts';

const root = join(import.meta.dirname, '../dist/client');
const port = Number(process.argv[2] ?? 4173);

createServer((request, response) => {
  if (!serveFile(root, request, response))
    response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} on http://127.0.0.1:${port}/`);
});
