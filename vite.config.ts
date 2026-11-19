import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Derleme sonunda service worker'a önbelleğe alınacak dosya listesini ve sürümü yazar */
function serviceWorkerManifest() {
  return {
    name: "sw-precache",
    apply: "build" as const,
    closeBundle() {
      const dist = new URL("./dist/", import.meta.url);
      const assets = readdirSync(new URL("assets/", dist)).map((f) => `./assets/${f}`);
      const sw = new URL("sw.js", dist);
      writeFileSync(
        sw,
        readFileSync(sw, "utf8").replace("__VERSION__", Date.now().toString(36)).replace("...__PRECACHE__", assets.map((a) => JSON.stringify(a)).join(", ")),
      );
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), serviceWorkerManifest()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // Netlify geçici klasörü izlenmez (Windows dosya kilidi geliştirme sunucusunu düşürüyordu)
  server: { port: 5173, host: true, watch: { ignored: ["**/.netlify/**"] } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { react: ["react", "react-dom", "zustand"], charts: ["recharts"], icons: ["lucide-react"] },
      },
    },
  },
});
