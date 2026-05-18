import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Split vendor chunks so the browser can cache React/libs separately from app code
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime – rarely changes, cached aggressively by browser
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Data-fetching layer
          'vendor-query': ['@tanstack/react-query'],
          // UI component library
          'vendor-ui':    ['@radix-ui/react-dialog', '@radix-ui/react-tooltip', 'lucide-react'],
        },
      },
    },
    // Warn if any chunk exceeds 600 kB (down from default 500 kB – we're consciously splitting)
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging (optional, remove to shrink build)
    sourcemap: false,
    // Minify with esbuild (default + fast)
    minify: 'esbuild',
    target: 'es2017',
  },
}));