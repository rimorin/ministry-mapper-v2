---
paths:
  - "brand/**"
  - "scripts/brand.mjs"
  - "pwa-assets.config.js"
  - "public/site.webmanifest"
  - "src/utils/brand.test.ts"
---

# Logo and icons

- `npm run brand -- path/to/new.svg` (or `npm run brand` to rebuild from the current one); don't do its steps by hand. `scripts/brand.mjs` checks the SVG, copies it to `brand/logo.svg`, builds `brand/favicon.svg` from it, runs the icon generator (`pwa-assets.config.js`), uploads `brand/` to R2 under a folder named from a fingerprint of the files, verifies every file through Cloudflare, then writes the folder to `brand/release.json` and into `index.html` and `public/site.webmanifest`. Rerunning with the same logo changes nothing. Afterwards run the tests, look at the logo, and commit.
- `brand/logo.svg` is the only drawing: flat shapes in a square frame on a transparent background, no embedded images, filters, masks or styles (the script refuses them). `brand/favicon.svg` is generated; don't edit it. `AppLogo` shows `brand/logo.svg` with no tile (imported directly and inlined into the bundle), so the drawing must read on light and dark backgrounds. The tile colours in `brand/brand.json` are only for the icons that need a solid background: Home Screen, tab and Google sign-in.
- Files are served from R2 (bucket `ministry-mapper-assets`, `https://assets.ministry-mapper.com`, behind Cloudflare). `BRAND_URL` in `src/utils/constants.ts` comes from `brand/release.json`; `src/utils/brand.test.ts` fails if `index.html`, the manifest or the favicon fall out of step with `brand/`.
- The script needs the user signed in with `npx wrangler login`, and runs Node with `--use-system-ca` because this Mac's network re-signs TLS. Never overwrite or delete a published folder: Cloudflare and phones cache them, and phones running an older copy of the app keep requesting the old folder for months. Check Cloudflare's request analytics before deleting anything from the bucket.
- Home Screen icons are copied onto the device when the app is added, so people see a new one only after removing and re-adding the app.
- The script also writes `brand/google-oauth-logo-120x120.png`, which is not uploaded anywhere: the user uploads it by hand in Google Cloud (Google Auth Platform → Branding → App logo) for the "Sign in with Google" screen, and a verified app may need Google to review it.
