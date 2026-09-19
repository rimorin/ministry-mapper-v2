# CLAUDE.md

React front end for Ministry Mapper (door-to-door ministry territory management): a congregation has territories, a territory has maps (single or multi-storey buildings), a map has addresses (household units with status not done / done / not home / DNC / invalid). Publishers work maps through time-limited share links; admins manage everything. The backend is the sibling repo `../ministry-mapper-be` (Go/PocketBase); its route contracts live in `internal/setup/routes.go` there.

## Working principles
Summarised from Andrej Karpathy's guidelines (github.com/multica-ai/andrej-karpathy-skills). They bias toward caution over speed; for trivial tasks, use judgment.

- **Think before coding.** State your assumptions. If several readings are possible, present them rather than picking one silently. If a simpler approach exists, say so.
- **Simplicity first.** The minimum code that solves the problem — no speculative abstraction, no configurability nobody asked for, no handling for impossible cases. If 200 lines could be 50, rewrite it.
- **Surgical changes.** Touch only what the request implies and match the surrounding style. Remove orphans your own change created; leave pre-existing dead code alone and mention it instead.
- **Goal-driven.** Turn the task into a check you can run ("add validation" → "write tests for invalid inputs, then make them pass") and loop until it passes. For multi-step work, state the plan and how each step verifies.

## Stack and layout
- React 19, Vite (Rolldown), TypeScript strict, Tailwind v4, Wouter for routing (`useLocation`, `useRoute`, `Switch`, `Route`; never `react-router-dom`), PocketBase JS SDK, i18next, motion, NiceModal, LaunchDarkly, Sentry, Umami. Node >= 24.
- Pages in `src/pages/` (admin under `src/pages/admin/`). Hooks flat in `src/hooks/` as `useX.ts`; most are default exports, so match the file you are editing. UI primitives in `src/components/ui/` are shadcn-generated in the Base UI flavour (not Radix) with lucide icons; that folder stays registry-only, app composites live in `src/components/common/`. PocketBase helpers in `src/utils/pocketbase.ts`; `PB_FIELDS` and the publisher header key in `src/utils/constants.ts`.
- The React Compiler runs in Vite and Vitest. Don't add `useMemo`, `useCallback` or `React.memo` without a measured reason. `useRealtime.ts` uses React 19's `useEffectEvent`; don't "fix" it to `useCallback`.
- No state library. State lives in page-level containers with logic extracted into hooks that receive setters as props (`src/hooks/useAdminData.ts`). Contexts are narrow and purpose-built.
- First paint must not wait on LaunchDarkly: `src/lib/launchdarkly.ts` bounds init with a short timeout and falls back to flags off.

## Backend access
- Structural mutations go through backend routes via `callFunction(path, {method, body})`: `/map/add`, `/map/reset`, `/map/floor/add`, `/territory/delete`, `/address/add`, `/link/map`, `/report/generate`. `createData("maps", ...)` bypasses server logic. Check for an existing route or `src/utils/pocketbase.ts` helper before designing a mutation; never raw `fetch`.
- Every list or subscribe call passes a `fields` projection from `PB_FIELDS` and a `requestKey`. Omitting `fields` fetches oversized payloads; omitting `requestKey` lets PocketBase auto-cancel the wrong request.
- IMPORTANT: `withRetry` already wraps `getList`, `getFirstItemOfList`, `getPaginatedList` and `updateDataById`; `createData` and `deleteDataById` are not retried. `getFirstItemOfList` returns `null` on 404; `updateDataById` and `deleteDataById` swallow aborts and return `undefined`/`false`. Handle those at the call site.
- Check `isAbortError(err)` before treating a caught error as genuine. `ignoreAbort(fn)` wraps fire-and-forget fetches in effects. `mapPbAuthError(err, t)` returns `null` for unrecognised auth errors. `runAction` (`useNotification`) toasts any non-abort error, so a 409 from `/report/generate` surfaces without extra handling.
- Realtime goes through `useRealtimeSubscription` (`src/hooks/useRealtime.ts`), which handles retry backoff, tab-focus resubscription and debounce. Don't call `setupRealtimeListener` from components. Prefer subscribing by record id (`topic`) over a `filter`; the server refuses over-broad filters.
- Two auth worlds: admins use the PocketBase auth store (`users`, OTP/MFA, OAuth2); publishers send a link token via `configureHeader(linkId)` with no auth store. `pb.afterSend` clears admin auth on 401 unless the publisher header is present. Realtime subscriptions do not inherit the header; pass it in the subscription options.
- Publisher status updates on the map page go through the SmartSync IndexedDB queue (`src/utils/smartsync.ts`, `useSmartSync`) for offline support, not direct `updateDataById`.
- Sign-in has PWA-specific OAuth handling in `useAuthentication.ts` for installed standalone windows. It looks redundant and is not.

## UI conventions
- `data-slot` attributes on `src/components/ui/` components drive Tailwind selector rules. Never remove them.
- Registry files export more than the app calls (`Toggle`, `SidebarInput`, `SidebarGroupAction`, `SidebarMenuAction`, `SidebarMenuSkeleton`). They are tree-shaken out of every chunk, so deleting them gains nothing and only drifts from the registry.
- User-facing text goes through `useTranslation` as `t("your.key", "Fallback")`. Add the key to `src/i18n/locales/en/translation.json` and the translation to `es`, `id`, `ja`, `ko`, `ms`, `ta`, `zh`; all eight files stay key-identical. Localised data fields may be `string` or `Record<string, string>`; use `resolveLocalized(value, locale)` rather than branching on `typeof`.
- Colours come from the theme tokens in `src/index.css`, never hardcoded palette values. Statuses use `status-done|nothome|dnc|invalid|notdone`, fixed across the colour themes; feedback uses `success`/`warning`/`info`, which flip light/dark — tint `/10`, border `/30`, `-foreground` only on solid fills. `src/css/variables.css` holds only the `--mm-*` map chrome, pinned on purpose.
- `cn()` from `@/lib/utils` for conditional classes. Animation variants live in `src/lib/motion.ts`; animate with `import * as m from "motion/react-m"` and `AnimatePresence` from `motion/react`. Don't render elements from `motion/react`; it skips the lazy bundle.
- Forms use React Hook Form without a schema resolver; Zod is not installed. Validation lives in controller rules or dedicated utilities.
- Modals: register with `NiceModal.create(...)`, open with `NiceModal.show(...)`, never inline in JSX. Base UI dialogs use `useBaseUiDialog` (`@/components/common/base-ui-dialog`) with its `onClose`/`size` options, not a custom `onOpenChange`.
- Two components render bottom panels: `Sheet` for the three list panels (all `side="bottom"`), `Drawer` for `ResponsiveDialog` on mobile (own lazy chunk). The overlap is known; follow whichever a screen's neighbours use rather than migrating one screen alone.
- Analytics (`src/utils/analytics.ts`) is fire-and-forget and swallows its own errors. Never await it or let it affect control flow.
- Unused variables and parameters take a `_` prefix (ESLint `^_`). Don't drop a parameter that belongs to a public signature to silence the warning.

## Tests and CI
- `npm test` runs everything once; `npm run test:hooks` and `npm run test:components` are scoped. Tests are colocated (`useX.test.ts` beside `useX.ts`). The test patterns load from `.claude/rules/` when you edit a test file.
- CI (`checks.yaml`, PRs to master and staging): prettier check, lint, test, build; all must pass. Pre-commit lint-staged runs `prettier --write` and `eslint --fix --max-warnings 0`, so a warning blocks a commit locally. A PostToolUse hook runs prettier and eslint on each edited file.
- Commits to master run semantic-release: `fix:` is a patch, `feat:` a minor, `feat!:`/`fix!:` a major. The release commit carries `[skip ci]`, then a Coolify webhook deploys.

## Conventions
- Conventional Commits enforced by commitlint. No AI co-author trailers. Keep messages simple.
- Prettier owns formatting: double quotes, no trailing commas, 2-space indent.
- Release-notes conventions load from `.claude/rules/` when you touch `release-notes/`.

Maintaining this file: treat it like code. If Claude makes a mistake this file should have prevented, add the rule; if a rule is always followed without being stated, delete it.
