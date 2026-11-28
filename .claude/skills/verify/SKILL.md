---
name: verify
description: Prove a front-end change works before calling it done. Runs the type check, lint, tests and build, then opens the changed screen in a real browser. Use after finishing a feature or fix, before committing or pushing, or when the user asks to verify, check or prove that a change works.
---

# Verify a change

Run from the repo root. Stop at the first failure, fix the cause (never weaken a test or a rule to get a pass), and rerun that step.

## 1. Static checks

1. `npx tsc --noEmit`: CI and `vite build` don't type-check, so this is the only place it happens (about 5 s).
2. `npm run lint`
3. `npx vitest run <changed files or their folders>`, then the full `npm test` before a push.
4. `npm run build` only when the change touches `vite.config.js`, imports or lazy chunks, the PWA, env vars or `scripts/`.

## 2. Browser check (any change a user can see)

1. In a fresh worktree, run `npm ci` first if `node_modules` is missing.
2. The dev server talks to the local backend (`VITE_POCKETBASE_URL=http://localhost:8090`). If `curl -sf http://localhost:8090/api/health` fails, ask the user to start `../ministry-mapper-be`. Don't repoint `.env` at staging or production.
3. Start `npm start` in the background. Vite serves on port 3000, or the next free port if another worktree holds it. Read the URL from its output.
4. Use the Playwright MCP tools (`mcp__playwright__*`) to open the screen the change affects, perform the interaction, take a screenshot and read the console for errors.
   - Signed-in screens: the Playwright browser keeps its profile between runs. If it lands on sign-in, ask the user to sign in in that window, because OTP and OAuth can't be automated. OAuth may only accept port 3000.
   - Publisher map pages open from a share link, so ask the user for one.
   - Layout changes: check a phone viewport (390×844) as well as desktop. Colour changes: check dark mode too.
5. Stop the dev server when done.

## 3. Report

Say what ran and its result, show the screenshot or console evidence, and name anything you could not verify and why. Never report a change as verified when a step was skipped.
