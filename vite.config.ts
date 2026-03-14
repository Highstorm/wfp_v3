import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/openfoodfacts": {
        target: "https://search.openfoodfacts.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openfoodfacts/, ""),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "firebase-vendor": [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/ai",
          ],
          "ui-vendor": [
            "@headlessui/react",
          ],
        },
      },
    },
  },
});
