import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.svg", "icon-512.svg"],
      manifest: {
        name: "Painel do Jurado",
        short_name: "Jurado",
        description: "Painel mobile para avaliacao ao vivo de coreografias.",
        theme_color: "#020617",
        background_color: "#020617",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@legacy": path.resolve(__dirname, "../../frontend/src"),
      "axios": path.resolve(__dirname, "node_modules/axios"),
      "socket.io-client": path.resolve(__dirname, "node_modules/socket.io-client"),
      "lucide-react": path.resolve(__dirname, "node_modules/lucide-react")
    }
  },
  server: {
    port: 5174,
    allowedHosts: true,
    fs: {
      allow: [path.resolve(__dirname, "../..")]
    }
  }
});
