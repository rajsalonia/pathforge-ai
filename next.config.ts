import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/code-worker.js', headers: [{ key: 'Content-Security-Policy', value: "default-src 'none'; script-src 'unsafe-eval'; connect-src 'none'; worker-src 'none'; object-src 'none'" }] },
    { source: '/:path*', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}] }];
  },
};

export default nextConfig;
