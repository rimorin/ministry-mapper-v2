import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import TurboConsole from "unplugin-turbo-console/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import packageJson from "./package.json";

export default defineConfig(() => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version)
    },
    build: {
      outDir: "build",
      sourcemap: "hidden",
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Large vendors get their own chunks
            if (id.includes("sentry")) return "vendor-sentry";
            if (id.includes("react-bootstrap") || id.includes("bootstrap"))
              return "vendor-bootstrap";

            // React core — ultra-stable, isolated for long-term caching
            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/scheduler/")
            )
              return "vendor-react";

            // i18n stack — separate change cadence from react
            if (id.includes("i18next") || id.includes("react-i18next"))
              return "vendor-i18n";

            // nice-modal is imported at app entry (Provider) — keep it tiny and isolated
            // so vendor-ui is NOT pulled into the initial modulepreload chain
            if (id.includes("nice-modal-react")) return "vendor-nice-modal";

            if (
              id.includes("react-select") ||
              id.includes("@dnd-kit") ||
              id.includes("react-calendar") ||
              id.includes("react-window")
            )
              return "vendor-ui";

            if (id.includes("leaflet")) {
              return "vendor-mapping";
            }

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
      ...(isProduction
        ? [
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
            })
          ]
        : [])
    ],
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: [
            "import",
            "color-functions",
            "global-builtin",
            "legacy-js-api",
            "if-function"
          ]
        }
      }
    }
  };
});
