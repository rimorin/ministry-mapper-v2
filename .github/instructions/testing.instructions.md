---
applyTo:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/utils/helpers/**"
---

# Testing Guidelines

> **Related Instructions**:
>
> - [react-components.instructions.md](./react-components.instructions.md) - Component patterns
> - [react-hooks.instructions.md](./react-hooks.instructions.md) - Hooks

## Testing Stack

- **Test Runner**: Vitest 3.x
- **React Testing**: @testing-library/react
- **DOM Testing**: @testing-library/jest-dom
- **User Interactions**: @testing-library/user-event

## Coverage Requirements

🟡 **IMPORTANT**:

- **Utility functions**: 80% minimum coverage
- **Critical components**: Basic render tests
- **Custom hooks**: Test all exported functions
- **Business logic**: Test edge cases

## Test File Location

```
src/
├── utils/helpers/
│   ├── errorHandler.ts
│   ├── errorHandler.test.ts      # Co-located test
│   ├── dateFormat.ts
│   └── dateFormat.test.ts
├── components/
│   ├── MyComponent.tsx
│   └── MyComponent.test.tsx       # Co-located test
└── hooks/
    ├── useMyHook.ts
    └── useMyHook.test.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- errorHandler.test.ts

# Run in watch mode
npm test -- --watch

# Run with UI
npm test -- --ui
```

## Testing Utility Functions

### Basic Test Structure

```typescript
import { describe, it, expect } from "vitest";
import { myUtilityFunction } from "./myUtilityFunction";

describe("myUtilityFunction", () => {
  it("should handle normal input", () => {
    const result = myUtilityFunction("input");
    expect(result).toBe("expected output");
  });

  it("should handle edge case: empty string", () => {
    const result = myUtilityFunction("");
    expect(result).toBe("");
  });

  it("should handle edge case: null", () => {
    const result = myUtilityFunction(null);
    expect(result).toBe(null);
  });

  it("should throw error for invalid input", () => {
    expect(() => myUtilityFunction(undefined)).toThrow();
  });
});
```

### Example: Date Formatting Test

```typescript
import { describe, it, expect } from "vitest";
import { formatLinkExpiryDate } from "./linkdateformatter";

describe("formatLinkExpiryDate", () => {
  it("should format date correctly", () => {
    const date = new Date("2024-10-18T12:00:00Z");
    const result = formatLinkExpiryDate(date);
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("should handle invalid date", () => {
    const result = formatLinkExpiryDate(null);
    expect(result).toBe("");
  });
});
```

## Testing React Components

### Basic Component Test

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent title="Test Title" />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders with required props", () => {
    render(<MyComponent title="Test" onComplete={() => {}} />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./Button";

describe("Button interactions", () => {
  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click Me</Button>);

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when loading", () => {
    render(<Button isLoading={true}>Submit</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### Testing with i18n

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n/config";
import MyComponent from "./MyComponent";

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

describe("MyComponent with i18n", () => {
  it("renders translated text", () => {
    renderWithI18n(<MyComponent />);

    expect(screen.getByText("Submit")).toBeInTheDocument();
  });
});
```

## Testing Forms

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyForm from "./MyForm";

describe("MyForm", () => {
  it("submits form with valid data", async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(<MyForm onSubmit={handleSubmit} />);

    // Fill in form
    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");

    // Submit
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      name: "John Doe",
      email: "john@example.com"
    });
  });

  it("shows validation errors", async () => {
    const user = userEvent.setup();

    render(<MyForm onSubmit={vi.fn()} />);

    // Submit without filling
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });
});
```

## Mocking PocketBase

🔴 **CRITICAL**: Always mock PocketBase calls in tests.

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import * as pocketbase from "../../utils/pocketbase";
import MyComponent from "./MyComponent";

// Mock the entire pocketbase module
vi.mock("../../utils/pocketbase", () => ({
  getList: vi.fn(),
  updateRecord: vi.fn(),
  setupRealtimeListener: vi.fn(),
  unsubscriber: vi.fn()
}));

describe("MyComponent with PocketBase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and displays data", async () => {
    const mockData = {
      items: [
        { id: "1", name: "Territory 1" },
        { id: "2", name: "Territory 2" }
      ]
    };

    vi.mocked(pocketbase.getList).mockResolvedValue(mockData);

    render(<MyComponent />);

    await waitFor(() => {
      expect(screen.getByText("Territory 1")).toBeInTheDocument();
    });

    expect(pocketbase.getList).toHaveBeenCalledWith("territories", expect.any(Object));
  });

  it("handles fetch error", async () => {
    vi.mocked(pocketbase.getList).mockRejectedValue(new Error("Network error"));

    render(<MyComponent />);

    await waitFor(() => {
      expect(screen.getByText("Error loading data")).toBeInTheDocument();
    });
  });
});
```

## Testing Custom Hooks

```typescript
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import useMyHook from "./useMyHook";

describe("useMyHook", () => {
  it("returns initial state", () => {
    const { result } = renderHook(() => useMyHook({ param: "test" }));

    expect(result.current.state).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches data on mount", async () => {
    const { result } = renderHook(() => useMyHook({ param: "test" }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.state).not.toBe(null);
    });
  });

  it("calls action successfully", async () => {
    const { result } = renderHook(() => useMyHook({ param: "test" }));

    await result.current.action();

    expect(result.current.state).toBe("updated");
  });
});
```

## Testing Async Operations

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AsyncComponent from "./AsyncComponent";

describe("AsyncComponent", () => {
  it("shows loading state", () => {
    render(<AsyncComponent />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows data after loading", async () => {
    render(<AsyncComponent />);

    await waitFor(() => {
      expect(screen.getByText("Data loaded")).toBeInTheDocument();
    });
  });

  it("handles errors", async () => {
    // Mock error
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("API Error"));

    render(<AsyncComponent />);

    await waitFor(() => {
      expect(screen.getByText("Error occurred")).toBeInTheDocument();
    });
  });
});
```

## Snapshot Testing

🟢 **RECOMMENDED**: Use sparingly for stable components.

```typescript
import { describe, it } from "vitest";
import { render } from "@testing-library/react";
import StaticComponent from "./StaticComponent";

describe("StaticComponent snapshot", () => {
  it("matches snapshot", () => {
    const { container } = render(<StaticComponent title="Test" />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## Test Utilities

### Custom Render Function

```typescript
// src/utils/test-utils.tsx
import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n/config";

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
```

### Mock Data Factory

```typescript
// src/utils/test-factories.ts
export const createMockTerritory = (overrides = {}) => ({
  id: "test-id",
  code: "T-01",
  name: "Test Territory",
  congregation: "cong-1",
  ...overrides
});

export const createMockAddress = (overrides = {}) => ({
  id: "addr-1",
  name: "123 Main St",
  status: 0,
  sequence: 1,
  ...overrides
});
```

## Best Practices

🔴 **CRITICAL**:

1. **Always mock PocketBase** - Never make real API calls in tests
2. **Use waitFor for async** - Don't use arbitrary timeouts
3. **Clean up mocks** - Use `beforeEach` to reset mocks
4. **Test behavior, not implementation** - Focus on what users see/do

🟡 **IMPORTANT**:

1. Write tests for utility functions first (highest ROI)
2. Test error states and edge cases
3. Use descriptive test names
4. Keep tests independent (no shared state)
5. Mock external dependencies

🟢 **RECOMMENDED**:

1. Use `screen` queries over `container` queries
2. Prefer `getByRole` over other queries
3. Use `userEvent` over `fireEvent` for user interactions
4. Group related tests with `describe`
5. Add helpful error messages to assertions

## Common Test Patterns

### Testing Error Handling

```typescript
it("handles error gracefully", async () => {
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  render(<ComponentWithError />);

  await waitFor(() => {
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
  });

  consoleSpy.mockRestore();
});
```

### Testing Loading States

```typescript
it("shows loading spinner", () => {
  render(<AsyncComponent />);

  expect(screen.getByRole("status")).toBeInTheDocument();
});
```

### Testing Cleanup

```typescript
it("unsubscribes on unmount", () => {
  const unsubscribeMock = vi.fn();
  vi.mocked(pocketbase.setupRealtimeListener).mockReturnValue(unsubscribeMock);

  const { unmount } = render(<SubscribedComponent />);

  unmount();

  expect(unsubscribeMock).toHaveBeenCalled();
});
```

---

**Last Updated**: October 2024  
**Vitest Version**: 3.x (see `package.json`)
