import source from '@/public/code-worker.js?raw';
export async function GET(){return new Response(source,{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-eval'; connect-src 'none'; worker-src 'none'; object-src 'none'"}});}
