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

// Supported locale codes — must match LanguageContext.tsx LANGUAGE_OPTIONS.
const SUPPORTED_LOCALES = ["en", "es", "zh", "ta", "id", "ms", "ja", "ko"];

// Parse a single RELEASE_NOTES[.lang].md file into a map of id → entry.
// Header format: ## YYYY-MM-DD[-suffix]
// Returns: Map<id, { notice, items: [{ type, text, description? }] }>
function parseReleaseNotesFile(filePath) {
  if (!fs.existsSync(filePath)) return new Map();

  const raw = fs.readFileSync(filePath, "utf-8");
  // Strip code-fenced blocks so examples in the instructions aren't parsed as releases.
  const content = raw.replace(/^```[\s\S]*?^```/gm, "");

  const TYPE_MAP = {
    NEW: "new",
    FIX: "fix",
    IMPROVED: "improved",
    ANNOUNCEMENT: "announcement"
  };

  const result = new Map();
  const blocks = content.split(/^(?=## \d{4}-\d{2}-\d{2})/m).filter(Boolean);

  for (const block of blocks) {
    const headerMatch = block.match(/^## (\d{4}-\d{2}-\d{2}(?:-[a-z0-9]+)?)/);
    if (!headerMatch) continue;

    const [, id] = headerMatch;
    let notice = null;
    let screenshot = null;
    const items = [];
    let currentItem = null;
    let descLines = [];
    let seenBlank = false;

    const flushDesc = () => {
      if (currentItem && descLines.length > 0) {
        while (descLines[descLines.length - 1] === "") descLines.pop();
        if (descLines.length > 0)
          currentItem.description = descLines.join("\n");
      }
      descLines = [];
      seenBlank = false;
    };

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

      const itemMatch = line.match(
        /^\[(NEW|FIX|IMPROVED|ANNOUNCEMENT)\]\s+(.+)/
      );
      if (itemMatch) {
        flushDesc();
        currentItem = {
          type: TYPE_MAP[itemMatch[1]],
          text: itemMatch[2].trim()
        };
        items.push(currentItem);
        continue;
      }

      if (line.startsWith("  ") && currentItem) {
        if (seenBlank && descLines.length > 0) descLines.push("");
        descLines.push(line.slice(2));
        seenBlank = false;
      } else {
        seenBlank = !line.trim();
      }
    }
    flushDesc();

    if (items.length || notice) {
      result.set(id, { notice, screenshot, items });
    }
  }

  return result;
}

// Build the changelog by parsing the English base file then merging all
// available per-locale translations. Fields that have at least one translation
// are promoted from plain strings to locale maps { en: "…", zh: "…", … }.
// Entries with no translations remain plain strings (backward compatible).
function buildChangelog() {
  const notesDir = path.join(__dirname, "../release-notes");

  // Parse English base (required).
  const enEntries = parseReleaseNotesFile(
    path.join(notesDir, "RELEASE_NOTES.md")
  );
  if (enEntries.size === 0) return { releases: [] };

  // Parse all available locale files.
  const localeEntries = new Map(); // lang → Map<id, entry>
  for (const lang of SUPPORTED_LOCALES) {
    if (lang === "en") continue;
    const filePath = path.join(notesDir, `RELEASE_NOTES.${lang}.md`);
    const entries = parseReleaseNotesFile(filePath);
    if (entries.size > 0) localeEntries.set(lang, entries);
  }

  const releases = [];

  for (const [id, enEntry] of enEntries) {
    // Collect all locales that have a translation for this release id.
    const availableLocales = [...localeEntries.entries()].filter(([, map]) =>
      map.has(id)
    );

    if (availableLocales.length === 0) {
      // No translations at all — keep plain strings.
      releases.push({ id, ...enEntry });
      continue;
    }

    // Promote notice to a locale map when any translation exists.
    let notice = null;
    if (enEntry.notice !== null) {
      notice = { en: enEntry.notice };
      for (const [lang, map] of availableLocales) {
        const t = map.get(id);
        if (t?.notice) notice[lang] = t.notice;
      }
    }

    // Promote each item's text/description to locale maps.
    const items = enEntry.items.map((enItem, idx) => {
      const textMap = { en: enItem.text };
      const descMap = enItem.description ? { en: enItem.description } : null;

      for (const [lang, map] of availableLocales) {
        const t = map.get(id);
        const tItem = t?.items[idx];
        if (!tItem) continue;
        textMap[lang] = tItem.text;
        if (descMap && tItem.description) descMap[lang] = tItem.description;
      }

      const item = { type: enItem.type, text: textMap };
      if (descMap) item.description = descMap;
      return item;
    });

    releases.push({ id, notice, screenshot: enEntry.screenshot, items });
  }

  // Sort newest-first so releases[0] is always the latest.
  releases.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  return { releases: releases.slice(0, 10) };
}

fs.writeFileSync(
  path.join(__dirname, "../public/changelog.json"),
  JSON.stringify(buildChangelog(), null, 2)
);
