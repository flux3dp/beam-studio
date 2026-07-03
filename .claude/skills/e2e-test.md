# E2E Test Skill (Cypress)

Guide for writing Cypress E2E specs in Beam Studio. The release-test spreadsheet
("Beam Studio Test") is automated almost entirely through these specs, so **every new
release-test automation lands here** unless it is pure logic (then prefer a Jest unit test —
see `.claude/skills/unit-test.md`). Coverage roadmap: `docs/testing/test-coverage-plan.md`.

## Layout & Commands

- Specs: `apps/web/cypress/e2e/<area>/<name>.spec.ts`
  - Areas: `canvas/`, `left-panel/`, `right-panel/`, `top-bar/`, `modify/`, `preference/`,
    `machine/`, `mobile-web/` (+ root-level `shortcut.spec.ts`)
  - Name specs after the feature (`boxgen.spec.ts`), kebab-case, matching the spreadsheet's
    "Automation Test Status" column when it names a file.
- Support: `apps/web/cypress/support/commands.ts` (custom commands), `e2e.ts` (global hooks),
  `utils.ts` (md5 helper etc.), `Icommand.d.ts` (types — **add new commands here too**)
- Fixtures: `apps/web/cypress/fixtures/` (flat; svg/png/jpg/pdf/ai/dxf/beam samples)
- Run locally: start web dev server (`pnpm nx run web:start`, port 8080), then
  `pnpm nx run web:cy:dev` for the interactive runner.
- Configs: `cypress.config.ts` (local, baseUrl `http://localhost:8080`, 3 retries in run
  mode, 15s command timeout, viewport 1280×800), `cypress.config.ci.ts` (GitHub Actions,
  `envType: 'github'`, no machine IP), `cypress.config.prod.ts`.

## CI Reality (know this before writing a spec)

- `.github/workflows/web.e2e.yml`: builds web dist once, then **5 parallel Windows
  containers** run the whole suite via Cypress Cloud (`record: true, parallel: true`) against
  `serve dist -l 8080`. There is **no spec tagging/grep** — every spec file runs in CI.
- **No FLUXGhost and no machine exist in CI.** Anything needing a backend or device must
  self-skip (pattern below) and is exercised only in local runs.
- Unit tests/lint run separately in `global.ci.yml` (`nx affected`).

## Skeleton for a New Spec

```ts
describe('boxgen', () => {
  beforeEach(() => {
    cy.landingEditor();               // fresh editor at /#/studio/beambox
  });

  it('adjusts width and exports layers to canvas', () => {
    cy.getMenuItem(['Tools', 'Box Generator'], 'Box Generator');
    // ... interact ...
    cy.get('#svgcontent').should('contain.html', 'data-boxgen');
  });
});
```

### Machine/FLUXGhost-dependent specs MUST self-skip on CI

```ts
const isRunningAtGithub = Cypress.env('envType') === 'github';

describe('camera preview', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => cy.log('skip test on github'));
    return;
  }
  beforeEach(() => {
    cy.setUpBackend(Cypress.env('backendIP')); // stores IP in localStorage.host
    cy.landingEditor();
    cy.connectMachine(Cypress.env('machineName')); // waits up to 150s
  });
  // ...
});
```

Env available: `backendIP`, `machineName`, `adorName`, `username`, `password`,
`envType ('local' | 'github')`, `cypressDownload*Path` (per-filetype download dirs).

## Custom Commands (use these — do not reimplement)

| Command | Purpose |
|---|---|
| `cy.landingEditor(opts?)` | Go to editor with localStorage prepared |
| `cy.loginAndLandingEditor(opts?)` | FLUX ID login flow, then editor |
| `cy.uploadFile(name, type?)` / `cy.uploadImage(name)` | Import fixture via DataTransfer; `uploadImage` waits for base64 `<img>` in `#svgcontent` |
| `cy.waitForProgress(t?)` / `cy.waitForImageProcessing(t?)` | Wait out progress overlays / heavy ops |
| `cy.getMenuItem(path[], target, opts?)` | Idempotent top-menu walker (self-heals if menu closes) |
| `cy.go2Preference()` / `cy.goToSettingsCategory(cat)` / `cy.applySettings()` | Preferences dialog navigation |
| `cy.clickToolBtn(id, checkActive?)` / `cy.clickToolGroupBtn(group, option)` / `cy.checkToolBtnActive(id)` | Left-panel tools (`#left-{id}`) |
| `cy.changeWorkarea(name, save?)` | Document Settings → workarea dropdown |
| `cy.selectPreset(name)` | Config-panel preset dropdown |
| `cy.moveElementToLayer(layer, needConfirm?)` | Layer select dropdown |
| `cy.showPanel('layers' \| 'objects')` | Right-panel tab |
| `cy.setUpBackend(ip)` / `cy.connectMachine(name)` | Machine wiring (local only) |
| `cy.dragTo(target)` | dragstart/dragenter/dragend drag-and-drop |
| `cy.inputValueCloseTo(sel, value, tolerance)` | Float-tolerant input assertion |
| `cy.inputText(value)` | `cy.realType()` keyboard-event typing (needed for canvas text) |
| `cy.disableImageDownSampling()` | Preference tweak via localStorage |
| `cy.getElementTitle()` / `cy.getTopBar()` | Scoped getters |

New reusable flow used by ≥2 specs → add a command in `commands.ts` **and** declare it in
`Icommand.d.ts`.

## Selector & Assertion Conventions

- Canvas elements get sequential ids: `#svg_1`, `#svg_2`, … under `#svgcontent`.
- Prefer, in order: `data-testid` / `cy.findByTestId` (Testing Library) → stable ids
  (`#left-Rectangle`, `#svgcontent`) → module-class contains-matchers
  (`div[class*="LayerList-module__row"]`) → Antd structural classes (`.ant-modal-body`).
  Never rely on the full hashed module class name.
- **Content correctness**: assert on `#svgcontent` HTML (`cy.get('#svg_1').should('have.attr', 'd', ...)`)
  or md5/crc32 checksums (`support/utils.ts` md5; used for imported/exported file bodies).
  Checksums may differ per platform — existing specs branch on `Cypress.platform === 'win32'`
  and `isRunningAtGithub` with per-platform expected hashes.
- **Exports**: files land in `Cypress.env('cypressDownloadXxxPath')`; read with `cy.readFile`
  and checksum. A `deleteFile` task exists in `plugins/index.ts`.
- **Waits**: never bare `cy.wait(ms)`. Use `should()` retries with explicit `{ timeout }`,
  `cy.waitForProgress()`, or `cy.window().its('svgCanvas').should('exist')`.
- There is **no visual-regression tooling** — do not write style/appearance assertions beyond
  attributes/classes; the spreadsheet marks pure-style checks as human-only.

## Flakiness Rules

1. Run-mode retries are 3; a spec that needs retries to pass locally is broken — fix the wait.
2. `cy.session` caching in `landingEditor` is intentionally not shared across specs
   (parallel CI containers) — don't add cross-spec state.
3. Global hooks already: clear service-worker caches, suppress `beforeunload`, swallow
   uncaught app exceptions. Don't re-handle these per spec.
4. Suite must stay parallelizable: each spec self-contained, no ordering assumptions,
   fixtures read-only.
5. Float coordinates: use `cy.inputValueCloseTo` or regex/`closeTo` assertions, not exact
   pixel equality.

## Spreadsheet Mapping Discipline

When you automate a spreadsheet row, the spec filename must end up in the sheet's
"Automation Test Status" column. Cases whose status names a nonexistent file are **coverage
lies** — as of 2026-07, these referenced specs do not exist and need creating (or the sheet
corrected): `boxgen.spec.ts`, `qrcode.spec.ts`, `search-font.spec.ts`,
`speed-limit-warning.spec.ts`, `svg-pdf-ai.spec.ts`, `weld-text&path.spec.ts`.

## What NOT to automate in Cypress

- Pure logic (path math, parameter tables, encoders) → Jest unit test instead.
- Physical-machine behavior (engraving output, rotary motion, firmware update, camera image
  quality) → human release checklist.
- Electron-only surfaces (native menu, multi-tab WebContentsView, window management) —
  there is **no Electron E2E harness**; don't try to fake it in the web suite.
