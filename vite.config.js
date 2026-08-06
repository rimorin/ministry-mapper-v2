import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(() => {
  const isProduction = process.env.NODE_ENV === "production";
  const isCI = !!process.env.CI;
  const isAnalyze = !!process.env.ANALYZE;

  return {
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version)
    },
    build: {
      target: "esnext",
      outDir: "build",
      sourcemap: "hidden",
      rollupOptions: {
        output: {
          // Rolldown's native chunking API. Do NOT switch back to a
          // manualChunks() function: Rolldown's emulation of it mis-assigns
          // react/react-dom/jsx-runtime into vendor-base-ui, which drags the
          // entire ~87 kB-gzip Base UI chunk onto the initial preload path.
          // Explicit priorities guarantee react wins every overlapping match.
          advancedChunks: {
            groups: [
              // React core — ultra-stable, isolated for long-term caching.
              // Highest priority so no other group can ever capture it.
              {
                name: "vendor-react",
                test: /node_modules\/(react|react-dom|scheduler)\//,
                priority: 100
              },
              // Sentry SDK — large SDK, independent release cadence
              {
                name: "vendor-sentry",
                test: /node_modules\/@sentry\//,
                priority: 90
              },
              // i18n stack — separate change cadence from react
              { name: "vendor-i18n", test: /i18next/, priority: 80 },
              // PocketBase SDK — monolithic (no tree-shaking), separate for cache granularity
              {
                name: "vendor-pocketbase",
                test: /node_modules\/pocketbase\//,
                priority: 80
              },
              // nice-modal is imported at app entry (Provider) — keep it tiny and isolated
              // so vendor-ui is NOT pulled into the initial modulepreload chain
              {
                name: "vendor-nice-modal",
                test: /nice-modal-react/,
                priority: 80
              },
              // Base UI toast subtree + the shared helpers it imports — the Toaster
              // is mounted at app entry, so this must stay separate from the big
              // vendor-base-ui chunk to keep it off the initial preload path
              {
                name: "vendor-base-ui-toast",
                test: /node_modules\/@base-ui\/utils\/|node_modules\/@base-ui\/react\/(esm\/)?(toast|internals|utils|button|merge-props|use-render)\/|node_modules\/@base-ui\/react\/(esm\/)?floating-ui-react\/utils|node_modules\/@floating-ui\/utils\//,
                priority: 80
              },
              // Base UI + floating-ui — lazy (only loads when first modal/dialog opens)
              {
                name: "vendor-base-ui",
                test: /@base-ui\/react|@base-ui\/utils|@floating-ui/,
                priority: 70
              },
              // Form validation stack — all form modals are React.lazy(), never on critical path
              {
                name: "vendor-forms",
                test: /node_modules\/(zod|react-hook-form|@hookform)\//,
                priority: 70
              },
              // Icons — own release cadence, tree-shaking confirmed working (~50 icons used)
              {
                name: "vendor-icons",
                test: /node_modules\/lucide-react\//,
                priority: 70
              },
              // Calendar — react-day-picker + date-fns; only used in lazy-loaded modals
              {
                name: "vendor-calendar",
                test: /node_modules\/(react-day-picker|date-fns|@date-fns)\//,
                priority: 70
              },
              // Map UI + virtualization — dnd-kit, react-window
              {
                name: "vendor-ui",
                test: /@dnd-kit|react-window/,
                priority: 70
              },
              // Leaflet mapping stack
              { name: "vendor-mapping", test: /leaflet/, priority: 70 },
              // Everything else from node_modules (wouter, idb, clsx, cva, etc.)
              { name: "vendor-libs", test: /node_modules/, priority: 10 }
            ]
          }
        }
      }
    },
    server: {
      port: 3000
    },
    plugins: [
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] }),
      react(),
      isAnalyze && visualizer(),
      isProduction &&
        sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          telemetry: false,
          release: {
            name: process.env.npm_package_version
          },
          bundleSizeOptimizations: {
            excludeDebugStatements: true,
            excludeTracing: true,
            excludeReplayIframe: true,
            excludeReplayShadowDom: true,
            excludeReplayCanvas: true,
            excludeReplayWorker: true
          },
          sourcemaps: {
            filesToDeleteAfterUpload: ["./build/**/*.map"]
          }
        }),
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: "auto",
        // Use the existing site.webmanifest — don't generate a new one
        manifest: false,
        workbox: {
          globPatterns: ["**/*.{js,css,html}"],
          // Exclude translation chunks from precache — they are large (~18–42 kB each)
          // and users only ever need 1 language. Runtime CacheFirst handles them instead.
          globIgnores: ["**/translation-*.js"],
          navigateFallback: "/index.html",
          // Prevent the SW from intercepting direct file navigations (e.g. .json,
          // .webmanifest, .ico) and serving index.html in their place.
          navigateFallbackDenylist: [/\.[a-z]{2,6}$/i],
          inlineWorkboxRuntime: true,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Cache translation chunks on first use; keep up to 4 (covers language
              // switching) and expire after 30 days to pick up translation updates.
              urlPattern: /\/assets\/translation-[^/]+\.js$/,
              handler: "CacheFirst",
              options: {
                cacheName: "translations",
                expiration: {
                  maxEntries: 4,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: false
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    }
  };
});
