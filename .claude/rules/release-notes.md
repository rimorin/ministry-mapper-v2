---
paths:
  - "release-notes/**"
  - "scripts/prebuild.js"
---

# Release notes

- `release-notes/RELEASE_NOTES.md` plus `RELEASE_NOTES.<lang>.md` for `es`, `id`, `ja`, `ko`, `ms`, `ta`, `zh` are parsed by `scripts/prebuild.js` into `public/changelog.json` on `prestart` and `prebuild`. An entry added to one language must be added to all eight.
- `useReleaseNotes` shows first-time viewers every entry from the same day together, so keep same-release entries on one date.
