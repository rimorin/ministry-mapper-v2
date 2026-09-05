# CLAUDE.md

React front end for Ministry Mapper (door-to-door ministry territory management): a congregation has territories, a territory has maps (single or multi-storey buildings), a map has addresses (household units with status not done / done / not home / DNC / invalid). Publishers work maps through time-limited share links; admins manage everything. The backend is the sibling repo `../ministry-mapper-be` (Go/PocketBase); its route contracts live in `internal/setup/routes.go` there.

## Working principles
From Andrej Karpathy's guidelines (github.com/multica-ai/andrej-karpathy-skills), reproduced verbatim.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
## Stack and layout
- React 19, Vite (Rolldown), TypeScript strict, Tailwind v4, Wouter for routing (`useLocation`, `useRoute`, `Switch`, `Route`; never `react-router-dom`), PocketBase JS SDK, i18next, motion, NiceModal, LaunchDarkly, Sentry, Umami. Node >= 24.
- Pages in `src/pages/` (admin under `src/pages/admin/`). Hooks flat in `src/hooks/` as `useX.ts`; most are default exports, so match the file you are editing. UI primitives in `src/components/ui/` are shadcn-generated in the Base UI flavour (not Radix) with lucide icons. PocketBase helpers in `src/utils/pocketbase.ts`; `PB_FIELDS` and the publisher header key in `src/utils/constants.ts`.
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
- User-facing text goes through `useTranslation` as `t("your.key", "Fallback")`. Add the key to `src/i18n/locales/en/translation.json` and the translation to `es`, `id`, `ja`, `ko`, `ms`, `ta`, `zh`; all eight files stay key-identical. Localised data fields may be `string` or `Record<string, string>`; use `resolveLocalized(value, locale)` rather than branching on `typeof`.
- Colours come from the theme tokens in `src/css/variables.css` and the Tailwind theme, never hardcoded values in components.
- `cn()` from `@/lib/utils` for conditional classes. Animation variants live in `src/lib/motion.ts`; animate with `import * as m from "motion/react-m"` and `AnimatePresence` from `motion/react`. Don't render elements from `motion/react`; it skips the lazy bundle.
- Forms use React Hook Form without a schema resolver. Zod is not installed; the `zod` match in the Vite `advancedChunks` groups is inert. Validation lives in controller rules or dedicated utilities.
- Modals: register with `NiceModal.create(...)`, open with `NiceModal.show(...)`, never inline in JSX. Base UI dialogs use `useBaseUiDialog` (`@/components/common/base-ui-dialog`) with its `onClose`/`size` options, not a custom `onOpenChange`.
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
