import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/battlearena/",
  assetsInclude: ['**/*.PNG', '**/*.png'],
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": [
            "framer-motion",
            "@radix-ui/react-dialog",
            "@radix-ui/react-slot",
            "@radix-ui/react-tooltip",
          ],
          "vendor-radix-dapp": ["@radixdlt/radix-dapp-toolkit"],
        },
      },
    },
  },
}));
