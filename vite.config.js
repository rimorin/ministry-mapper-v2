import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { visualizer } from "rollup-plugin-visualizer";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import TurboConsole from "unplugin-turbo-console/vite";
export default defineConfig(() => {
  return {
    build: {
      outDir: "build",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router", "react-router-dom"],
            rollbar: ["rollbar"],
            gmaps: ["@vis.gl/react-google-maps"],
            posthog: ["posthog-js"]
          }
        },
        onwarn(warning, defaultHandler) {
          if (warning.code === "SOURCEMAP_ERROR") {
            return;
          }

          defaultHandler(warning);
        }
      }
    },
    server: {
      port: 3000,
      host: true
    },
    plugins: [
      react(),
      svgr(),
      visualizer(),
      ViteImageOptimizer(),
      TurboConsole()
    ]
  };
});
