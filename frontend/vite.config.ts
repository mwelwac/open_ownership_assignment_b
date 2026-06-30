import path from "node:path";
import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const djangoPort = process.env.VITE_DJANGO_PORT ?? "8000";
const djangoOrigin = `http://localhost:${djangoPort}`;
const djangoProxy: ProxyOptions = {
  target: djangoOrigin,
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on("proxyReq", (request) => request.setHeader("origin", djangoOrigin));
  },
};

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === "build" ? "/static/frontend/" : "/",
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": djangoProxy,
      "/admin": djangoProxy,
      "/media": djangoProxy,
      "/static": djangoProxy,
    },
  },
  build: {
    outDir: "../backend/static/frontend",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router-dom") ||
            id.includes("node_modules/@remix-run") ||
            id.includes("node_modules/scheduler")
          ) {
            return "vendor-react";
          }
          return "vendor";
        },
      },
    },
  },
}));
