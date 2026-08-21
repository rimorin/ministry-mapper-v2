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

### Audience

By default, an item shows to everyone — administrators/conductors on the admin dashboard, and publishers on the map page. To restrict an item to one side, add `:ADMIN` or `:PUBLISHER` to the tag:

```
[NEW:ADMIN] Only shown on the admin dashboard.
[NEW:PUBLISHER] Only shown on the publisher map page.
```

Use this when an item only makes sense for one audience (e.g. an admin-only setting, or a publisher-only map interaction). If a release ends up with no items for a given audience after filtering, the whole release is skipped for that audience. Notice banners and screenshots always show to both.

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

![Add address on the fly](https://assets.ministry-mapper.com/release-notes/2026-04-08/linkready.png)

---

## 2026-04-02

> Please look out for publishers who may need help clearing their browser cache.

[ANNOUNCEMENT] We upgraded our systems. Please make sure your app is on version 1.32 or above.
```

---

## 2026-08-21

[NEW] Save a house's location while you are standing there.
  Your phone already knows where you are. You can now use that to save an address location with one tap, instead of finding the spot on a map yourself.

  This is for maps of houses. Flats and other buildings share one location, so they do not need it.

  How to use:
  - Open an address and look for Coordinates.
  - Tap "Use my location".
  - To choose the spot yourself instead, tap "On map".

  Addresses with no location saved now show "No pin set", so you can see which ones still need one.

  In Map View, an address with no location does not appear on the map at all, so it is easy to miss. A message now appears at the bottom listing those addresses, and tapping it opens the first one.

  This works without internet. Your phone finds your location on its own, and your change is sent once you are back online.

![Saving a house location from your phone](https://assets.ministry-mapper.com/release-notes/2026-08-21/pin-capture.png)

---

## 2026-08-21-markers

[IMPROVED:ADMIN] Map markers are easier to read.
  In Map View, each marker showed three things as coloured rings around one circle. The rings sat close together and were hard to tell apart.

  How to read a marker now:
  - The blue ring shows how much of the map is done.
  - A green dot on top means the map is assigned.
  - An orange dot below means it has a personal link.
  - No dots means no active links.

  The part still to do is now grey instead of nearly white, so you can see what is left without reading the number.

  A selected marker has a grey outline instead of an orange one. Orange now means a personal link and nothing else.

  The Marker Guide, top right, shows the same dots and ring.

![Map markers showing progress, assignment and personal link](https://assets.ministry-mapper.com/release-notes/2026-08-21/markers.png)

---

## 2026-08-07-colors

[NEW] New color themes.
  Besides light and dark mode, you can now choose a color for the app: Classic, Tangerine, Perpetuity, Cosmic Night, or Mocha Mousse.

  How to use:
  - Open Theme Settings — the palette icon on your screen.
  - Under Color, tap a swatch.
  - Your choice is saved on this device.

![Color theme selector](https://assets.ministry-mapper.com/release-notes/2026-08-10/theme-selector.png)

---

## 2026-08-07-share

[FIX:ADMIN] Assigning a map now takes two steps, so the share popup opens reliably on every browser.
  Why this change:
  - Sometimes tapping Assign created the link, but the share popup never appeared — so the link could not be sent to publishers.
  - After a tap, a browser gives the app only a few seconds to open the share popup. Creating the link needs the internet — on a slow connection it took longer than that, and the browser quietly blocked the popup. That is why it happened only sometimes, mostly on Chrome on iPhone.

  The new flow:
  - Tap Assign or Personal and confirm the slip details, as before.
  - A "Map link is ready" screen shows the assignment details, with a warning if the map is already assigned to someone else.
  - Tap Share to send the link — it is already created, so the popup opens every time. If your browser can't share, the link is copied so you can paste it anywhere.

![Map link is ready](https://assets.ministry-mapper.com/release-notes/2026-08-10/linkready.png)

---

## 2026-08-07-clipboard

[NEW:ADMIN] Copy an assigned map link with one tap.
  When viewing a map's active links, each link now has a copy button beside the delete button. Tap it to copy the link — handy when a publisher needs their link sent again.

![Copy link button](https://assets.ministry-mapper.com/release-notes/2026-08-10/copylink.png)

---

## 2026-07-27

[FIX:ADMIN] Install Ministry Mapper as an app.
  Admins and conductors can now add Ministry Mapper to your home screen, like any other app.

  We turned this off before because the app could keep showing an old version. That is now fixed.

  You do not have to install it. Ministry Mapper still works best in a browser like Safari or Chrome.

  On iPhone or iPad (Safari):
  - Open Ministry Mapper in Safari.
  - Tap the Share button (a square with an arrow pointing up).
  - Scroll down and tap "Add to Home Screen".
  - Tap "Add" at the top right.

  Can't find it? Tap ••• (more) first.

  On Android (Chrome):
  - Open Ministry Mapper in Chrome.
  - Tap the three-dot menu at the top right.
  - Tap "Install app" (or "Add to Home screen").
  - Tap "Install" to confirm.

  The app opens in its own window, with its own icon on your home screen.

---

## 2026-07-06

[NEW:ADMIN] Sort your map list.
  Admins and conductors can now sort their map listing. Tap the sort icon next to the list/map toggle to choose how territory maps are ordered.

  - Sequence — the existing order, same as before (default).
  - Progress — least complete maps shown first, so you can see what still needs coverage.
  - Proximity — nearest map first, based on your device's location. Each map shows its distance from you (e.g. "450 m" or "3.9 km"). Your browser may ask for location permission the first time.

  Your choice is remembered on this device.

![Sort menu showing Sequence, Progress, and Proximity options](https://assets.ministry-mapper.com/release-notes/2026-07-06/sort-menu.png)

---

## 2026-06-15

[NEW] A fresh new look.
  The app's look and feel has been rebuilt from the ground up. The design language it was built on dates back to 2011 — it served its purpose well for many years, but times have changed and a more modern design system now exists. The new one is lighter, more refined, and built for how apps are crafted today.

  Publishers: everything works the same as before — it just looks different.

  Administrators: your menus are now in a panel on the left. Tap the button at the top-left to open it.

---

## 2026-05-05

> Publishers: Smart Sync only covers your address updates. Administrators: admin actions still require a live connection.

[NEW] Smart Synchronization.
  Your updates are saved instantly, even with a weak signal. Saving a visit has always needed a working internet connection — in lifts, basement carparks, rural areas, or places with unreliable mobile data, that often wasn't there.

  The moment you tap Save, your update is stored on your device and the map reflects your changes immediately. The system sends it to the server in the background when your connection is ready.

  - A 📤 badge in the top navigation bar shows how many updates are still on their way. It disappears once they've all gone through.
  - A red dot appears on each address that hasn't synced yet.

  Just record your visits as usual — Smart Sync handles the rest.

![Smart Sync pending indicator in the top navigation bar](https://assets.ministry-mapper.com/release-notes/2026-05-05/smart-sync-indicator.png)

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
