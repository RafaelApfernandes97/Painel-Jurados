import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@legacy": path.resolve(__dirname, "../../frontend/src"),
      "lucide-react": path.resolve(__dirname, "node_modules/lucide-react"),
      "axios": path.resolve(__dirname, "node_modules/axios"),
      "socket.io-client": path.resolve(__dirname, "node_modules/socket.io-client"),
      "@dnd-kit/core": path.resolve(__dirname, "node_modules/@dnd-kit/core"),
      "@dnd-kit/sortable": path.resolve(__dirname, "node_modules/@dnd-kit/sortable"),
      "@dnd-kit/utilities": path.resolve(__dirname, "node_modules/@dnd-kit/utilities")
    }
  },
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, "../..")]
    }
  }
});
