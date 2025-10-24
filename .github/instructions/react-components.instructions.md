---
applyTo:
  - "src/components/**"
  - "src/pages/**"
---

# React Components & Patterns

> **Related Instructions**:
>
> - [architecture.instructions.md](./architecture.instructions.md) - Project structure
> - [react-hooks.instructions.md](./react-hooks.instructions.md) - Hooks patterns
> - [react-forms.instructions.md](./react-forms.instructions.md) - Form handling

## React Version

This project uses **React 19.x** (see `package.json` for exact version).

🔴 **CRITICAL**: ONLY functional components with React Hooks. NO class components.

```typescript
// ✅ CORRECT - Functional component
const MyComponent: FC<MyComponentProps> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<string>("");
  return <div>{/* JSX */}</div>;
};

// ❌ WRONG - Never use class components
class MyComponent extends Component {
  // Never use this pattern
}
```

## TypeScript Patterns

### Strict TypeScript

🔴 **CRITICAL**: TypeScript strict mode is ENABLED.

```typescript
// ✅ CORRECT - Proper interface definition
interface MyComponentProps {
  userName: string;
  userId: string;
  onUpdate: (id: string) => void;
  isLoading?: boolean; // Optional prop
}

const MyComponent: FC<MyComponentProps> = ({
  userName,
  userId,
  onUpdate,
  isLoading = false
}) => {
  // Component implementation
};

// ❌ WRONG - Never use 'any' type
const MyComponent = (props: any) => {}; // Avoid!

// ❌ WRONG - Untyped components
const MyComponent = ({ userName, userId }) => {}; // Missing types!
```

### No PropTypes

🔴 **CRITICAL**: This project does NOT use PropTypes. TypeScript interfaces replace PropTypes entirely.

```typescript
// ✅ CORRECT - Use TypeScript interfaces
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

// ❌ WRONG - Do NOT add PropTypes
MyComponent.propTypes = {
  label: PropTypes.string.isRequired // Never use this!
};
```

### Interface Location

- **Project-wide interfaces**: `src/utils/interface.ts`
- **Component-specific interfaces**: Same file before component
- **Import shared interfaces**: From `src/utils/interface.ts`

```typescript
// ✅ CORRECT - Import shared interfaces
import {
  unitDetails,
  addressDetails,
  latlongInterface
} from "../../utils/interface";

// ✅ CORRECT - Component-specific interface
interface MapViewToggleProps {
  isMapView: boolean;
  onToggle: () => void;
}

const MapViewToggle: FC<MapViewToggleProps> = ({ isMapView, onToggle }) => {
  // Component
};
```

## Component Organization

🔴 **CRITICAL**: Components are organized by **function, NOT feature**.

```
src/components/
├── form/           # ALL form inputs (input, textarea, select, etc.)
├── modal/          # ALL modal dialogs (NiceModal pattern)
├── navigation/     # Navigation, headers, menus, buttons
├── table/          # Territory table and data display
├── map/            # Google Maps components
├── statics/        # Static pages (loader, 404, etc.)
├── middlewares/    # Context providers
└── utils/          # Utility components
```

**When creating new components**, place in appropriate functional directory:

- Form input? → `components/form/`
- Modal dialog? → `components/modal/`
- Navigation element? → `components/navigation/`

## Component Templates

### Basic Component

```typescript
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import errorHandler from "../../utils/helpers/errorhandler";

interface MyComponentProps {
  prop1: string;
  onComplete: () => void;
}

const MyComponent: FC<MyComponentProps> = ({ prop1, onComplete }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      // Business logic
      onComplete();
    } catch (error) {
      errorHandler(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>{t("component.title")}</h2>
      <button onClick={handleAction} disabled={isLoading}>
        {isLoading ? t("common.loading") : t("common.submit")}
      </button>
    </div>
  );
};

export default MyComponent;
```

### Page Component

```typescript
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Loader from "../components/statics/loader";
import errorHandler from "../utils/helpers/errorhandler";

const MyPage: FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getData();
        setData(result);
      } catch (error) {
        errorHandler(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div>
      {/* Page content */}
    </div>
  );
};

export default MyPage;
```

## Modal Management with NiceModal

🔴 **CRITICAL**: Use `@ebay/nice-modal-react` for ALL modals, NOT React Bootstrap's modal state.

### Creating Modals

```typescript
import NiceModal, { useModal, bootstrapDialog } from "@ebay/nice-modal-react";
import { Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import ModalFooter from "../form/footer";
import errorHandler from "../../utils/helpers/errorhandler";

interface MyModalProps {
  prop1: string;
  prop2: number;
}

const MyModal = NiceModal.create<MyModalProps>(({ prop1, prop2 }) => {
  const modal = useModal();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Business logic
      modal.hide(); // Close modal on success
    } catch (error) {
      errorHandler(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal {...bootstrapDialog(modal)} onHide={() => modal.remove()}>
      <Modal.Header>
        <Modal.Title>{t("modal.title")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Modal content */}
      </Modal.Body>
      <ModalFooter
        handleClick={modal.hide}
        handleSave={handleSubmit}
        isSaving={isLoading}
      />
    </Modal>
  );
});

export default MyModal;
```

### Opening Modals

```typescript
import { useModalManagement } from "../hooks/useModalManagement";
import MyModal from "../components/modal/mymodal";

const { showModal } = useModalManagement();

// Open modal
const handleOpenModal = async () => {
  const result = await showModal(MyModal, {
    prop1: "value1",
    prop2: 42
  });

  if (result) {
    // Handle result if modal returns data
  }
};
```

### Modal Return Values

```typescript
// In modal - return data
const handleSelect = (selectedItem: ItemType) => {
  modal.resolve(selectedItem); // Return value to caller
  modal.hide();
};

// In caller - receive data
const result = await showModal(SelectionModal, { items });
if (result) {
  console.log("Selected:", result);
}
```

## List Rendering

### Unique Keys

🔴 **CRITICAL**: Always use stable, unique keys for lists.

```typescript
// ✅ CORRECT - Use record IDs
{addresses.map(address => (
  <div key={address.id}>
    {address.name}
  </div>
))}

// ❌ WRONG - Don't use index for dynamic lists
{addresses.map((address, index) => (
  <div key={index}> {/* Avoid this! */}
    {address.name}
  </div>
))}
```

### Virtualized Lists

For lists with 100+ items, use react-window:

```typescript
import { FixedSizeList as List } from "react-window";

<List
  height={600}
  itemCount={items.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  )}
</List>
```

## Performance Optimization

### React.memo

Use for components that render frequently with same props:

```typescript
// ✅ CORRECT - Memoize expensive component
const ExpensiveComponent = React.memo<ExpensiveProps>(({ data }) => {
  // Heavy rendering logic
  return <div>{/* Complex UI */}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison (optional)
  return prevProps.data.id === nextProps.data.id;
});
```

### useMemo

Use for expensive calculations:

```typescript
// ✅ CORRECT - Memoize expensive computation
const sortedAddresses = useMemo(() => {
  return addresses
    .filter((a) => a.status !== STATUS_CODES.INVALID)
    .sort((a, b) => a.sequence - b.sequence);
}, [addresses]);
```

### useCallback

Use for functions passed as props:

```typescript
// ✅ CORRECT - Memoize callback
const handleUpdate = useCallback((id: string) => {
  updateAddress(id);
}, [updateAddress]);

<ChildComponent onUpdate={handleUpdate} />
```

## Event Handling

### Type-Safe Event Handlers

```typescript
// ✅ CORRECT - Properly typed
const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};

const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // Submit logic
};

const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation();
  // Click logic
};
```

### Preventing Default Behavior

```typescript
// ✅ CORRECT - Prevent default form submission
const handleSubmit = (event: FormEvent) => {
  event.preventDefault(); // Always prevent default on forms

  if (!isValidData(data)) {
    alert(t("validation.error"));
    return;
  }

  submitData();
};
```

## Styling with Bootstrap

🔴 **CRITICAL**: Use React Bootstrap components, NOT vanilla Bootstrap.

```typescript
// ✅ CORRECT - React Bootstrap
import { Button, Form, Modal, Spinner } from "react-bootstrap";

<Button variant="primary" onClick={handleClick}>
  {t("common.submit")}
</Button>

// ❌ WRONG - Don't use HTML with Bootstrap classes
<button className="btn btn-primary">Submit</button> // Avoid this
```

### Conditional Classes

```typescript
// ✅ CORRECT - Conditional className
<div className={`map-header ${isExpanded ? "expanded" : ""}`}>
  {/* Content */}
</div>

// ✅ CORRECT - Multiple conditions
<button className={`btn ${isPrimary ? "btn-primary" : "btn-secondary"} ${isDisabled ? "disabled" : ""}`}>
  {label}
</button>
```

## Internationalization (i18n)

🔴 **CRITICAL**: Use `useTranslation` hook for ALL user-facing text.

```typescript
import { useTranslation } from "react-i18next";

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("common.title")}</h1>
      <p>{t("territory.description", { name: territoryName })}</p>
      <button>{t("common.submit")}</button>
    </div>
  );
};

// ❌ WRONG - Hardcoded strings
<button>Submit</button> // Never hardcode!
```

### Translation Keys

Namespaced by feature:

- `common.*` - Buttons, labels, common UI
- `territory.*` - Territory-related text
- `map.*` - Map/address text
- `auth.*` - Authentication
- `validation.*` - Validation messages
- `error.*` - Error messages

### Dynamic Translations

```typescript
// ✅ CORRECT - With interpolation
t("territory.deleteSuccess", { code: territoryCode });
// Result: "Deleted territory T-01."

// ✅ CORRECT - Pluralization
t("map.unitCount", { count: unitCount });
// Result: "1 unit" or "5 units"
```

## Accessibility

### Semantic HTML

```typescript
// ✅ CORRECT - Use semantic elements
<nav>
  <ul>
    <li><Link href="/">Home</Link></li>
  </ul>
</nav>

<main>
  <article>
    <h1>{title}</h1>
    <p>{content}</p>
  </article>
</main>
```

### ARIA Attributes

```typescript
// ✅ CORRECT - Add ARIA labels
<button
  aria-label={t("common.close")}
  onClick={handleClose}
>
  <CloseIcon />
</button>

<input
  aria-describedby="input-help-text"
  aria-required="true"
/>
```

## Common Anti-Patterns

### ❌ Don't Mutate State

```typescript
// ❌ WRONG
const [items, setItems] = useState([]);
items.push(newItem);
setItems(items);

// ✅ CORRECT
setItems([...items, newItem]);
```

### ❌ Don't Use Inline Functions in Props

```typescript
// ❌ WRONG - Creates new function every render
<Button onClick={() => handleClick(id)}>Click</Button>

// ✅ CORRECT - Stable reference
const onClick = useCallback(() => handleClick(id), [id]);
<Button onClick={onClick}>Click</Button>
```

### ❌ Don't Set State in Render

```typescript
// ❌ WRONG - Causes infinite loop
const MyComponent = () => {
  const [count, setCount] = useState(0);
  setCount(count + 1); // Never!
  return <div>{count}</div>;
};

// ✅ CORRECT - In effect or handler
useEffect(() => {
  setCount(prev => prev + 1);
}, []);
```

## React 19 Features

This project uses React 19, which includes:

- **No JSX transform import needed** - `import React from 'react'` not required
- **Automatic batching** - State updates batched automatically
- **Improved Suspense** - Better data fetching support
- **useTransition** - Available for concurrent rendering

---

**Last Updated**: October 2024  
**React Version**: 19.x (see `package.json`)
