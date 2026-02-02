# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beam Studio is a companion application for FLUX Beam Series laser cutting/engraving machines. It's a monorepo using Nx with pnpm, providing both Electron desktop and web applications.

## Development Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm nx run app:dev      # Build Electron app for development
pnpm nx run app:start    # Start Electron app
pnpm nx run web:start    # Start web dev server (http://localhost:8080)

# Building
pnpm nx run app:build    # Build Electron app
pnpm nx run web:build    # Build web app

# Testing
pnpm nx run core:test    # Test core package
pnpm run test         # Test all projects
pnpm run test -u      # Test all projects and update snapshots
pnpm test <filename>     # Run specific unit test file
pnpm nx run web:cy:dev   # Run web E2E tests (Cypress)

# Linting & Type Checking
pnpm run lint            # Lint all projects
pnpm run lint --fix      # Lint all projects and fix issues

# Run affected projects (based on git changes)
pnpm nx affected:test    # Test only affected projects
pnpm nx affected:lint    # Lint only affected projects
```

## Architecture

### Monorepo Structure

- **apps/app/** - Electron desktop application
- **apps/web/** - Web application (PWA)
- **packages/core/** - Shared business logic and React components

### Technology Stack

- **Frontend**: React 18.3.1 with TypeScript
- **Desktop**: Electron 35.5.1
- **UI**: Ant Design 5.23.2
- **Graphics**: Konva, Three.js, Canvas APIs
- **State Management**: Zustand for cross-component state
- **Build**: Webpack 5, Nx 20.0.10
- **Testing**: Jest (unit), Cypress (E2E)

### Path Mappings

```typescript
"@core/*": ["packages/core/src/web/*"]
// For app
"@core/implementations/*": ["apps/app/src/implementations/*"]
// For web
"@core/implementations/*": ["apps/web/src/implementations/*"]
```

### Key Architecture Patterns

1. **Machine Communication**: WebSocket-based via FLUXGhost API
2. **SVG Processing**: Custom SVG editor with laser-specific operations
3. **State Management**: Zustand for cross-component contexts, React hooks for component-local state
4. **Cross-Platform**: Shared core logic between Electron and web apps
5. **Multi-Language**: i18n support for 23 languages

### Important Services & Components

- **SVGEditor**: Main editing canvas (packages/core/src/web/app/views/beambox/SvgEditor.tsx)
- **Device Management**: packages/core/src/web/helpers/device/
- **API Clients**: packages/core/src/web/helpers/api/
- **Canvas Operations**: packages/core/src/web/app/svgedit/
- **Undo/Redo**: Command pattern via packages/core/src/web/app/svgedit/history/

## Coding Conventions

### Critical Rules

1. **Linting**: Do NOT fix lint issues during implementation sessions. Run `pnpm run lint` after completing the implementation to address any lint issues separately.

2. **Pattern Matching**: Prefer `ts-pattern` over `switch-case` statements for better type safety and exhaustive matching. Use `.exhaustive()` by default; use `.otherwise()` only when the input is truly open-ended.

3. **State Management**: Prefer Zustand for cross-component state and contexts. Use React hooks for component-local state only.

### TypeScript

- Minimize use of `any`. Use `unknown` or proper generics for type-safe code.
- `any` is acceptable at legacy code boundaries but should be avoided in new code.
- Prefer `as const` objects over enums for constants.

### Async/Error Handling

- Prefer `async/await` with `try/catch` blocks over promise chains with `.catch()`.

### Component Organization

- **Simple components**: Single file (Component.tsx, Component.module.scss)
- **Complex components**: Folder structure with index.tsx, styles, tests colocated

### Styling

- Primary: Ant Design theming via ConfigProvider and theme tokens
- Secondary: SCSS modules when Ant Design theming is not flexible enough

### Props Naming

- Use interface `ComponentNameProps` for component props
- Follow React conventions: `onAction` for callbacks, `children` for nested content

### Helpers vs Utils

- **helpers/**: Domain-specific logic (device communication, API clients, file operations)
- **utils/**: Generic utilities colocated with features (e.g., `svgedit/utils/`, `components/Feature/utils/`)

### Zustand Store Organization

- **Wide-scope stores**: Centralized in `packages/core/src/web/app/stores/`
- **Feature-specific stores**: Colocated with the feature
- **Simple stores**: Single `.ts` file
- **Complex stores**: Folder with `index.ts`, `types.ts`, `utils/`

## i18n (Internationalization)

### Language Files

Location: `packages/core/src/web/app/lang/`

### Key Languages for Development

- **en.ts** (English) - Primary source of truth
- **zh-tw.ts** (Traditional Chinese) - Secondary key language

### Adding New Translation Keys

1. Add keys to `en.ts` and `zh-tw.ts` during development
2. Complete all other language files before creating PR
3. Keys use nested object structure matching `ILang` interface
4. Use descriptive, hierarchical key names (e.g., `alert.confirm`, `beambox.ai_generate.form.generate`)

## Electron App Multi-Tab

### Multi-Tab Architecture

Multi-tab functionality uses Electron BaseWindow with multiple WebContentsView (apps/app/src/node/tabManager.ts).

### IPC Events

All IPC events are defined in `@core/app/constants/ipcEvents.ts` using the `as const` pattern with kebab-case values:

```typescript
import { TabEvents, MenuEvents, MiscEvents } from '@core/app/constants/ipcEvents';

// Usage examples:
communicator.send(TabEvents.AddNewTab);
ipcMain.on(MenuEvents.MenuClick, handler);
communicator.sendSync(MiscEvents.AskForPermission, 'camera');
```

**Available event groups**:

- `TabEvents` - Tab management and synchronization
- `BackendEvents` - Backend service status
- `UpdateEvents` - App update lifecycle
- `NetworkEvents` - Network testing and IP checks
- `FontEvents` - Font discovery and substitution
- `MenuEvents` - Menu interactions
- `SvgEvents` - SVG processing
- `AuthEvents` - Authentication (OAuth, account updates)
- `MiscEvents` - Miscellaneous (permissions, window events, etc.)
- `TabConstants` - Non-event tab configuration (e.g., `maxTab`)

### Tab State Synchronization

To synchronize data between tabs:

1. Send TabEvents from source view via ipcRenderer to main process
2. Main process broadcasts to other views via ipcMain

## Important Configuration

- **Nx Configuration**: nx.json - workspace settings and build caching
- **TypeScript**: tsconfig.base.json - base configuration with path mappings
- **ESLint**: eslint.config.js - strict linting rules
- **Jest**: jest.config.ts files in each package

## Development Tips

1. Use `pnpm nx affected:*` commands to only run tasks on changed projects
2. The web app runs on <http://localhost:8080> during development
3. Electron app requires external services (FLUXGhost, etc.) for full functionality, but works with limited features when unavailable
4. When modifying shared code in packages/core, both apps will be affected
5. Use path aliases (@core/*) instead of relative imports for core packages
6. When writing class member functions with `this`, prefer arrow functions to avoid `this` binding issues
7. Follow basic accessibility practices: proper labels, focus management, keyboard navigation

## Areas Needing Improvement

These areas have been identified as needing standardization or documentation:

- **Testing patterns**: Mock patterns for external services need standardization
- **API patterns**: Request/response typing and error handling patterns need documentation
- **Performance optimization**: Canvas/SVG editor performance patterns to be established
- **Security review**: Input validation for file imports and machine commands

## External Dependencies

The application relies on these external tools:

- **FLUXGhost**: WebSocket API for machine communication (Python-based, built separately)
- **Swiftray**: Backend service
- **FluxSVG**: SVG processing library
- **Beamify**: SVG to F-code converter
