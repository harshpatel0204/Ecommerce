import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// In production FE + BE share one Vercel domain, so the app calls "/api" directly.
// In local dev, proxy "/api" to the FastAPI server so the same relative paths work.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        // 127.0.0.1, not localhost: Node can resolve localhost to ::1 (IPv6)
        // while uvicorn binds 127.0.0.1 only, causing intermittent ERR_NETWORK.
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
