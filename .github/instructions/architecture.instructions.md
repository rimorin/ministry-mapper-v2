---
applyTo:
  - "src/**"
---

# Architecture & Project Structure

> **Related Instructions**:
>
> - [react-components.instructions.md](./react-components.instructions.md) - Component patterns
> - [pocketbase.instructions.md](./pocketbase.instructions.md) - Backend integration
> - [testing.instructions.md](./testing.instructions.md) - Testing guidelines

## Project Overview

Ministry Mapper v2 is a React 19 + TypeScript + PocketBase web application for field ministry territory management, replacing paper-based systems with real-time digital collaboration.

### Core Technology Stack

- **Frontend**: React 19.x + TypeScript 5.x + Vite
- **Backend**: PocketBase 0.26.x (separate repo: ministry-mapper-be)
- **UI Framework**: React Bootstrap 2.x + SCSS
- **Maps**: Google Maps via @vis.gl/react-google-maps
- **Routing**: Wouter 3.x (NOT React Router)
- **Modal System**: @ebay/nice-modal-react
- **i18n**: i18next (7 languages: EN, ZH, TA, ID, MS, JA, KO)
- **Monitoring**: Sentry
- **Testing**: Vitest + Testing Library

## Application Architecture

### Middleware Layers (Nested Providers)

Providers are nested in this specific order in `src/pages/index.tsx`:

1. **MainMiddleware** - Environment validation, PocketBase URL check
2. **LanguageProvider** - i18n context and language management
3. **MaintenanceMiddleware** - Maintenance mode handling
4. **MapsMiddleware** - Google Maps API provider
5. **NiceModalMiddleware** - Modal management context
6. **StateMiddleware** - Global state (front page mode)

**When creating new providers**: Add to this nesting structure in `src/pages/index.tsx`.

### Directory Structure

```
src/
├── components/          # UI components (organized by function, NOT feature)
│   ├── form/           # Form inputs (input, textarea, select, etc.)
│   ├── modal/          # Modal dialogs (NiceModal pattern)
│   ├── navigation/     # Headers, menus, buttons, lists
│   ├── table/          # Territory tables and data display
│   ├── map/            # Google Maps specific components
│   ├── statics/        # Loaders, errors, placeholders
│   ├── middlewares/    # Context providers
│   └── utils/          # Context definitions, suspense wrappers
├── pages/              # Top-level route components
├── hooks/              # Custom React hooks (business logic)
│   └── admin/          # Admin-specific hooks
├── utils/              # Utilities and constants
│   ├── helpers/        # Pure functions (well-tested)
│   ├── interface.ts    # TypeScript interfaces
│   ├── constants.ts    # Constants and enums
│   ├── pocketbase.ts   # PocketBase client wrapper
│   └── policies.ts     # Business logic classes
├── i18n/               # Internationalization
│   └── locales/        # Translation JSON files
└── css/                # Global styles (SCSS)
```

🔴 **CRITICAL**: Components are organized by **function**, not feature. Put form components in `components/form/`, modals in `components/modal/`, etc.

## Page Structure

### Public Pages (Unauthenticated)

- **FrontPage** (`/`) - Landing page with login/signup/forgot password modes
- **SignIn** - Email/password and OAuth2 (Google) authentication, OTP support
- **SignUp** - User registration with email verification
- **Forgot** - Password reset flow
- **UserManagement** (`/usermgmt`) - Email verification and password reset confirmation

### Authenticated Pages

- **Admin** (Main Dashboard) - Territory and congregation management
  - Territory listing and selection
  - Map/address management
  - User management (congregation-level)
  - Congregation settings and options
  - Assignment tracking
  - Multi-congregation support

- **Map** (`/map/:id`) - Territory detail view for publishers
  - Link-based access (assignments or personal links)
  - Household status updates
  - Map view toggle
  - Language selection
  - Legend display
  - Expiry countdown
  - Pinned messages

## Data Models & Collections

### PocketBase Collections

- **users** - Authentication, name, email, role, congregation access
- **congregations** - Code, name, settings (max tries, expiry hours), options
- **territories** - Code, name/description, congregation reference
- **maps** - Address/building, code, description, type (single/multi-story), coordinates, floor count
- **addresses** - Individual unit/household, floor, sequence, status, type, notes, not-home count, DNC time
- **assignments** - Link sessions for territory assignments (normal/personal)
- **messages** - Feedback and instructions for territories
- **options** - Household types (e.g., Chinese, Malay, English) with countable/default flags

### Key Interfaces (in `src/utils/interface.ts`)

- `unitDetails` - Individual household/unit data
- `addressDetails` - Building/address data
- `territoryDetails` - Territory metadata
- `latlongInterface` - Coordinates
- `userDetails` - User authentication and profile
- `congregationDetails` - Congregation settings

🟡 **IMPORTANT**:

- Project-wide interfaces → Define in `src/utils/interface.ts`
- Component-specific interfaces → Define in same file before component

## Access Levels & Permissions

Managed by `Policy` class in `src/utils/policies.ts`:

1. **Administrator** - Full congregation management, territory servant role
2. **Conductor** - Territory management, assignment creation
3. **Publisher** - View and update assigned territories
4. **Read-only** - View-only access
5. **No Access** - Access revoked

### Status Codes

- **Not Done** (0) - Default, needs to be contacted
- **Done** (1) - Successfully contacted
- **Not Home** (2) - No one home (tracks tries)
- **Do Not Call** (3) - Explicit request not to call
- **Invalid** (4) - Address doesn't exist

## Routing with Wouter

🔴 **CRITICAL**: This project uses **Wouter**, NOT React Router.

```typescript
// ✅ CORRECT - Wouter routing
import { Route, Switch, useLocation, useParams } from "wouter";

const Router = () => (
  <Switch>
    <Route path="/">{LazyLoad(FrontPage)}</Route>
    <Route path="/map/:id">{LazyLoad(Map)}</Route>
    <Route path="*">{LazyLoad(NotFoundPage)}</Route>
  </Switch>
);

// Navigation
const [location, setLocation] = useLocation();
setLocation("/map/123");

// Route params
const params = useParams();
const mapId = params.id;

// ❌ WRONG - Do NOT use React Router
import { BrowserRouter, Routes, Route } from "react-router-dom"; // Never use!
```

## State Management Patterns

### Local Component State

```typescript
const [isLoading, setIsLoading] = useState<boolean>(false);
const [userName, setUserName] = useState<string>("");
```

### Global State (React Context)

- **StateContext** - Front page mode (login/signup/forgot)
- **LanguageContext** - i18n language selection

```typescript
// Consume context
const { frontPageMode, setFrontPageMode } = useContext(StateContext);
const { currentLanguage, changeLanguage } = useContext(LanguageContext);
```

### Persistent State (localStorage)

Use custom `useLocalStorage` hook:

```typescript
const [territoryCode, setTerritoryCode] = useLocalStorage("territoryCode", "");
const [mapView, setMapView] = useLocalStorage("mapView", false);
```

### Real-time State (PocketBase)

See [pocketbase.instructions.md](./pocketbase.instructions.md) for subscription patterns.

## Custom Hooks Architecture

Business logic is encapsulated in custom hooks (in `src/hooks/`):

### Territory Management

**useTerritoryManagement** - Territory CRUD operations, selection, reset, caching

### Map Management

**useMapManagement** - Map/address CRUD, floor management, reset, view state

### Congregation Management

**useCongregationManagement** - Congregation switching, user management, settings, policy creation

### UI State Management

**useUIState** - Modal visibility, listings, language selector toggles

### Modal Management

**useModalManagement** - Centralized modal opening with NiceModal

### Visibility Management

**useVisibilityChange** - Page visibility detection for data refresh

### Storage Management

**useLocalStorage** - Persistent state with localStorage, SSR-safe

🟡 **IMPORTANT**: Extract reusable logic into custom hooks. All custom hooks must:

- Start with "use" prefix
- Follow React Rules of Hooks
- Handle cleanup in useEffect
- Use errorHandler for async errors

## Lazy Loading & Code Splitting

### Route Components

```typescript
// ✅ CORRECT - Lazy load all route components
import { lazy, Suspense } from "react";
import Loader from "../components/statics/loader";

const LazyLoad = (Component: LazyExoticComponent<ComponentType>) => (
  <Suspense fallback={<Loader suspended />}>
    <Component />
  </Suspense>
);

const Map = lazy(() => import("./map"));
const Admin = lazy(() => import("./admin"));
```

### Modal Components

```typescript
// ✅ CORRECT - Lazy load modals
const UpdateUser = lazy(() => import("../components/modal/updateuser"));
const NewTerritory = lazy(() => import("../components/modal/newterritorycd"));

// Use with showModal
const result = await showModal(UpdateUser, { userId });
```

## Environment Configuration

Required environment variables (`.env`):

- `VITE_POCKETBASE_URL` - PocketBase backend URL
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `VITE_SENTRY_DSN` - Sentry monitoring DSN
- `VITE_SYSTEM_ENVIRONMENT` - "local" or "production"
- `VITE_VERSION` - Application version (defaults to package.json)
- `VITE_PRIVACY_URL` - Privacy policy URL
- `VITE_TERMS_URL` - Terms of service URL
- `VITE_ABOUT_URL` - About page URL

🔴 **CRITICAL**: Never commit `.env` file. Use `.env.example` for documentation.

## Build & Development

### Scripts

```bash
npm start              # Development server (port 3000)
npm run build          # Production build
npm test               # Run tests
npm run prettier       # Check formatting
npm run prettier:fix   # Fix formatting
npm serve              # Preview production build
```

### Build Output

- Output directory: `build/`
- Manual code splitting for: react, sentry, gmaps, pocketbase, routing
- PWA manifest generation
- Service worker with Workbox
- Bundle visualization with rollup-plugin-visualizer

## File Naming Conventions

- **Components**: PascalCase (e.g., `MapView.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useMapManagement.ts`)
- **Utilities**: camelCase (e.g., `errorHandler.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `STATUS_CODES`)
- **Interfaces**: PascalCase (e.g., `unitDetails`)
- **CSS**: kebab-case (e.g., `admin.css`)

## Performance Optimization

- **Code Splitting**: Route-based with React.lazy
- **Virtualization**: react-window for long lists
- **Memoization**: React.memo, useMemo, useCallback
- **Asset Caching**: Service worker strategies
- **Bundle Analysis**: `stats.html` after build

## Resources

- Repository: https://github.com/rimorin/ministry-mapper-v2
- Backend: https://github.com/rimorin/ministry-mapper-be
- Issues: https://github.com/rimorin/ministry-mapper-v2/issues

---

**Last Updated**: October 2024  
**Node Requirement**: >=22.0.0
