import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8")
);

const versionInfo = {
  version: packageJson.version,
  buildTime: new Date().toISOString()
};

fs.writeFileSync(
  path.join(__dirname, "../public/version.json"),
  JSON.stringify(versionInfo, null, 2)
);

// Parse RELEASE_NOTES.md and emit public/changelog.json (last 10 releases).
// Header format: ## YYYY-MM-DD[-suffix] [— any annotation]
// The id (YYYY-MM-DD or YYYY-MM-DD-a) is the stable identifier used for
// tracking which releases a user has seen — fully decoupled from semver.
function parseReleaseNotes() {
  const releaseNotesPath = path.join(__dirname, "../RELEASE_NOTES.md");
  if (!fs.existsSync(releaseNotesPath)) return { releases: [] };

  const content = fs.readFileSync(releaseNotesPath, "utf-8");
  const releases = [];
  const TYPE_MAP = { NEW: "new", FIX: "fix", IMPROVED: "improved" };

  const blocks = content.split(/^(?=## \d{4}-\d{2}-\d{2})/m).filter(Boolean);

  for (const block of blocks) {
    const headerMatch = block.match(/^## (\d{4}-\d{2}-\d{2}(?:-[a-z0-9]+)?)/);
    if (!headerMatch) continue;

    const [, id] = headerMatch;
    let notice = null;
    let screenshot = null;
    const items = [];

    for (const line of block.split("\n")) {
      const noticeMatch = line.match(/^>\s+(.+)/);
      if (noticeMatch) {
        notice = noticeMatch[1].trim();
        continue;
      }

      const screenshotMatch = line.match(/^!\[.*?\]\((.+?)\)/);
      if (screenshotMatch) {
        screenshot = screenshotMatch[1].trim();
        continue;
      }

      const itemMatch = line.match(/^\[(NEW|FIX|IMPROVED)\]\s+(.+)/);
      if (itemMatch) {
        items.push({ type: TYPE_MAP[itemMatch[1]], text: itemMatch[2].trim() });
      }
    }

    if (items.length || notice) {
      releases.push({ id, notice, screenshot, items });
    }
  }

  // Sort newest-first so releases[0] is always the latest, regardless of
  // the order entries appear in RELEASE_NOTES.md.
  releases.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  return { releases: releases.slice(0, 10) };
}

fs.writeFileSync(
  path.join(__dirname, "../public/changelog.json"),
  JSON.stringify(parseReleaseNotes(), null, 2)
);
