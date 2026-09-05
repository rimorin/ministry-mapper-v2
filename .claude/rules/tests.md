---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "src/utils/test/**"
  - "src/setupTests.ts"
---

# Tests

- Tests are colocated with the code they cover (`useX.test.ts` beside `useX.ts`), never in `__tests__/`.
- Import `describe`, `it`, `expect`, `vi` and friends from `vitest` explicitly even though `globals: true` is set; every existing test does.
- Hook test pattern: `vi.hoisted()` for shared mock state, `vi.mock()` the pocketbase, i18n and sibling-hook modules, then `await import()` the module under test after the mocks (see `src/hooks/useMapManagement.test.ts`).
- Component tests render through `src/utils/test/test-wrapper.tsx`, which provides I18nextProvider, NiceModal.Provider and ThemeMiddleware, accepts a `locale` option, and re-exports testing-library plus `userEvent`. Import it by path (`@/utils/test`); the `@test-utils` alias mentioned in `src/utils/test/README.md` is not configured.
- `src/setupTests.ts` loads jest-dom and fake-indexeddb and stubs `matchMedia` and `Element.getAnimations` for jsdom. Add jsdom gaps there, not in individual tests.
- ESLint turns off `rules-of-hooks` for test files only.
