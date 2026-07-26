# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. If the diff can be described in one sentence, skip the ceremony and just make the change.

**Domain in one line:** Ministry Mapper manages door-to-door ministry territory — a congregation has territories, a territory has maps (single or multi-story buildings), a map has addresses (household units with status: not done / done / not home / DNC / invalid). Publishers work maps via time-limited share links; admins manage everything.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask — a clarifying question before coding beats a rewrite after.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.

**In this codebase:**
- PocketBase is the backend, but not everything is collection CRUD. **Structural mutations go through custom Go routes via `callFunction(path, {method, body})`** — e.g. `/map/add`, `/map/reset`, `/map/floor/add`, `/territory/delete`, `/address/add`, `/link/map`. Creating a map with `createData("maps", ...)` bypasses server logic. Before designing any mutation, check whether an existing `callFunction` route or a `src/utils/pocketbase.ts` utility (`createData`, `updateDataById`, `getList`, `getFirstItemOfList`, etc.) applies — never raw `fetch`.
- The React Compiler (Babel preset, active in Vite AND Vitest) handles memoization. Do not add `useMemo`, `useCallback`, or `React.memo` without a measured reason. Hooks like `useRealtime.ts` use React 19's `useEffectEvent` — don't "fix" it to `useCallback`.
- Routing is Wouter, not React Router. `useLocation`, `useRoute`, `Switch`, `Route` come from `wouter`. Do not import from `react-router-dom`.
- No state library (no Redux/Zustand/TanStack Query). State lives in page-level containers with logic extracted into hooks that receive setters as props (see `src/hooks/useAdminData.ts`). Contexts are narrow and purpose-built.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features, abstractions, or "configurability" beyond what was asked.
- No defensive try/catch bloat or error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- When reviewing your own or others' findings, don't chase every nit into extra abstraction layers or tests for cases that can't happen — fix correctness, skip speculation.

**In this codebase:**
- Forms use React Hook Form's `useForm` without a schema resolver — **Zod is not in this project** (the `zod` entry in vite manualChunks is dead config). Validation lives in controller rules or dedicated utilities.
- User-facing text goes through `useTranslation`. Don't hardcode English strings in JSX.
- Use `cn()` from `@/lib/utils` for conditional class names, not template literals.
- Animation variants live in `src/lib/motion.ts` (`fadeIn`, `fadeSlideUp`, `fadeZoom`, `staggerContainer`, `springBase`, etc.). Reuse before writing new ones.
- Use `import * as m from "motion/react-m"` for animated elements and `AnimatePresence` from `motion/react`. Don't render elements from `motion/react` — it skips the lazy bundle.

## 3. Surgical Changes

**Touch only what you must. Fix causes, not symptoms.**

- Don't "improve" adjacent code, comments, or formatting. Don't refactor things that aren't broken.
- Address the root cause — a narrow diff that suppresses an error or dodges the real problem is still a failure.
- Remove imports/variables YOUR changes orphaned; leave pre-existing dead code alone (mention it instead).

**In this codebase:**
- IMPORTANT: `data-slot` attributes on UI components (`src/components/ui/`) are part of the component API — they drive Tailwind selector rules. Never remove them.
- Unused variables/params must be prefixed with `_` (ESLint enforces `^_` for both). Don't delete a param just to silence the warning if it belongs to a public API signature.
- Prettier owns formatting (pre-commit): double quotes, no trailing commas, 2-space indent.

The test: every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define a check you can run. Loop until it passes. Show evidence, not assertions.**

- "Fix the bug" → write a test that reproduces it, then make it pass. "Refactor X" → tests pass before and after.
- When claiming success, show the command and its output — don't just say "done".
- Run `npm test` (single pass) to verify. Scoped: `npm run test:hooks`, `npm run test:components`.

**In this codebase:**
- CI runs format check → lint → test → build; all must pass. `--max-warnings 0` is enforced **pre-commit via lint-staged** (CI lint is plain `eslint src`), so a warning blocks your commit locally.
- Tests are **colocated** (`useX.test.ts` next to `useX.ts`), never in `__tests__/`. Import globals explicitly from `vitest` despite `globals: true` — every existing test does.
- Hook test pattern: `vi.hoisted()` for shared mock state, `vi.mock()` the pocketbase/i18n/sibling-hook modules, then **`await import()` the module under test after the mocks** (see `src/hooks/useMapManagement.test.ts`).
- Component tests use the custom render wrapper at `src/utils/test/test-wrapper.tsx` (provides I18nextProvider, NiceModal.Provider, ThemeMiddleware; accepts a `locale` option; re-exports testing-library + `userEvent`).
- Node >= 24 required (`engines`, CI).

---

## 5. Project Conventions

**PocketBase data access**
- Every list/subscribe call passes a `fields` projection from `PB_FIELDS` (`src/utils/constants.ts`) and a `requestKey` for dedupe. Follow this — omitting `fields` fetches oversized payloads; omitting `requestKey` risks PocketBase auto-cancelling the wrong request.
- Realtime: use the `useRealtimeSubscription` hook (`src/hooks/useRealtime.ts`) — it handles retry backoff, tab-focus resubscription, and optional debounce. Don't call `setupRealtimeListener` directly in components. Prefer subscribing by record ID (`topic`) over a `filter`.
- IMPORTANT: `withRetry` (transient-failure retry) is already applied inside `getList`, `getFirstItemOfList`, `getPaginatedList`, `updateDataById` — don't wrap those again. **`createData` and `deleteDataById` are NOT retried.** Non-throwing failure modes: `getFirstItemOfList` returns `null` on 404; `updateDataById`/`deleteDataById` swallow aborts (return `undefined`/`false`) — handle these at the call site.

**Error handling**
- `isAbortError(err)` (from `src/utils/pocketbase.ts`) covers PocketBase auto-cancellations and native aborts. Check it before treating a caught error as genuine.
- `ignoreAbort(fn)` wraps fire-and-forget async calls in `useEffect` fetches so abort errors are swallowed.
- `mapPbAuthError(err, t)` (`src/utils/helpers/pbErrors.ts`) translates PocketBase auth errors; returns `null` for unrecognised errors so callers can fall back to raw display.

**Auth & publisher links (two separate auth worlds)**
- Admins authenticate via the PocketBase auth store (`users` collection, OTP/MFA, OAuth2). Publishers authenticate via a link token set as a security header with `configureHeader(linkId)` — no auth store.
- `pb.afterSend` auto-clears admin auth on 401 unless the request carries the publisher header. Realtime subscriptions do NOT inherit the header — pass it in subscription options manually.
- Publisher address/status updates on the map page go through the **SmartSync IndexedDB queue** (`src/utils/smartsync.ts`, `useSmartSync`) for offline support — not direct `updateDataById`.

**Modals**
- Register with `NiceModal.create(...)`, open imperatively via `NiceModal.show(...)`. Don't render modals inline in JSX.
- Modals wrapping a Base UI `<Dialog>` use `useBaseUiDialog` (`@/components/common/base-ui-dialog`) — it wires Base UI state to NiceModal and schedules `modal.remove()` on close. Use its `onClose`/`size` options, not custom `onOpenChange`.

**Hooks & components**
- Hooks are default exports, named `useX.ts`, flat in `src/hooks/`. Props typed with `interface XProps`.
- UI primitives in `src/components/ui/` are shadcn-generated (Base UI flavor, not Radix; lucide icons) — regenerate/extend in that style.

**i18n (8-way sync)**
- New user-facing text: add the key to `src/i18n/locales/en/translation.json`, then the translated value to all other locales: `es`, `id`, `ja`, `ko`, `ms`, `ta`, `zh`. All 8 files must stay key-identical.
- Use `t("your.key", "Fallback string")` with an English fallback.
- Localized data fields may be `string` or `Record<string, string>` — use `resolveLocalized(value, locale)` from `src/utils/resolveLocalized.ts`, don't branch on `typeof` yourself.
- Release notes are also 8-way: `release-notes/RELEASE_NOTES[.lang].md` are parsed by `scripts/prebuild.js` into `public/changelog.json` — an entry added to one language must be added to all.

**Commits**
- Conventional Commits enforced by commitlint; breaking changes use `feat!:`/`fix!:`. No AI co-author trailers. Keep messages simple.

---

**Maintaining this file:** treat it like code. If Claude makes a mistake this file should have prevented, add the rule; if a rule is always followed without being stated, delete it. Every line must earn its context cost.
