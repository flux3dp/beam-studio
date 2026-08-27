---
name: layer-management
description: Layer system architecture — layerManager as the single mutation API, the passive layerStore, Layer DOM wrappers, and the resync/identifyLayers semantics. Use when reading or writing layer state, adding layer operations, debugging layer-panel/undo desyncs, or writing specs for code that imports layerManager.
---

# Layer Management System

## Purpose

Layers are `<g class="layer">` elements inside `#svgcontent`, each with a `<title>` child holding the
layer name (names are unique and are the primary key everywhere). The DOM is the source of truth for
layer *content*; an in-memory cache of `Layer` objects plus selection state lives in a Zustand store
so React can subscribe. One rule keeps the two consistent:

**layerManager is the ONLY writer of layer state. Never call `useLayerStore.setState` outside
`svgedit/layer/` — an ESLint `no-restricted-syntax` rule in eslint.config.js enforces this**
(specs and `__mocks__` are exempt; specs seed state with `useLayerStore.setState`).

## File Locations

- `packages/core/src/web/app/svgedit/layer/layerManager.ts` — the whole mutation API (singleton `layerManager`)
- `packages/core/src/web/app/svgedit/layer/layer.ts` — `Layer` class wrapping one `<g class="layer">` group
- `packages/core/src/web/app/stores/layer/layerStore.ts` — passive state container, NO actions
- `packages/core/src/web/helpers/layer/layer-helper.ts` — high-level operations (clone/merge/move/lock, UI alerts, history batches)
- `packages/core/src/web/helpers/layer/deleteLayer.ts` — delete flows + default-layer fallback
- `packages/core/src/web/helpers/layer/layer-config-helper.ts` — per-layer `data-*` config read/write

## State Shape (layerStore)

| Field | Meaning |
|---|---|
| `layers: Layer[]` | all layers, bottom → top, mirrors DOM order |
| `currentLayerName: null \| string` | layer receiving new elements |
| `selectedLayers: string[]` | panel selection (never left empty by `setSelectedLayers`) |
| `hasVector`, `hasGradient` | derived flags for the selected layers (gradient = Promark only) |

## How to Access Layer State

- **React component, reactive**: `useLayerStore((s) => s.selectedLayers)` — subscription only.
- **Imperative read** (event handler, class method, helper): a `layerManager` getter
  (`getSelectedLayers()`, `getCurrentLayerName()`, …). Prefer this in new code; a number of older
  call sites (mostly ConfigPanel blocks) still read `useLayerStore.getState().selectedLayers`
  directly, which is tolerated but not the pattern to copy — converting them is deferred only
  because each converted component's specs then need `getSelectedLayers` in their inline
  layerManager mock factory.
- **Any write**: a `layerManager` method. No exceptions (ESLint-enforced).

Rule of thumb: the hook exists to make React re-render; layerManager is the API. A component that
never subscribes (e.g. a class component like LayerPanel) should not import the store at all.

## Key layerManager Methods

- `setSelectedLayers(names, currentLayer?)` — sets selection AND current layer (defaults to
  `names[0]`; empty input falls back to `[currentLayerName]`), then re-runs `checkVector`/`checkGradient`.
  Never pair it with a preceding `setCurrentLayer` call — that's redundant.
- `identifyLayers()` — **fresh-document semantics**: rebuilds `Layer[]` from the DOM, adopts orphan
  visible elements into a new `Layer N`, resets current layer to the top. Use after loading/replacing
  a document (`setSvgContent` does this).
- `resync()` — **same-document semantics**: rebuilds from the DOM but PRESERVES current layer and
  selection when the names survive (dead current → first surviving selected → top layer; empty
  selection → `[current]`). Use after undo/redo or any operation that mutated layer groups behind the
  manager's back. Undo/redo already calls it centrally in `svgedit/history/utils/index.ts` — do NOT
  add `cmd.onAfter = resync` sprinkles or re-call it after undoable commands.
- `checkVector()` / `checkGradient(workarea?)` — recompute the derived flags; auto-run on selection
  change, call manually only after mutating layer content in place (e.g. infill toggle).
- `createLayer(name?, historyOptions?)` — creates group + title in the DOM, registers it, makes it
  current. Prefer `layer-helper`'s `createLayer` wrapper when you need color/config/fullcolor init.
- `removeLayerByName(name, historyOptions?)` — detaches the group AND unregisters it from the store,
  so the name is immediately free for reuse (a stale registration once caused delete-then-recreate
  to yield "Layer 1 1"). If it was current, the top remaining layer becomes current. The
  `deleteLayerByName` helper in `helpers/layer/deleteLayer.ts` is a thin delegate to this.
- `reset(svgContent, identifyLayers?)` — repoint at a new `#svgcontent` (document swap).

`Layer` objects expose `getGroup()`, `setVisible`, `setName`, `setColor`, `setOpacity`,
`setFullColor`, `removeGroup` — attribute-level operations on the `<g>`; the undo-relevant ones
(`setVisible`, `setName`, `removeGroup`) emit history commands.

## Choosing identifyLayers vs resync

Ask: "is the user still working in this document?" Yes → `resync()` (selection must survive).
No / document just loaded → `identifyLayers()`. Calling `identifyLayers()` before `resync()` is a
bug, not belt-and-braces: identifyLayers resets current to top FIRST, and resync then faithfully
preserves that wrong value.

## Testing Gotchas

- The central mock `src/__mocks__/@core/app/stores/layer/layerStore.ts` is state-only
  (defaults: `selectedLayers: ['layer1']`, `currentLayerName: 'layer1'`). Seed with
  `useLayerStore.setState({...})`. There are no action mocks on it.
- Mock layerManager **inline per spec** with a factory containing only the members the code under
  test calls. Do NOT create a global `__mocks__` for layerManager — many specs exercise the real one.
- A spec whose component loads the REAL layerManager can crash with a `p-queue` ESM SyntaxError via
  the chain layerManager → layer.ts → undoManager → currentFileManager → dialog-caller → … →
  helpers/api/camera → p-queue. The fix is the inline layerManager mock above.

## Known Legacy Touchpoint

`cloneLayer` in layer-helper still uses `svgCanvas.getCurrentDrawing().copyElem` — the legacy
`public/js/lib/svgeditor/draw.js` survives only as the element-ID allocator + copyElem (clipboard
uses it too). Porting `svgedit.utilities.copyElem` to TS would remove it for both.
