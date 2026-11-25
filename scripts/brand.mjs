// Puts a logo into every place the app shows it.
//
//   npm run brand                      rebuild from brand/logo.svg
//   npm run brand -- path/to/new.svg   take a new master first
//
// Needs `npx wrangler login`. See "Logo and icons" in CLAUDE.md.
import { createHash } from "crypto";
import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BRAND = path.join(ROOT, "brand");
const BUCKET = "ministry-mapper-assets";
const HOST = "https://assets.ministry-mapper.com";
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const WRANGLER = ["-y", "wrangler@4"];
const TYPES = {
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};
// Everything uploaded: the master, the tab icon built from it, and what the
// icon generator writes (see pwa-assets.config.js).
const FILES = [
  "logo.svg",
  "favicon.svg",
  "favicon.ico",
  "apple-touch-icon-180x180.png",
  "maskable-icon-512x512.png",
  "pwa-64x64.png",
  "pwa-192x192.png",
  "pwa-512x512.png"
];
// Google shows this on its "Sign in with Google" screen. It is uploaded by hand
// in Google Cloud, not to R2: square, 120 px, under 1 MB.
const GOOGLE_LOGO = "google-oauth-logo-120x120.png";
// Every file that names the folder. release.json is what the app imports.
const POINTERS = ["index.html", "public/site.webmanifest"];

const fail = (message) => {
  console.error(`\n✘ ${message}`);
  process.exit(1);
};
const step = (message) => console.log(`• ${message}`);
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf-8");
const write = (file, text) => fs.writeFileSync(path.join(ROOT, file), text);

const run = (args, options = {}) =>
  spawnSync("npx", args, { cwd: ROOT, encoding: "utf-8", ...options });

// The master has to scale cleanly to every size and convert the same way in
// every tool: plain shapes in a square frame, nothing loaded or scripted.
function checkMaster(svg) {
  const problems = [
    [/<image\b/i, "an embedded picture (Figma's Fill: Image)"],
    [/<pattern\b/i, "a pattern fill, often an embedded picture"],
    [/<filter\b/i, "a filter, such as a shadow or blur"],
    [/<mask\b/i, "a mask"],
    [/<(script|foreignObject|style)\b/i, "a script, style or HTML block"],
    [/\son[a-z]+\s*=/i, "an event handler"],
    [/(xlink:)?href\s*=\s*["'](?!#)/i, "a link to another file"]
  ]
    .filter(([pattern]) => pattern.test(svg))
    .map(([, problem]) => problem);
  const viewBox = svg.match(/<svg\b[^>]*\bviewBox\s*=\s*["']([^"']+)["']/i);
  const [, , width, height] = (viewBox?.[1] ?? "").trim().split(/[\s,]+/);
  if (!viewBox) problems.push("no viewBox on the <svg> element");
  else if (Number(width) !== Number(height))
    problems.push(`a frame that is not square (${width} × ${height})`);
  if (problems.length > 0)
    fail(
      `The logo has ${problems.join(", ")}.\n  Export flat shapes in a square frame from Figma, with "Outline text" on.`
    );
  return viewBox[1].trim();
}

// The tab icon: the master on the logo's tile, which turns dark with the device.
function buildFavicon(svg, viewBox, tile) {
  const inner = svg
    .slice(
      svg.indexOf(">", svg.search(/<svg\b/i)) + 1,
      svg.lastIndexOf("</svg>")
    )
    .trim();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Built from logo.svg by npm run brand. Edit logo.svg, not this file. -->
  <style>
    .tile { fill: ${tile.light}; }
    @media (prefers-color-scheme: dark) {
      .tile { fill: ${tile.dark}; }
    }
  </style>
  <rect class="tile" width="100" height="100" rx="22"/>
  <svg x="5" y="5" width="90" height="90" viewBox="${viewBox}">
    ${inner}
  </svg>
</svg>
`;
}

function wrangler(args) {
  return run([...WRANGLER, ...args]);
}

// R2 is read directly rather than through the domain: Cloudflare caches a
// 404 for a few minutes, so asking the domain first would hide the upload.
function inBucket(key, file) {
  const copy = path.join(
    os.tmpdir(),
    `mm-brand-${process.pid}-${path.basename(key)}`
  );
  const result = wrangler([
    "r2",
    "object",
    "get",
    `${BUCKET}/${key}`,
    "--file",
    copy,
    "--remote"
  ]);
  const same =
    result.status === 0 &&
    fs.existsSync(copy) &&
    fs.readFileSync(copy).equals(fs.readFileSync(file));
  fs.rmSync(copy, { force: true });
  return same;
}

async function main() {
  const source = process.argv[2];
  const brand = JSON.parse(read("brand/brand.json"));

  if (source) {
    if (!fs.existsSync(source)) fail(`No file at ${source}.`);
    checkMaster(fs.readFileSync(source, "utf-8"));
    fs.copyFileSync(source, path.join(BRAND, "logo.svg"));
    step(`Took ${source} as brand/logo.svg`);
  }
  const master = read("brand/logo.svg");
  const viewBox = checkMaster(master);
  step("Checked the master: plain shapes in a square frame");

  write("brand/favicon.svg", buildFavicon(master, viewBox, brand.tile));
  step("Built brand/favicon.svg");

  const generated = run(["pwa-assets-generator"]);
  if (generated.status !== 0)
    fail(`The icon generator failed:\n${generated.stderr || generated.stdout}`);
  step("Generated the iPhone, Android, computer and tab icons");

  // On the sky tile, with room for Google cropping it to a circle.
  const art = await sharp(Buffer.from(master)).resize(76, 76).png().toBuffer();
  const googleLogo = await sharp({
    create: {
      width: 120,
      height: 120,
      channels: 4,
      background: brand.tile.light
    }
  })
    .composite([{ input: art, gravity: "center" }])
    .png()
    .toBuffer();
  const googleChanged = !(
    fs.existsSync(path.join(BRAND, GOOGLE_LOGO)) &&
    fs.readFileSync(path.join(BRAND, GOOGLE_LOGO)).equals(googleLogo)
  );
  fs.writeFileSync(path.join(BRAND, GOOGLE_LOGO), googleLogo);
  step(`Made brand/${GOOGLE_LOGO} for Google's sign-in screen`);

  const hash = createHash("sha256");
  for (const name of FILES)
    hash.update(name).update(fs.readFileSync(path.join(BRAND, name)));
  const folder = `brand/${hash.digest("hex").slice(0, 10)}`;
  const base = `${HOST}/${folder}`;

  const whoami = wrangler(["whoami"]);
  if (
    whoami.status !== 0 ||
    /not authenticated/i.test(whoami.stdout + whoami.stderr)
  )
    fail(
      "Not signed in to Cloudflare. Run `npx wrangler login`, then this again."
    );

  for (const name of FILES) {
    const file = path.join(BRAND, name);
    const key = `${folder}/${name}`;
    if (inBucket(key, file)) {
      step(`${key} already uploaded`);
      continue;
    }
    const put = wrangler([
      "r2",
      "object",
      "put",
      `${BUCKET}/${key}`,
      "--file",
      file,
      "--content-type",
      TYPES[path.extname(name)],
      "--cache-control",
      CACHE_CONTROL,
      "--remote"
    ]);
    if (put.status !== 0 || !inBucket(key, file))
      fail(`Uploading ${key} failed:\n${put.stderr || put.stdout}`);
    step(`Uploaded ${key}`);
  }

  // Cloudflare's Polish re-encodes PNGs, so only the SVG and ICO bytes are
  // expected to match what was uploaded.
  for (const name of FILES) {
    const response = await fetch(`${base}/${name}`);
    const body = Buffer.from(await response.arrayBuffer());
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith(TYPES[path.extname(name)]))
      fail(`${base}/${name} answered ${response.status} ${type}.`);
    if (
      !name.endsWith(".png") &&
      !body.equals(fs.readFileSync(path.join(BRAND, name)))
    )
      fail(`${base}/${name} does not match brand/${name}.`);
  }
  step("Every file loads through Cloudflare");

  const previous = JSON.parse(read("brand/release.json")).folder;
  write("brand/release.json", `${JSON.stringify({ folder }, null, 2)}\n`);
  const pointer = /https:\/\/assets\.ministry-mapper\.com\/brand\/[^/"]+\//g;
  for (const file of POINTERS) {
    const text = read(file);
    if (!text.match(pointer))
      fail(`${file} has no ${HOST}/brand/ address to update.`);
    write(file, text.replace(pointer, `${base}/`));
  }
  step(`Pointed the app at ${folder}`);

  console.log(
    previous === folder
      ? "\n✔ Nothing changed: this logo is already live in the app."
      : `\n✔ The app now uses ${base}/
  Next: npm test, check the logo in npm start, then commit brand/, index.html
  and public/site.webmanifest.
  Keep ${previous} on R2 until well after the release: phones running an older
  copy of the app still ask for it.`
  );
  if (googleChanged)
    console.log(`
  Google's sign-in screen still shows the old logo. Upload brand/${GOOGLE_LOGO}
  in Google Cloud: Google Auth Platform → Branding → App logo. A verified app
  may need Google to review the change.`);
}

main().catch((error) => fail(error.stack ?? String(error)));
