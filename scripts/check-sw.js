import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// A SW that waits instead of taking over keeps clients on the old build.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sw = fs.readFileSync(path.join(__dirname, "../build/sw.js"), "utf-8");

// Workbox emits the SKIP_WAITING message handler only when skipWaiting is off.
if (!sw.includes("clients.claim()") || sw.includes("SKIP_WAITING")) {
  console.error("build/sw.js must set workbox skipWaiting and clientsClaim");
  process.exit(1);
}
