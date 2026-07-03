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
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
