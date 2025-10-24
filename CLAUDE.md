# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ministry Mapper v2 is a React TypeScript web application for field ministry territory management. It's a comprehensive rewrite from the Firebase-based v1, now using PocketBase for the backend. The application helps congregations manage territory assignments, track visits, and coordinate field service activities digitally.

## Build and Development Commands

- **Start development server**: `npm start` (runs on port 3000)
- **Build for production**: `npm run build` (outputs to `build/` directory)
- **Run tests**: `npm test` (Vitest test runner)
- **Code formatting**: `npm run prettier` (check) / `npm run prettier:fix` (apply fixes)
- **Preview production build**: `npm serve`

## Core Architecture

### Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Bootstrap 5
- **Backend**: PocketBase (separate repository: ministry-mapper-be)
- **Maps**: Google Maps API via @vis.gl/react-google-maps
- **State Management**: React Context + custom hooks
- **Routing**: Wouter
- **UI**: React Bootstrap + custom SCSS
- **Monitoring**: Sentry
- **Testing**: Vitest + Testing Library

### Key Directory Structure

```
src/
├── components/          # Reusable UI components organized by type
│   ├── form/           # Form input components
│   ├── map/            # Google Maps related components
│   ├── modal/          # Modal dialogs
│   ├── navigation/     # Navigation and UI controls
│   ├── statics/        # Static content pages
│   └── table/          # Territory table components
├── hooks/              # Custom React hooks for business logic
│   └── admin/          # Admin-specific hooks
├── pages/              # Top-level page components
├── utils/              # Utility functions and constants
│   └── helpers/        # Pure utility functions (well-tested)
└── i18n/               # Internationalization
```

### Architecture Patterns

**Component Organization**: Components are organized by function rather than feature. Form components go in `components/form/`, modals in `components/modal/`, etc.

**State Management**: Uses React Context for global state with custom hooks abstracting business logic. Key contexts include user authentication and UI state management.

**Data Layer**: All PocketBase interactions are centralized in `src/utils/pocketbase.ts` with typed wrappers around the PocketBase client. The interface definitions in `src/utils/interface.ts` provide comprehensive TypeScript types for all data structures.

**Hook Architecture**: Business logic is abstracted into custom hooks:

- `hooks/admin/` contains administrator functionality
- `hooks/modalManagement.ts` handles modal state
- `hooks/uiManagement.ts` manages UI state
- `hooks/visibilityManagement.ts` handles component visibility

**Testing Strategy**: Utility functions in `src/utils/helpers/` have comprehensive unit tests. Each helper function has a corresponding `.test.ts` file.

## Environment Configuration

Required environment variables:

- `VITE_POCKETBASE_URL`: PocketBase backend URL
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API key
- `VITE_SENTRY_DSN`: Sentry monitoring DSN
- `VITE_SYSTEM_ENVIRONMENT`: "local" or "production"
- `VITE_VERSION`: Application version (defaults to package.json version)
- `VITE_PRIVACY_URL`, `VITE_TERMS_URL`, `VITE_ABOUT_URL`: Legal page URLs

## Code Style & Conventions

- **TypeScript**: Strict mode enabled, comprehensive interfaces defined in `src/utils/interface.ts`
- **React**: Uses modern React 19 features, no prop-types (TypeScript handles type checking)
- **ESLint**: Configured with React + TypeScript rules, JSX pragma disabled (React 17+ style)
- **Imports**: ESM modules, absolute imports from `src/`
- **Styling**: SCSS with Bootstrap 5, component-specific stylesheets

## Testing

- **Framework**: Vitest with jsdom environment
- **Coverage**: Focus on utility functions in `src/utils/helpers/`
- **Pattern**: Each utility has corresponding `.test.ts` file with comprehensive test cases
- **Setup**: `src/setupTests.ts` configures testing environment with Testing Library

## Deployment Notes

- **Build Output**: Static files in `build/` directory
- **Backend Dependency**: Requires separate PocketBase backend deployment
- **Maps Integration**: Google Maps API key required for map functionality
- **Monitoring**: Sentry integration for error tracking and performance monitoring
