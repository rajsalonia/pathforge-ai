import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
const repository = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: `${repository}/public`,
  plugins: [react()],
  resolve: { alias: { "@": repository } },
  server: {
    host: "127.0.0.1",
    port: 5183,
    strictPort: true,
    fs: { allow: [repository] },
    // Only the real isolated runner is proxied. This harness never writes to an account.
    proxy: {
      "/api/runner": { target: "http://127.0.0.1:5173", changeOrigin: true },
    },
  },
  build: {
    outDir: `${repository}/outputs/ui-workspace-test-build`,
    emptyOutDir: true,
  },
});
