import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import TurboConsole from "unplugin-turbo-console/vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(() => {
  return {
    build: {
      outDir: "build",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Large vendors get their own chunks
            if (id.includes("node_modules/@sentry")) return "vendor-sentry";
            if (
              id.includes("node_modules/react-bootstrap") ||
              id.includes("node_modules/bootstrap")
            )
              return "vendor-bootstrap";
            if (
              id.includes("node_modules/react-select") ||
              id.includes("node_modules/@dnd-kit") ||
              id.includes("node_modules/react-calendar") ||
              id.includes("node_modules/react-countdown") ||
              id.includes("node_modules/react-password-checklist") ||
              id.includes("node_modules/react-countdown") ||
              id.includes("node_modules/ebay/nice-modal-react")
            )
              return "vendor-ui";

            // Everything else from node_modules
            if (id.includes("node_modules")) {
              return "vendor-libs";
            }
          }
        }
      }
    },
    server: {
      port: 3000
    },
    plugins: [
      react({
        babel: {
          plugins: ["babel-plugin-react-compiler"]
        }
      }),
      visualizer(),
      TurboConsole(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: false,
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                url.origin === "https://assets.ministry-mapper.com",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "external-assets",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7
                }
              }
            },
            {
              urlPattern: ({ request }) => request.destination === "font",
              handler: "CacheFirst",
              options: {
                cacheName: "fonts",
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            }
          ],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/]
        }
      })
    ],
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: [
            "import",
            "color-functions",
            "global-builtin",
            "legacy-js-api"
          ]
        }
      }
    }
  };
});
