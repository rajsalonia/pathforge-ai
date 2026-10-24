import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
export const runtime = 'nodejs';
export async function GET() {
 const source = await readFile(join(process.cwd(), 'public', 'code-worker.js'), 'utf8');
 return new Response(source, { headers: { 'Content-Type':'text/javascript; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Content-Security-Policy':"default-src 'none'; script-src 'unsafe-eval'; connect-src 'none'; worker-src 'none'; object-src 'none'" } });
}