import { readFileSync } from "fs";
import {
  defineConfig,
  minimal2023Preset as preset
} from "@vite-pwa/assets-generator/config";

// Run through `npm run brand`, which also uploads the icons to R2 and points
// the app at them. See "Logo and icons" in CLAUDE.md.
const { tile } = JSON.parse(readFileSync("brand/brand.json", "utf-8"));

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...preset,
    // The art fills about 72% of the tile.
    apple: {
      ...preset.apple,
      padding: 0.24,
      resizeOptions: { background: tile.light }
    },
    // Keeps the art inside the circle Android may cut the icon to.
    maskable: {
      ...preset.maskable,
      padding: 0.41,
      resizeOptions: { background: tile.light }
    }
  },
  images: ["brand/logo.svg"]
});
