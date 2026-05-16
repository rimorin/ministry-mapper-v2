# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

**In this codebase:**
- PocketBase is the entire backend. Before designing any data-fetching or mutation, confirm which collection and which utility (`createData`, `updateDataById`, `getList`, `getFirstItemOfList`, etc.) from `src/utils/pocketbase.ts` applies — don't reach for raw `fetch` or build a new abstraction.
- The React Compiler (Babel plugin) is active. Do not add `useMemo`, `useCallback`, or `React.memo` unless you have a concrete, measured reason — the compiler handles memoization automatically. Adding them speculatively is noise.
- Routing is Wouter, not React Router. `useLocation`, `useRoute`, `Switch`, `Route` come from `wouter`. Do not import from `react-router-dom`.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

**In this codebase:**
- Forms use React Hook Form's `useForm` without a schema resolver — Zod is not in this project. Don't add one. Validation lives in controller rules or dedicated utilities.
- User-facing text must go through `useTranslation` (`const { t } = useTranslation()`). Don't hardcode English strings in JSX.
- Use `cn()` from `@/lib/utils` for conditional class names. Don't concatenate Tailwind classes with template literals.
- Animation variants live in `src/lib/motion.ts` (`fadeIn`, `fadeSlideUp`, `fadeZoom`, `staggerContainer`, etc.). Reuse them before writing new ones.
- Use `import * as m from "motion/react-m"` for animated elements (`m.div`, `m.span`, etc.). Use `AnimatePresence` from `motion/react`. Don't import from `motion/react` for element rendering — it skips the lazy bundle.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

**In this codebase:**
- IMPORTANT: `data-slot` attributes on UI components (`src/components/ui/`) are part of the component API — they drive TailwindCSS selector rules. Never remove them when editing a component.
- Unused variables must be prefixed with `_` to suppress the ESLint `no-unused-vars` error. Don't delete a param just to silence the warning if it belongs to a public API signature.
- Prettier owns all whitespace formatting (enforced on pre-commit). Match: double quotes, no trailing commas, 2-space indent.

The test: every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

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

**In this codebase:**
- Run `npm test` (single pass) to verify. Scoped runs: `npm run test:hooks`, `npm run test:components`.
- CI runs: format check → lint → test → build. All must pass. ESLint `--max-warnings 0` means any warning is a CI failure.
- Import test globals explicitly from `vitest` (`import { describe, it, expect, vi } from "vitest"`). Despite `globals: true` in `vitest.config.ts`, all existing tests import explicitly — follow the same pattern.
- Component tests use the project's custom render wrapper at `src/utils/test/test-wrapper.tsx`, which provides `I18nextProvider`, `NiceModal.Provider`, and `ThemeMiddleware` automatically.

---

## 5. Project Conventions

Rules that don't fit the four principles but cause real mistakes if missed.

**Error handling**
- `isAbortError(err)` (exported from `src/utils/pocketbase.ts`) covers both PocketBase auto-cancellations and native `AbortController` aborts. Always check this before treating a caught error as genuine.
- `ignoreAbort(fn)` wraps fire-and-forget async functions so abort errors are silently swallowed. Use it in `useEffect` fetches where PocketBase may auto-cancel duplicate requests.
- IMPORTANT: `withRetry(fn)` retries on transient failures (status 0, 408, 429, 5xx) with exponential backoff. It's already applied inside `getList`, `getFirstItemOfList`, `updateDataById`, etc. — don't wrap those calls again.
- `mapPbAuthError(err, t)` (`src/utils/helpers/pbErrors.ts`) translates PocketBase auth errors to user-facing strings. Returns `null` for unrecognised errors so the caller can fall back to raw display.

**Modals**
- Modals are registered with `NiceModal.create(...)` and opened imperatively via `NiceModal.show(...)`. Don't render them inline in JSX.
- Every modal that wraps a Base UI `<Dialog>` should use `useBaseUiDialog` (`@/components/common/base-ui-dialog`) to wire Base UI's dialog state to NiceModal's visibility.

**i18n**
- When adding user-facing text: add the key and English value to `src/i18n/locales/en/translation.json`, then apply the same key with translated values to all other locales: `es`, `id`, `ja`, `ko`, `ms`, `ta`, `zh`. All 8 locale files must stay in sync.
- Use `t("your.key", "Fallback string")` with a hardcoded English fallback in case a locale file is missing the key.
- Localized data fields (e.g. territory names) may be a plain `string` or a `Record<string, string>` keyed by locale. Use `resolveLocalized(value, locale)` from `src/utils/resolveLocalized.ts` — don't branch on `typeof` yourself.

**Commits**
- Conventional Commits enforced by commitlint. Breaking changes use `feat!:` or `fix!:`.
- No AI co-author trailers. Keep commit messages simple.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
