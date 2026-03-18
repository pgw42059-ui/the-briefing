import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      injectRegister: 'script-defer',
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "og-image.png"],
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
      // manifest는 public/manifest.json을 단일 진실의 원천으로 사용
      // index.html에서 <link rel="manifest" href="/manifest.json" /> 직접 참조
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks: {
          
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'radix-ui': ['@radix-ui/react-tabs', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-toast', '@radix-ui/react-collapsible', '@radix-ui/react-select', '@radix-ui/react-switch', '@radix-ui/react-slider', '@radix-ui/react-tooltip', '@radix-ui/react-scroll-area'],
          'query': ['@tanstack/react-query'],
          'date-fns': ['date-fns'],
          'sonner': ['sonner'],
          'lucide': ['lucide-react'],
        },
      },
    },
  },
}));
