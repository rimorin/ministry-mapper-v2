# Test Utilities

This directory contains shared testing utilities, mocks, and fixtures for the Ministry Mapper v2 test suite.

## Structure

```
test-utils/
├── index.ts              # Main export file
├── i18n.ts              # Mock i18n configuration for tests
├── test-wrapper.tsx     # Custom render with providers
├── mocks/
│   └── pocketbase.ts    # PocketBase API mocks
└── fixtures/
    ├── territories.ts   # Territory test data
    └── users.ts         # User test data
```

## Usage

### Basic Component Testing

```typescript
import { render, screen } from '@test-utils';
import MyComponent from './MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Using Test Fixtures

```typescript
import { mockTerritory, mockUser } from '@test-utils';

test('displays territory', () => {
  render(<TerritoryCard territory={mockTerritory} />);
  expect(screen.getByText('T01')).toBeInTheDocument();
});
```

### Using PocketBase Mocks

```typescript
import { mockPocketBase, resetMockPocketBase } from "@test-utils";
import { vi } from "vitest";

beforeEach(() => {
  resetMockPocketBase();
});

test("fetches data", async () => {
  const mockData = { id: "1", name: "Test" };
  mockPocketBase.collection().getList.mockResolvedValue({
    items: [mockData],
    page: 1,
    perPage: 30,
    totalItems: 1,
    totalPages: 1
  });

  // Your test code
});
```

### Custom Render with Providers

The custom `render` function automatically wraps components with:

- I18nextProvider (with mock translations)
- NiceModal.Provider (for modal management)

```typescript
import { render } from '@test-utils';

render(<MyComponent />); // Automatically wrapped with providers
```

### User Event Testing

```typescript
import { render, screen, userEvent } from '@test-utils';

test('handles user interaction', async () => {
  const user = userEvent.setup();
  render(<Button />);

  await user.click(screen.getByRole('button'));
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

## Available Fixtures

### Territories

- `mockTerritoryType` - HDB territory type
- `mockTerritoryTypePrivate` - Private territory type
- `mockUnit` - Single unit
- `mockUnitWithMultipleTypes` - Unit with multiple types
- `mockTerritory` - Basic territory
- `mockTerritoryList` - List of territories
- `mockMap` - Map object
- `mockAddress` - Address object

### Users

- `mockUser` - Basic user
- `mockAdminUser` - Admin user
- `mockConductorUser` - Conductor user
- `mockReadOnlyUser` - Read-only user
- `mockUserRole` - User role
- `mockCongregation` - Congregation

## Mock PocketBase API

The mock PocketBase provides:

- `authStore` - Authentication state
- `collection()` - Collection methods (getList, getOne, create, update, delete)
- `realtime` - Real-time subscription methods

All methods are vi.fn() mocks that can be customized per test.

## i18n Mock

Mock i18n provides common translations:

- Common actions (cancel, confirm, delete, save, etc.)
- Territory terms
- Map terms
- User terms
- Validation messages

Add more translations to `i18n.ts` as needed.

## Best Practices

1. **Always reset mocks** between tests using `beforeEach()`
2. **Use fixtures** instead of hardcoding test data
3. **Import from `@test-utils`** for consistency
4. **Add new fixtures** to appropriate files as needed
5. **Keep mocks simple** - only mock what's necessary for the test

## TypeScript Path Alias

Configure `tsconfig.json` to use `@test-utils` alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@test-utils": ["./src/test-utils"]
    }
  }
}
```

## Adding New Fixtures

When adding new fixtures, follow the pattern:

```typescript
// src/test-utils/fixtures/myFeature.ts
export const mockMyFeature = {
  id: "feature-1",
  name: "Test Feature",
  created: "2024-01-01T00:00:00.000Z",
  updated: "2024-01-01T00:00:00.000Z"
};

export const mockMyFeatureList = [
  mockMyFeature
  // ... more items
];
```

Then export from `index.ts`:

```typescript
export * from "./fixtures/myFeature";
```
