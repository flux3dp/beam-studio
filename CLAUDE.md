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
pnpm nx run core:test              # Test core package
pnpm nx run-many --target=test --all  # Test all projects
pnpm test <filename> # Run specific unit test file
pnpm nx run app:e2e               # Run Electron E2E tests
pnpm nx run web:cy:dev           # Run web E2E tests

# Linting & Type Checking
pnpm nx run-many --target=lint --all     # Lint all projects
pnpm nx run core:lint                     # Lint core package
pnpm nx run app:lint                      # Lint Electron app
pnpm nx run web:lint                      # Lint web app

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
- **Build**: Webpack 5, Nx 20.0.10
- **Testing**: Jest, Cypress, Playwright

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
3. **State Management**: Component-level state with React hooks, Zustand for complex state
4. **Cross-Platform**: Shared core logic between Electron and web apps
5. **Multi-Language**: i18n support for 21 languages

### Important Services & Components

- **SVGEditor**: Main editing canvas (packages/core/src/web/app/views/beambox/SvgEditor.tsx)
- **Device Management**: packages/core/src/web/helpers/device/
- **API Clients**: packages/core/src/web/helpers/api/
- **Canvas Operations**: packages/core/src/web/app/svgedit/

### External Dependencies

The application relies on these external tools (must be running):
- **FLUXGhost**: WebSocket API for machine communication
- **FLUXClient**: Machine interface library
- **FluxSVG**: SVG processing library
- **Beamify**: SVG to F-code converter

## Important Configuration

- **Nx Configuration**: nx.json - workspace settings and build caching
- **TypeScript**: tsconfig.base.json - base configuration with path mappings
- **ESLint**: eslint.config.js - strict linting rules
- **Jest**: jest.config.ts files in each package

## Development Tips

1. Use `pnpm nx affected:*` commands to only run tasks on changed projects
2. The web app runs on http://localhost:8080 during development
3. Electron app requires external services (FLUXGhost, etc.) to be running for full functionality
4. When modifying shared code in packages/core, both apps will be affected
5. Use path aliases (@core/*) instead of relative imports for core packages

## Electron App Multi Tab

1. Electron App multi-tab function is made by Electron BaseWindow with multiple WebContentsView in (apps/app/src/node/tabManager.ts)
2. To synchronize data between tabs, send TabEvents from source view with ipcRender to main process, and then send to other views with ipcMain.
