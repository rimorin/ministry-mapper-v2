import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import TurboConsole from "unplugin-turbo-console/vite";
export default defineConfig(() => {
  return {
    build: {
      outDir: "build",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            rollbar: ["rollbar"],
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
    plugins: [react(), visualizer(), TurboConsole()],
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
