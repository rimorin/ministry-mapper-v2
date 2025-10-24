---
applyTo:
  - "src/hooks/**"
  - "src/pages/**"
  - "src/components/**"
---

# React Hooks & State Management

> **Related Instructions**:
>
> - [react-components.instructions.md](./react-components.instructions.md) - Component patterns
> - [pocketbase.instructions.md](./pocketbase.instructions.md) - Real-time data

## Hook Usage Rules

🔴 **CRITICAL**:

1. Always use functional components with hooks
2. Follow React Rules of Hooks (only at top level, only in React functions)
3. Custom hooks MUST start with "use" prefix
4. Extract reusable logic into custom hooks

## Custom Hooks in This Project

### useTerritoryManagement

Territory CRUD operations, selection, and caching.

```typescript
import useTerritoryManagement from "../hooks/useTerritoryManagement";

const {
  territories,
  selectedTerritory,
  setSelectedTerritory,
  deleteTerritory,
  resetTerritory
} = useTerritoryManagement({ congregationCode });
```

### useMapManagement

Map/address CRUD, floor management, view state.

```typescript
import useMapManagement from "../hooks/useMapManagement";

const {
  addressData,
  addAddress,
  updateUnit,
  deleteAddress,
  addFloorToMap,
  deleteFloorInMap
} = useMapManagement({ territoryId });
```

### useCongregationManagement

Congregation switching, user management, settings.

```typescript
import useCongregationManagement from "../hooks/useCongregationManagement";

const {
  congregation,
  congregationUsers,
  updateCongregationSettings,
  createPolicy
} = useCongregationManagement();
```

### useUIState

UI state management (modals, listings, toggles).

```typescript
import useUIState from "../hooks/useUIState";

const { isModalOpen, toggleModal, isListingOpen, toggleListing } = useUIState();
```

### useModalManagement

Centralized modal opening with NiceModal.

```typescript
import { useModalManagement } from "../hooks/useModalManagement";
import MyModal from "../components/modal/mymodal";

const { showModal } = useModalManagement();

const openModal = async () => {
  const result = await showModal(MyModal, { prop1: "value" });
  if (result) {
    // Handle result
  }
};
```

### useVisibilityChange

Page visibility detection for data refresh.

```typescript
import useVisibilityChange from "../hooks/useVisibilityManagement";

useVisibilityChange(() => {
  // Refresh data when tab becomes visible
  fetchTerritories();
  fetchMaps();
});
```

### useLocalStorage

Persistent state with localStorage, SSR-safe.

```typescript
import useLocalStorage from "../hooks/useLocalStorage";

const [territoryCode, setTerritoryCode] = useLocalStorage("territoryCode", "");
const [mapView, setMapView] = useLocalStorage("mapView", false);

// Automatically syncs with localStorage
// Handles JSON serialization
```

## Custom Hook Template

```typescript
import { useState, useEffect, useCallback } from "react";
import errorHandler from "../utils/helpers/errorhandler";

interface MyHookOptions {
  param1: string;
  param2?: number;
}

export default function useMyHook({ param1, param2 }: MyHookOptions) {
  const [state, setState] = useState<Type>(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data on mount or when params change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getData(param1);
        setState(data);
      } catch (error) {
        errorHandler(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [param1]);

  // Memoized action
  const action = useCallback(async () => {
    try {
      // Business logic
    } catch (error) {
      errorHandler(error);
    }
  }, [param1, param2]);

  // Cleanup
  useEffect(() => {
    return () => {
      // Cleanup subscriptions, timers, etc.
    };
  }, []);

  // Return state and functions
  return {
    state,
    isLoading,
    action
  };
}
```

## State Management Patterns

### Local Component State

```typescript
// ✅ CORRECT - useState with TypeScript
const [isLoading, setIsLoading] = useState<boolean>(false);
const [userName, setUserName] = useState<string>("");
const [coordinates, setCoordinates] =
  useState<latlongInterface>(DEFAULT_COORDS);
```

### Global State with Context

```typescript
// 1. Define context (src/components/utils/context.ts)
import React from "react";

interface StateType {
  frontPageMode: "login" | "signup" | "forgot";
  setFrontPageMode: (mode: "login" | "signup" | "forgot") => void;
}

const StateContext = React.createContext<StateType>({
  frontPageMode: "login",
  setFrontPageMode: () => {}
});

// 2. Create provider (src/components/middlewares/context.tsx)
const StateMiddleware: FC<{ children: ReactNode }> = ({ children }) => {
  const [frontPageMode, setFrontPageMode] = useState<"login" | "signup" | "forgot">("login");

  return (
    <StateContext.Provider value={{ frontPageMode, setFrontPageMode }}>
      {children}
    </StateContext.Provider>
  );
};

// 3. Consume in components
const { frontPageMode, setFrontPageMode } = useContext(StateContext);
```

**Existing Contexts**:

- **StateContext** - Front page mode
- **LanguageContext** - i18n language selection

### Persistent State with localStorage

```typescript
// ✅ CORRECT - Use useLocalStorage hook
const [cache, setCache] = useLocalStorage("cacheKey", defaultValue);

// Automatically:
// - Syncs with localStorage
// - Handles JSON serialization
// - Returns [value, setter] like useState
// - SSR-safe (returns default if window undefined)
```

## Performance Optimization Hooks

### useMemo

🟡 **IMPORTANT**: Use for expensive computations only.

```typescript
// ✅ CORRECT - Expensive calculation
const sortedAndFilteredData = useMemo(() => {
  return data
    .filter((item) => item.active)
    .sort((a, b) => a.sequence - b.sequence)
    .map((item) => transformItem(item));
}, [data]);

// ❌ WRONG - Simple operation (overhead not worth it)
const doubled = useMemo(() => value * 2, [value]); // Overkill
```

**When to use useMemo**:

- Expensive calculations
- Data transformations
- Filtering/sorting large arrays
- Derived state from props

### useCallback

🟡 **IMPORTANT**: Use for functions passed to child components or as dependencies.

```typescript
// ✅ CORRECT - Function passed as prop
const handleUpdate = useCallback((id: string) => {
  updateAddress(id);
}, [updateAddress]);

<ChildComponent onUpdate={handleUpdate} />

// ✅ CORRECT - Function as dependency
useEffect(() => {
  handleUpdate();
}, [handleUpdate]); // Won't cause infinite loop

// ❌ WRONG - Function not used in children or dependencies
const handleClick = useCallback(() => {
  console.log("clicked"); // No deps, not passed anywhere
}, []); // Unnecessary
```

**When to use useCallback**:

- Functions passed to child components
- Functions used as effect dependencies
- Functions passed to React.memo components

### React.memo

🟢 **RECOMMENDED**: Use for expensive components that render frequently.

```typescript
// ✅ CORRECT - Expensive component
const ExpensiveItem = React.memo<ItemProps>(({ data, onUpdate }) => {
  // Complex rendering logic
  return <div>{/* Expensive UI */}</div>;
});

// ✅ CORRECT - Custom comparison
const SmartComponent = React.memo<SmartProps>(
  ({ data }) => {
    return <div>{data.name}</div>;
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return prevProps.data.id === nextProps.data.id;
  }
);

// ❌ WRONG - Simple component (overhead not worth it)
const SimpleText = React.memo(({ text }) => <span>{text}</span>); // Overkill
```

## Effect Hooks Best Practices

### Dependency Arrays

🔴 **CRITICAL**: Always include ALL dependencies.

```typescript
// ✅ CORRECT - Complete dependency array
useEffect(() => {
  fetchData(userId, territoryId);
}, [userId, territoryId]); // All used variables included

// ❌ WRONG - Missing dependencies
useEffect(() => {
  fetchData(userId, territoryId);
}, []); // ESLint will warn!
```

### Cleanup Functions

🔴 **CRITICAL**: Always cleanup side effects.

```typescript
// ✅ CORRECT - Cleanup subscriptions
useEffect(() => {
  const unsubscribe = setupRealtimeListener("territories", handleUpdate);

  return () => {
    unsubscribe(); // Cleanup on unmount
  };
}, []);

// ✅ CORRECT - Cleanup timers
useEffect(() => {
  const timer = setTimeout(() => {
    doSomething();
  }, 1000);

  return () => clearTimeout(timer);
}, []);

// ✅ CORRECT - Cleanup event listeners
useEffect(() => {
  const handleResize = () => setWidth(window.innerWidth);
  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);
```

### Conditional Effects

```typescript
// ✅ CORRECT - Guard clause for effects
useEffect(() => {
  if (!mapId) return; // Early return if condition not met

  fetchMapData(mapId);
}, [mapId]);

// ✅ CORRECT - Conditional cleanup
useEffect(() => {
  if (!isSubscribed) return;

  const unsubscribe = subscribe();
  return () => unsubscribe();
}, [isSubscribed]);
```

### Async Effects

```typescript
// ✅ CORRECT - Async function inside effect
useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await getData();
      setData(data);
    } catch (error) {
      errorHandler(error);
    }
  };

  fetchData();
}, []);

// ❌ WRONG - Making effect async directly
useEffect(async () => {
  // Don't do this!
  const data = await getData();
  setData(data);
}, []);
```

## Common Hook Pitfalls

### ❌ Don't Call Hooks Conditionally

```typescript
// ❌ WRONG - Conditional hook call
const MyComponent = ({ shouldFetch }) => {
  if (shouldFetch) {
    useEffect(() => {
      // Don't do this!
      fetchData();
    }, []);
  }
};

// ✅ CORRECT - Condition inside hook
const MyComponent = ({ shouldFetch }) => {
  useEffect(() => {
    if (shouldFetch) {
      fetchData();
    }
  }, [shouldFetch]);
};
```

### ❌ Don't Forget Dependencies

```typescript
// ❌ WRONG - Stale closure
const [count, setCount] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1); // Always uses initial count!
  }, 1000);
  return () => clearInterval(timer);
}, []); // Missing count dependency

// ✅ CORRECT - Functional update
useEffect(() => {
  const timer = setInterval(() => {
    setCount((prev) => prev + 1); // Uses current value
  }, 1000);
  return () => clearInterval(timer);
}, []); // No dependencies needed
```

### ❌ Don't Create Functions Inside Renders

```typescript
// ❌ WRONG - New function every render
const MyComponent = () => {
  const handleClick = () => { // Recreated on every render
    doSomething();
  };

  return <Child onClick={handleClick} />;
};

// ✅ CORRECT - Memoized function
const MyComponent = () => {
  const handleClick = useCallback(() => {
    doSomething();
  }, []);

  return <Child onClick={handleClick} />;
};
```

## State Initialization

### Lazy Initialization

🟢 **RECOMMENDED**: Use lazy initializer for expensive initial state.

```typescript
// ✅ CORRECT - Lazy initializer (runs once)
const [state, setState] = useState(() => {
  const initialValue = expensiveComputation();
  return initialValue;
});

// ❌ WRONG - Runs on every render
const [state, setState] = useState(expensiveComputation()); // Wasteful!
```

### Derived State

```typescript
// ❌ WRONG - Derived state in useState
const [fullName, setFullName] = useState(firstName + " " + lastName);

// ✅ CORRECT - Calculate during render
const fullName = `${firstName} ${lastName}`;

// ✅ CORRECT - Use useMemo if expensive
const fullName = useMemo(() => {
  return expensiveNameTransform(firstName, lastName);
}, [firstName, lastName]);
```

## Performance Checklist

When creating or modifying hooks:

- ✅ Use `useCallback` for functions passed to children
- ✅ Use `useMemo` for expensive calculations
- ✅ Use `React.memo` for expensive components
- ✅ Cleanup subscriptions and timers in `useEffect`
- ✅ Use proper dependency arrays
- ✅ Avoid inline function definitions
- ✅ Use lazy initialization for expensive initial state
- ✅ Prefer functional updates for state based on previous state

---

**Last Updated**: October 2024  
**React Version**: 19.x (see `package.json`)
