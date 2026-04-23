# Release Notes

User-facing release notes for Ministry Mapper. These are shown to users in-app when a new release is detected.

---

## How to add a release

1. Add a new `## YYYY-MM-DD` section at the **top** of the file (below this header).
2. Add one or more tagged items describing what changed.
3. Optionally add a screenshot, a notice banner, and description body text.

### Adding translations

Release content is i18n-supported. At build time, `scripts/prebuild.js` reads this file (English source) and all companion locale files in this folder, then merges them into `public/changelog.json`. The modal resolves the right language at render time based on the user's selected language.

Each locale has its own companion file in this folder:

| File                    | Language         |
|-------------------------|------------------|
| `RELEASE_NOTES.md`      | English (source) |
| `RELEASE_NOTES.zh.md`   | 中文             |
| `RELEASE_NOTES.ms.md`   | Bahasa Melayu    |
| `RELEASE_NOTES.ta.md`   | தமிழ்            |
| `RELEASE_NOTES.ko.md`   | 한국어           |
| `RELEASE_NOTES.ja.md`   | 日本語           |
| `RELEASE_NOTES.id.md`   | Bahasa Indonesia |
| `RELEASE_NOTES.es.md`   | Español          |

**Rules for translators:**

- The `## YYYY-MM-DD` section header and `[TAG]` markers must match this file exactly — only the text content is translated.
- Items are matched to English by **array index** (position order). Keep the same number of `[TAG]` items per release, in the same order.
- Translations are **optional per entry**. Any release not in a companion file shows English automatically. You don't need to translate every release.
- Notice banners (`> …`) and description bodies are translatable. Screenshots must only be added to this file — they are locale-independent and ignored in companion files.
- Section header lines inside a description body (lines ending with `:` or `：`) are rendered as styled labels in the modal. Use the appropriate punctuation for your language — both ASCII `:` and full-width `：` are supported.

---

## Syntax reference

### Tags

Each item must start with a tag on its own line:

```
[NEW] Short description of the new feature.
[FIX] Short description of what was fixed.
[IMPROVED] Short description of the improvement.
[ANNOUNCEMENT] Important message for all users.
```

### Description body

Add extra detail under any `[TAG]` item by indenting with **2 spaces**. Supports plain paragraphs and `- ` bullet lists. Blank lines between indented lines create paragraph breaks.

```
[NEW] Short headline for the feature.
  A paragraph explaining it in more detail.

  - Step one
  - Step two

  A closing sentence.
```

### Screenshot

Add one screenshot per release on its own line (not indented). It appears above the item list in the modal.

```
![Alt text](https://assets.ministry-mapper.com/release-notes/YYYY-MM-DD/image.png)
```

> **Only add screenshots in this file (`RELEASE_NOTES.md`).** Screenshots are locale-independent — the same image is shown to all users regardless of language. Screenshot lines in companion locale files are ignored.

### Notice banner

Add a `>` line anywhere in the release block to show a warning banner at the top of the card. Use this for action-required messages only.

```
> Please clear your browser cache before continuing.
```

---

## Example

```
## 2026-04-08

[NEW] Add addresses on the fly — publishers can now add missing addresses directly.
  This is built for congregations that are still building their territory records.

  How to use:
  - At the end of the address list, tap the + card.
  - Enter the property number and any visit details, then tap Create.

![Add address on the fly](https://assets.ministry-mapper.com/release-notes/2026-04-08/image.png)

---

## 2026-04-02

> Please look out for publishers who may need help clearing their browser cache.

[ANNOUNCEMENT] We upgraded our systems. Please make sure your app is on version 1.32 or above.
```

---

## 2026-04-23

> Please do not post map links to public stories or statuses (e.g. WhatsApp Status) — they can be seen by people outside your congregation.

[ANNOUNCEMENT] Please be careful when sharing map links on messaging apps.
  Map links let publishers jump straight into the map without logging in — which means anyone who gets the link can access it, including outsiders. If you accidentally post one publicly, please remove the post immediately and let your conductor or admin know so they can delete the link and send a new one.

[ANNOUNCEMENT] Admins: please consider shortening the link expiry.
  A shorter "lifespan" means that even if a link ends up in the wrong place, it stops working quickly, keeping the window of risk very small.

---

## 2026-04-11

[NEW] Daily summary email for new landed property addresses added by publishers.
  Administrators receive a daily summary of any addresses added in the past 24 hours. Each entry shows who added it and any visit details, making it easy to review and keep records accurate.

> Administrators: please check that email notifications are on and that Ministry Mapper emails aren't going to spam.

![New address digest email](https://assets.ministry-mapper.com/release-notes/2026-04-11/new-addresses-email.png)

---

## 2026-04-08

[NEW] Add addresses on the fly.
  Publishers can now add missing addresses directly while working a landed housing territory link, reducing the surveying burden on the territory servant and service overseer.

  This is built for congregations that are still building their territory records, or have none at all. If you have uncharted territory, you can fill it in as you go — the territory documents itself through actual field work.

  How to use:
  - At the end of the address list, tap the + card.
  - Enter the property number and any visit details, then tap Create.

  The new address is saved immediately and visible to everyone working the same territory in real time.

> New addresses are appended to the end of the list. Only administrators can resequence the list.

![Add address on the fly](https://assets.ministry-mapper.com/release-notes/2026-04-08/add_more_add.png)

---

## 2026-04-02

> Please look out for fellow publishers who may need help clearing their browser cache.

[ANNOUNCEMENT] Please update your app to version 1.32 or above.
  Your browser should update it automatically — if not, clearing your browser cache will fix it. Older versions may not work properly.

[ANNOUNCEMENT] Ministry Mapper must be opened in a web browser.
  Use Chrome, Safari, or any standard browser. Saving it to your home screen or using it as an installed app is not supported — if you have done so, please remove it and open the link in your browser directly.

---

## 2026-03-30

[IMPROVED] Assignment messages now include the publisher's name, and personal slips show the link expiry duration so publishers know how long they have.

---

## 2026-03-27

[NEW] Account warnings — get notified before your account is disabled.
  Inactive accounts are warned at 3 months, a final warning at 5 months, then disabled at 6 months. Accounts with no role assigned are warned on day 3, a final warning on day 6, then disabled on day 7.

[NEW] AI summaries in emails — catch the key points without reading the full content.
  Emails for instructions, messages, notes, and the monthly report now open with an AI-generated summary.

> AI summaries may not always be accurate — please verify before acting on them.

[NEW] On-demand Congregation Report — generate it any time from Congregation → Generate Report.
  The report covers the past 30 days and will be delivered to your inbox shortly after.

[IMPROVED] Faster map updates — territory progress now refreshes more quickly.

[IMPROVED] Scroll position is now remembered on the map listing — the page returns to where you left off when switching apps or navigating back.

---

## 2026-03-11

[NEW] Marker Guide on the map — a small legend in the top-right corner now explains what each coloured ring on an address marker represents.

  - 🟢 Green — Assignment link
  - 🟠 Orange — Personal link
  - 🔵 Blue — Map completion progress

![Marker Guide](https://assets.ministry-mapper.com/release-notes/2026-03-11/marker-guide.png)

---

## 2026-03-03

> App updates are now announced in-app so everyone stays informed, not just those in the WhatsApp channel. WhatsApp will still be used for urgent announcements and support.

[NEW] In-app release notes
