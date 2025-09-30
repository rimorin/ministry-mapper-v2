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
          manualChunks: {
            react: ["react", "react-dom"],
            sentry: ["@sentry/react"],
            gmaps: ["@vis.gl/react-google-maps"],
            pocketbase: ["pocketbase"],
            routing: ["wouter"]
          }
        }
      }
    },
    server: {
      port: 3000
    },
    plugins: [
      react(),
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
            "mixed-decls",
            "color-functions",
            "global-builtin",
            "legacy-js-api"
          ]
        }
      }
    }
  };
});
