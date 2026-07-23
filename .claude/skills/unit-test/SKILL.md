---
name: unit-test
description: Jest unit-test conventions for Beam Studio — spec layout, mocking patterns, and the shared __mocks__ inventory. Use when writing, updating, or debugging any *.spec.ts or *.spec.tsx file.
---

# Unit Test Skill

Guide for writing Jest unit tests in the Beam Studio codebase. Follow it literally — every
rule here was derived from the 400+ existing spec files; do not invent alternative patterns.

For Cypress E2E specs (release-test automation under `apps/web/cypress/`), see
`.claude/skills/e2e-test/SKILL.md`. For the coverage roadmap, see `docs/testing/test-coverage-plan.md`.

## Framework & Config

- **Runner**: Jest 30 with `ts-jest`, environment `jsdom`
- **Assertion/DOM**: `@testing-library/react`, `@testing-library/jest-dom`
- **Test files**: `*.spec.tsx` / `*.spec.ts`, colocated next to the source file
- **Run**: `pnpm test <filename>` (e.g. `pnpm test FontSizeBlock`)
- **Update snapshots**: `pnpm test <filename> -u`

### Environment facts (from `jest.config.ts` + `setupTests.ts` — already set up, do NOT redo)

| Fact | Consequence for your test |
|---|---|
| `jest-canvas-mock` is in `setupFilesAfterEnv` | `<canvas>` 2D context calls don't throw; you can render canvas components |
| `jest-fetch-mock` is enabled globally | Use `fetchMock.mockResponseOnce(...)` for `fetch`; no need to mock `fetch` yourself |
| `jest.mock('uuid')` is global | `uuid.v4()` always returns `'mock-uuid-v4'` |
| `window.$` / `window.jQuery` = real jQuery | Legacy svgedit code using `$` works in tests |
| `window.svgedit.NS` is pre-populated | Namespace constants (SVG, XLINK, …) resolve without mocking |
| `window.FLUX` and `window.electron` exist as `{}` | Extend them per-test if code reads properties: `window.FLUX.version = '2.6.9' as any` |
| `process.env.TZ = 'Asia/Taipei'` (globalSetup) | Date-formatting assertions are deterministic — write them for UTC+8 |
| `structuredClone` = JSON round-trip polyfill | Don't rely on it preserving Dates/Maps/functions in tests |
| `BroadcastChannel` is a no-op mock | Code using it won't crash, but messages never deliver |
| `matchMedia` mock: `matches = query.includes('max-width')` | Mobile-media queries match by default; desktop (`min-width`) don't |
| Antd `css-dev-only-do-not-override-*` hashes are normalized by a snapshot serializer | Antd class hashes won't break snapshots |
| `.module.scss` → `identity-obj-proxy` | `styles['font-size']` returns the string `'font-size'` |
| `.svg` imports → `svgrMock.ts`, `.svg?url` → `urlMock.ts` | Never mock SVG assets |

### Path Aliases in Tests

```
@core/*                 → packages/core/src/web/*
@core/implementations/* → packages/core/src/implementations/*   (core's own stubs, NOT the app/web ones)
@mocks/*                → packages/core/src/__mocks__/*
```

---

## Step 0: Pick the Right Kind of Test

| Source under test | Test kind | Primary pattern |
|---|---|---|
| Pure helper / math / formatter (`helpers/*`, `utils/*`) | Plain function test | Import directly, mock only its imports (§Pattern 1) |
| React component | `render()` + interaction | Mock children/deps, assert DOM (§Template) |
| Custom hook (`use*`) | `renderHook()` | §Pattern 8 |
| Zustand store | Call store API directly | §Pattern 9 |
| svgedit operation (`app/svgedit/*`) | Function test with `getSVGAsync` mock | §Pattern 6 |
| API client (`helpers/api/*`) | async test with mocked transport | §Pattern 10 |
| Timer/debounce/animation logic | Fake timers | §Pattern 11 |

If the logic you want to test is buried inside a component, prefer extracting it to a
colocated `utils/` file and unit-testing that, over simulating it through the UI.

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
| `@core/app/pages/Settings/useSettingStore` | in-memory settings store |
| `@core/app/contexts/CanvasContext` | stub context provider |
| `@core/app/widgets/UnitInput` | renders real `<input>` with `onChange` wired to `Number(e.target.value)` |
| `@core/app/widgets/Input` | simplified input mock |
| `@core/app/components/.../NumberBlock` | simplified block mock |
| `@core/app/constants/presets` | stub presets |

Known codebase inconsistency: ~15 older specs inline-mock `@core/helpers/i18n` anyway. That
is legacy — **new tests must rely on the central mock**, and if you touch an old test that
re-mocks i18n, delete the inline mock.

---

## Mock Patterns

### 1. Simple function mock (most common)

```ts
const mockGetFontSize = jest.fn();
const mockSetFontSize = jest.fn();

jest.mock('@core/app/svgedit/text/textedit', () => ({
  getFontSize: (...args: any[]) => mockGetFontSize(...args),
  setFontSize: (...args: any[]) => mockSetFontSize(...args),
}));
```

- Declare `const mockXxx = jest.fn()` **before** `jest.mock()` (hoisting makes this work)
- Wrap in arrow so the mock variable is captured at call time
- **No `__esModule: true`** needed — only plain object exports

### 2. Default export — when to use `__esModule`

**Default-only is the common case — collapse it to ONE layer. Do NOT write `{ __esModule: true, default: X }`.**
Because the spec tsconfig has `esModuleInterop: true`, a bare factory return `X` is delivered as the
default import (`import foo from 'mod'` → `foo === X`). The `__esModule: true` / `default:` wrapper is
pure noise for default-only modules — this applies whether the default is a **function** OR an **object**:

```ts
// Default is an OBJECT (module has: export default { open }) — return the object directly:
jest.mock('@core/implementations/browser', () => ({ open: (...args: any[]) => mockOpen(...args) }));

// Default is a FUNCTION (module has: export default () => ...):
jest.mock('@core/helpers/is-web', () => () => mockIsWeb());
jest.mock('@core/helpers/check-device-status', () => (...args: any[]) => mockStatus(...args));

// Named-only module (no default):
jest.mock('@core/some/module', () => ({ foo: mockFoo }));
```

The one-layer object form works because `import foo from 'mod'; foo.open()` resolves `foo` to the whole
returned object under `esModuleInterop`. A default import reads identically to the two-layer form, so
there is no reason to keep the wrapper.

Only use `__esModule: true` when the module-under-test imports **both** the default **and** a named
export from the same module (`import history, { BatchCommand } from '...'`) — then you genuinely need both
keys on the mock:

```ts
// convertToPath.ts does: import history, { BatchCommand } from '.../history'
jest.mock('@core/app/svgedit/history/history', () => ({
  __esModule: true,
  BatchCommand: FakeBatchCommand,              // used via the NAMED import
  default: { BatchCommand: FakeBatchCommand }, // used via `history.BatchCommand`
}));
```

If the code only uses the default (`import history from '...'; history.BatchCommand`), drop the named key
and the `__esModule` wrapper — collapse to `() => ({ BatchCommand: FakeBatchCommand })`.

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
    { getState: () => ({ count: 0, increment: jest.fn() }), setState: jest.fn() },
  ),
}));
```

For stores with `__mocks__` files (storageStore, documentStore, etc.), just import normally —
the mock is auto-resolved. To seed state in those, call the mock store's own setters in
`beforeEach` (e.g. `useDocumentStore.setState({ workarea: 'ado1' })`).

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

`svg-editor-helper` exposes the canvas via a callback. Mock only the namespaces and methods
the code under test actually calls — the real object is enormous:

```ts
jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb: any) => cb({
    Canvas: {
      changeSelectedAttribute: jest.fn(),
      getSelectedElems: () => mockSelectedElems(),
      pathActions: { toEditMode: jest.fn() },
      undoMgr: { addCommandToHistory: mockAddCommandToHistory },
    },
    Edit: {},   // add if used
    Editor: {}, // add if used
  }),
}));
```

Commonly needed `Canvas` members across existing tests: `changeSelectedAttribute`,
`getSelectedElems`, `undoMgr.addCommandToHistory`, `undoMgr.beginUndoableChange` /
`finishUndoableChange`, `pathActions`, `setMode`, `clearSelection`, `addToSelection`.
Assert history behavior via the `BatchCommand` mock (§5) plus `addCommandToHistory`.

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

### 8. Hooks — `renderHook` + `jest.spyOn`

For custom hooks, do NOT mount a throwaway component — use `renderHook`:

```ts
import { renderHook } from '@testing-library/react';
import useMouseDown from './useMouseDown';

describe('useMouseDown', () => {
  test('registers and cleans up listener', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const handler = jest.fn();

    const { unmount } = renderHook(() => useMouseDown({ mouseDown: handler }));
    expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

    document.dispatchEvent(new MouseEvent('mousedown'));
    expect(handler).toHaveBeenCalledTimes(1);

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });
});
```

- `jest.spyOn` is for **observing real objects** (document, window, existing modules);
  `jest.mock` is for **replacing modules**. Restore spies with `jest.restoreAllMocks()` in
  `afterEach` if you changed behavior with `.mockImplementation`.
- To re-run a hook with new props: `const { rerender } = renderHook((p) => useX(p), { initialProps })`.

### 9. Testing Zustand stores directly

Stores are testable without React. The global `zustand` mock auto-resets state after each test:

```ts
import { useMyStore } from './myStore'; // real store; deps must be mocked/`__mocks__`-covered

test('addLayer appends and selects', () => {
  useMyStore.getState().addLayer('Layer 2');
  expect(useMyStore.getState().layers).toHaveLength(2);
  expect(useMyStore.getState().selected).toBe('Layer 2');
});
```

Mock the store's *dependencies* (event emitters, svgCanvas, api clients), not the store itself.

### 10. Async API clients (`helpers/api/*`)

Mock the transport (axios instance / websocket wrapper), then `await` the public function:

```ts
const mockPost = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  axiosFluxId: { post: (...args: any[]) => mockPost(...args) },
  getCurrentUser: () => ({ email: 'test@flux3dp.com' }),
}));

import { recordActivity } from './cloud';

test('posts activity and returns data', async () => {
  mockPost.mockResolvedValueOnce({ data: { status: 'ok' } });
  const res = await recordActivity();
  expect(mockPost).toHaveBeenCalledWith('/user/activity', expect.anything());
  expect(res.status).toBe('ok');
});
```

For websocket-based helpers, mock the `Websocket` factory module and drive the registered
`onMessage` handler manually. For raw `fetch`, use the globally-enabled `jest-fetch-mock`
(`fetchMock.mockResponseOnce(JSON.stringify({...}))`).

### 11. Fake timers (debounce, animation, polling)

```ts
describe('with timers', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers()); // ALWAYS restore — leaked fake timers break later suites

  test('debounces', () => {
    triggerThing();
    expect(mockFn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
```

If a promise resolves behind a timer, use `await jest.advanceTimersByTimeAsync(ms)`.
Never combine fake timers with `waitFor` default timing — pass
`{ timeout }` or advance timers manually first.

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

## Snapshot Policy

Snapshots are heavily used (~600 `toMatchSnapshot` calls) but easy to abuse:

- **One render snapshot per meaningful state** (default render, and optionally one per
  significant mode/prop combination). Do not snapshot after every interaction — assert the
  specific changed attribute/text instead.
- A snapshot test **never replaces** behavioral assertions (`toHaveBeenCalledWith`, DOM
  queries). Add both.
- When a snapshot fails: read the diff. If the change is intended, run
  `pnpm test <file> -u` and eyeball the updated `.snap`. If you cannot explain the diff,
  the test caught a bug — do not blindly update.
- Antd hash noise and `transform-origin: NaNpx` are already normalized by serializers.

---

## Anti-Patterns (do NOT introduce; fix on touch)

1. **Index-based selectors** — `container.querySelectorAll('button')[2]` breaks on any DOM
   reorder. Use `data-testid`, roles, or text queries.
2. **Re-mocking `@core/helpers/i18n`** (or any module in the `__mocks__` table) inline.
3. **Copy-pasting a giant `getSVGAsync` mock** from another test with members your test never
   uses — mock only what the code under test touches.
4. **Asserting on translated strings** for logic tests — assert on the i18n key path or the
   mock call instead, so language-file edits don't break logic tests. (Snapshot tests using the
   real `en.ts` via the central i18n mock are fine.)
5. **`await new Promise(r => setTimeout(r, 100))`** — use `waitFor` or fake timers.
6. **Testing a component just to reach a pure function** — extract and test the function.
7. **`{ __esModule: true, default: X }` for a default-only mock** — collapse to `() => X` (works for
   object AND function defaults under `esModuleInterop`, see §Pattern 2). Keep `__esModule` only when the
   code imports the default AND a named export from the same module.

---

## Common Gotchas

1. **React import** — JSX files need `import React from 'react'` because the project doesn't use the automatic JSX transform in test config.

2. **MutationObserver is async** — jsdom supports `MutationObserver`, but callbacks fire asynchronously. Use `await waitFor(() => ...)` to assert after mutations.

3. **`jest.clearAllMocks()` in `beforeEach`** — always reset between tests to avoid cross-test leakage.

4. **Querying inputs** — prefer `data-testid` in component mocks over fragile `container.querySelectorAll('input')[n]` indexing.

5. **SCSS modules** — `identity-obj-proxy` returns the class name string as-is. `styles['font-size']` returns `'font-size'` in tests.

6. **Snapshot tests** — when adding/removing UI elements, run `pnpm test <file> -u` to update snapshots (see Snapshot Policy).

7. **Antd components** — often need mocking because they have complex internals. Mock only the components you use:
   ```ts
   jest.mock('antd', () => ({
     Button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
     ConfigProvider: ({ children }: any) => children,
   }));
   ```

8. **Timezone** — tests run under `Asia/Taipei` (UTC+8); write date assertions accordingly.

9. **jsdom has no real layout** — `getBoundingClientRect` returns zeros, `offsetWidth` is 0.
   Code that measures the DOM needs those methods stubbed
   (`jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({...} as DOMRect)`).

10. **SVG geometry APIs are missing in jsdom** — `getBBox`, `getTotalLength`,
    `getPointAtLength`, `createSVGMatrix` etc. don't exist. Stub them on the prototype or the
    element instance before exercising svgedit code that calls them.

---

## Finish Checklist

Before declaring a test done:

- [ ] `pnpm test <filename>` passes locally (all tests, not just the new one)
- [ ] No module from the `__mocks__` table is re-mocked inline
- [ ] No default-only mock wrapped in `{ __esModule: true, default: X }` — collapsed to `() => X` (§Pattern 2)
- [ ] `jest.clearAllMocks()` in `beforeEach`; `jest.useRealTimers()` restored if faked
- [ ] Interactions asserted via mock-call args or DOM state, not only snapshots
- [ ] No index-based `querySelectorAll` selectors
- [ ] New central mock added? → update the `__mocks__` table in this file

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

Candidate for extraction (recurring inline duplication observed): a configurable
`svg-editor-helper` mock — if you find yourself writing the third copy of a `getSVGAsync`
structure, extract it.

---

## Appendix: High-Value Coverage Gaps (pick from here when asked to "add tests")

Pure or near-pure logic with **no unit tests** today — highest value per effort:

| Area | Files | Notes |
|---|---|---|
| Smart nesting / auto-fit | `app/svgedit/operations/autoFit/autoFit.ts`, `dialogs/autoFit/apply.ts` | Packing algorithm, deterministic in/out |
| Text-to-path | `helpers/convertToPath.ts`, `helpers/convertElementsToPathInTempGroup.ts` | Needs SVG geometry stubs (Gotcha 10) |
| Material test generator | `dialogs/MaterialTestGeneratorPanel/generateSvgInfo.ts`, `TableSetting.ts`, `TextSetting.ts` | Pure SVG-grid generation |
| Curve engraving math | `helpers/device/curve-measurer/*`, `actions/canvas/curveEngravingModeController.ts` | Focus-point/mesh/>45° checks |
| Rotary axis | `actions/canvas/rotary-axis.ts` | Ratio helpers already tested; axis transform is not |
| Google Fonts service | `helpers/fonts/googleFontService.ts`, `webFonts.google.ts` | Cache spec exists; service does not |
| Boxgen geometry | `helpers/boxgen/` (vector2d, shapeHelper, lineShader) | UI has specs; math does not |
| Cloud files | `helpers/api/cloudFile.ts`, `helpers/api/flux-id/*` | Mock axios; test 5-file-limit & CRUD paths |
| Auto-save | `helpers/auto-save-helper.ts` | Fake timers + mocked fs/storage |
| Tab controller | `app/actions/tabController.ts` (+ `apps/app/src/node/tabManager.ts`) | Mock communicator/ipc |
| Stores | `app/stores/*` (only 2 of ~15 tested) | Direct store tests, §Pattern 9 |
