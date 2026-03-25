# Unit Test Skill

Guide for writing unit tests in the Beam Studio codebase.

## Framework & Config

- **Runner**: Jest 30 with `ts-jest`, environment `jsdom`
- **Assertion/DOM**: `@testing-library/react`, `@testing-library/jest-dom`
- **Test files**: `*.spec.tsx` / `*.spec.ts`, colocated next to the source file
- **Run**: `pnpm test <filename>` (e.g. `pnpm test FontSizeBlock`)
- **Update snapshots**: `pnpm test <filename> -u`

### Path Aliases in Tests

```
@core/*   → packages/core/src/web/*
@mocks/*  → packages/core/src/__mocks__/*
```

SCSS modules are auto-proxied by `identity-obj-proxy` (class names returned as-is).
SVG imports are auto-mocked via `svgrMock.ts` / `urlMock.ts`.

---

## Core Rule: What to Mock

**Mock** all imported functions/modules **except**:

1. **Constants** — import and use directly (enums, config objects, string maps)
2. **Modules that already have a `__mocks__` file** — Jest auto-resolves them; do NOT re-mock
3. **Modules whose dependencies are all already mocked** — they work as-is without mocking. For example, `@core/helpers/useI18n` depends only on `storageStore` and `i18n`, both of which have `__mocks__` files, so `useI18n` resolves correctly without any manual mock.

### Existing `__mocks__` (auto-resolved, do NOT re-mock)

Location: `packages/core/src/__mocks__/`

| Mock path (`@core/...` or package) | What it provides |
|---|---|
| `zustand` | Wraps real `create`/`createStore` with auto-reset after each test |
| `@core/helpers/i18n` | Returns `{ lang: langEn, getActiveLang: () => 'en' }` using real `en.ts` |
| `@core/helpers/checkFeature` | `jest.fn()` |
| `@core/helpers/getOS` | `jest.fn()` |
| `@core/helpers/is-dev` | `jest.fn()` returns `false` |
| `@core/helpers/symbolMaker` | no-op |
| `@core/helpers/api/flux-id` | stubs for auth functions |
| `@core/helpers/layer/layer-config-helper` | stubs |
| `@core/helpers/device/promark/promark-info` | stubs |
| `@core/implementations/communicator` | stub `send`/`sendSync`/`on`/`once` |
| `@core/implementations/storage` | in-memory get/set |
| `@core/app/stores/storageStore` | full in-memory store with `useStorageStore`, `getStorage`, `setStorage` |
| `@core/app/stores/documentStore` | full in-memory store |
| `@core/app/stores/globalPreferenceStore` | full in-memory store |
| `@core/app/stores/layer/layerStore` | full in-memory store |
| `@core/app/contexts/CanvasContext` | stub context provider |
| `@core/app/widgets/UnitInput` | renders real `<input>` with `onChange` wired to `Number(e.target.value)` |
| `@core/app/widgets/Input` | simplified input mock |
| `@core/app/components/.../NumberBlock` | simplified block mock |
| `@core/app/constants/presets` | stub presets |

---

## Mock Patterns

### 1. Simple function mock (most common)

```ts
const mockDoSomething = jest.fn();

jest.mock('@core/app/svgedit/text/textedit', () => ({
  getFontSize: (...args: any[]) => mockGetFontSize(...args),
  setFontSize: (...args: any[]) => mockSetFontSize(...args),
}));
```

- Declare `const mockXxx = jest.fn()` **before** `jest.mock()` (hoisting makes this work)
- Wrap in arrow so the mock variable is captured at call time
- **No `__esModule: true`** needed — only plain object exports

### 2. Default export — when to use `__esModule`

Only use `__esModule: true` when the module has **both** a default export **and** named exports that you need:

```ts
// Module has: export default textEdit; AND export { getFontSize, ... }
jest.mock('@core/app/svgedit/text/textedit', () => ({
  __esModule: true,
  default: { getFontSize: mockGetFontSize, setFontSize: mockSetFontSize },
  getFontSize: (...args: any[]) => mockGetFontSize(...args),
  setFontSize: (...args: any[]) => mockSetFontSize(...args),
}));
```

If only default OR only named — skip `__esModule`:

```ts
// Default-only module
jest.mock('@core/some/module', () => (...args) => mockFn(...args));

// Named-only module
jest.mock('@core/some/module', () => ({ foo: mockFoo }));
```

### 3. Component mock (render minimal JSX)

```ts
jest.mock('../../OptionsInput', () => ({ displayMultiValue, id, onChange, value }: any) => (
  <div data-testid="desktop-input-wrapper">
    mock-options-input id:{id} value:{value} multi:{String(displayMultiValue)}
    <input data-testid="desktop-input" onChange={(e) => onChange(+e.target.value)} />
  </div>
));
```

- Expose key props in text content for easy assertion
- Wire callbacks (`onChange`, `onClick`) to real DOM events for interaction testing
- Use `data-testid` for queries

### 4. Zustand store mock (inline, when __mocks__ version doesn't fit)

```ts
jest.mock('@core/app/stores/someStore', () => ({
  useSomeStore: Object.assign(
    (selector?: any) => {
      const state = { count: 0, increment: jest.fn() };
      return selector ? selector(state) : state;
    },
    { getState: () => ({ count: 0, increment: jest.fn() }) },
  ),
}));
```

For stores with `__mocks__` files (storageStore, documentStore, etc.), just import normally — the mock is auto-resolved.

### 5. Class constructor mock

```ts
jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: class {
    addSubCommand = jest.fn();
    constructor(...args: any[]) {
      mockBatchCommand(...args);
    }
  },
}));
```

### 6. `getSVGAsync` / svgCanvas mock

```ts
jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb: any) => cb({
    Canvas: {
      changeSelectedAttribute: jest.fn(),
      undoMgr: { addCommandToHistory: jest.fn() },
    },
  }),
}));
```

### 7. `ObjectPanelItem` mock (frequently needed)

```ts
jest.mock('@core/app/components/beambox/RightPanel/ObjectPanelItem', () => ({
  Item: ({ content, id, label, onClick }: any) => (
    <div onClick={onClick}>mock-item id:{id} label:{label}{content}</div>
  ),
  Number: ({ hasMultiValue, id, label, updateValue, value }: any) => (
    <div>
      mock-number id:{id} label:{label} value:{value} multi:{String(hasMultiValue)}
      <input onChange={(e) => updateValue(+e.target.value)} />
    </div>
  ),
  Select: ({ id, label, onChange, options }: any) => (
    <div>
      mock-select id:{id} label:{label}
      <select onChange={(e) => onChange(e.target.value)}>
        {options?.map((o: any) => o.value && (
          <option key={o.value} value={o.value}>{o.label || o.value}</option>
        ))}
      </select>
    </div>
  ),
}));
```

---

## Test Structure Template

```tsx
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

// 1. Declare mock fns BEFORE jest.mock calls
const mockFoo = jest.fn();
const mockBar = jest.fn();

// 2. jest.mock calls (hoisted to top by Jest)
jest.mock('@core/some/module', () => ({
  foo: (...args: any[]) => mockFoo(...args),
  bar: (...args: any[]) => mockBar(...args),
}));

// 3. Import the component AFTER mocks
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFoo.mockReturnValue('default');
  });

  test('should render correctly', () => {
    const { getByTestId } = render(<MyComponent />);
    expect(getByTestId('my-element')).toBeInTheDocument();
  });

  test('should handle interaction', () => {
    const { getByTestId } = render(<MyComponent />);
    fireEvent.click(getByTestId('button'));
    expect(mockFoo).toHaveBeenCalledWith('expected-arg');
  });

  test('should react to async changes', async () => {
    const { getByTestId } = render(<MyComponent />);
    // trigger something async (e.g. MutationObserver, promise)
    await waitFor(() => {
      expect(getByTestId('output').textContent).toContain('expected');
    });
  });
});
```

---

## Common Gotchas

1. **React import** — JSX files need `import React from 'react'` because the project doesn't use the automatic JSX transform in test config.

2. **MutationObserver is async** — jsdom supports `MutationObserver`, but callbacks fire asynchronously. Use `await waitFor(() => ...)` to assert after mutations.

3. **`jest.clearAllMocks()` in `beforeEach`** — always reset between tests to avoid cross-test leakage.

4. **Querying inputs** — prefer `data-testid` in component mocks over fragile `container.querySelectorAll('input')[n]` indexing.

5. **SCSS modules** — `identity-obj-proxy` returns the class name string as-is. `styles['font-size']` returns `'font-size'` in tests.

6. **Snapshot tests** — when adding/removing UI elements, run `pnpm test <file> -u` to update snapshots.

7. **Antd components** — often need mocking because they have complex internals. Mock only the components you use:
   ```ts
   jest.mock('antd', () => ({
     Button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
     ConfigProvider: ({ children }: any) => children,
   }));
   ```

---

## When to Create a `__mocks__` File

Create a centralized mock in `packages/core/src/__mocks__/@core/...` when:

- The module is imported by **4+ test files** (common widgets, stores, helpers)
- The mock is non-trivial (more than a single `jest.fn()`)
- The mock needs to maintain state across calls (like store mocks)

Place the mock at the same relative path under `__mocks__/@core/` as the source is under `src/web/`.
Example: `src/web/app/widgets/UnitInput.tsx` → `src/__mocks__/@core/app/widgets/UnitInput.tsx`

Jest auto-resolves these via the `moduleNameMapper` (`@core/*` → `src/web/*`, with `__mocks__` taking precedence).

**Maintenance**: After creating a new `__mocks__` file, update the "Existing `__mocks__`" table in this skill doc so future tests know not to re-mock it.
