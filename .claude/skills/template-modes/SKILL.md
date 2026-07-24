---
name: template-modes
description: The four interaction modes (editor / project / template / explore), the per-element editable-attribute system that drives them, and the tablet/mobile layout store. Use when adding UI that must behave differently per mode, gating an object property as editable, or touching interactionModeStore / layoutStore / stores/element.
---

# Interaction Modes & Editable Properties

## Purpose

Beam Studio's canvas runs in one of **four interaction modes**. `editor` is the classic
full-featured editor. The other three exist to author and consume *templates*: a designer
builds a template in `project` mode, marking which properties of each object an end customer
may change; the customer then opens it in `template` / `explore` mode and can only touch the
properties that were unlocked.

## The Four Modes

| Mode | When | Meaning |
|---|---|---|
| `editor` | `template_creation_mode` preference is **off** | Normal editor. Everything is editable; the editable system is bypassed entirely. |
| `project` | preference on, not in template mode | Template **authoring**. Full editing power, plus ContentLibrary, per-property editable toggles, and template preview. |
| `template` | preference on, template mode on, explore off | Template **consumption**, unlocked. |
| `explore` | preference on, template mode on, explore on | Template consumption, locked-down. Entered automatically whenever template mode is entered. |

`explore` and `template` are collectively `templateModes` — most UI branches on
"am I in one of these two?" rather than on the individual mode.

### File Locations

- `packages/core/src/web/app/stores/interactionModeStore.ts` — the mode state machine
- `packages/core/src/web/app/stores/layoutStore.ts` — desktop / tablet / mobile layout
- `packages/core/src/web/helpers/element/editable/` — `base.ts`, `getter.ts`, `setter.ts`
- `packages/core/src/web/app/stores/element/` — `selectedElementStore.ts`, `utils.ts`, `interface.ts`

## interactionModeStore

The mode is **derived**, never set directly:

```ts
templateCreationMode === false      → 'editor'
templateCreationMode && !_templateMode → 'project'
templateCreationMode && _templateMode && _exploreMode  → 'explore'
templateCreationMode && _templateMode && !_exploreMode → 'template'
```

`_templateMode` / `_exploreMode` are **module-level variables outside the store**, mutated only
through `setTemplateMode()` / `setExploreMode()`. `template_creation_mode` lives in
`useGlobalPreferenceStore` and is subscribed to; changing it recomputes the mode.

`setTemplateMode(true)` also sets `_exploreMode = true` — entering template mode always lands
in explore.

### Reading the mode

```ts
// Non-reactive (event handlers, plain helpers, svgedit internals)
isInteractionMode('project')            // exact match
withinInteractionModes(templateModes)   // any of a set

// Reactive (React components)
useIsInteractionMode('project')
useWithinInteractionModes(templateModes)
```

Use the hooks in components. Using `getState()` in a function that produces React output means
the UI will **not** update when the mode or `editableInfo` changes — see `ObjectPanel/tabs.tsx`
`displayTabs()` for an existing instance of this.

### Escape hatch out of explore mode

`tryExitingExploreMode()` requires **10 calls within 1s of each other** before it calls
`setExploreMode(false)`. It is wired to a deliberately obscure gesture so end customers don't
leave explore mode by accident.

### Template preview

`project` mode can preview the template as a customer would see it. The flow:

1. `showTemplateModePreview()` opens `TemplatePreviewModal`.
2. `TemplatePreview.tsx` renders an `<iframe src={origin}?templatePreview=true{hash}>`.
3. Inside the iframe, `initTemplatePreviewFromQuery()` (module side-effect in
   `interactionModeStore.ts`) sees the query param, calls `setTemplateMode(true)`, and strips
   the param from the URL.
4. The iframe's `initTemplatePreviewReceiver()` posts `TEMPLATE_PREVIEW_READY` to the parent.
5. The host answers with `TEMPLATE_PREVIEW_SET_CONTENT` carrying a transferred `.beam`
   ArrayBuffer; the iframe calls `beamFileHelper.readBeam()` on it.

Contract constants live in `app/components/dialogs/templatePreview/constants.ts`.
The buffer is transferred (not copied) and sent exactly **once**.

## layoutStore

Layout is derived from screen size **and** interaction mode:

```
isMobile                              → LayoutKey.Mobile
isTablet || withinInteractionModes(templateModes) → LayoutKey.Tablet
otherwise                             → LayoutKey.Desktop
```

The second line is the important one: **a desktop-width window in explore/template mode uses
the tablet layout.** Template consumers always get the touch-oriented UI.

```ts
isMobile() / isTablet() / isTabletOrMobile() / isDesktop()          // non-reactive
useIsMobile() / useIsTablet() / useIsTabletOrMobile() / useIsDesktop()  // reactive
```

Import these from `@core/app/stores/layoutStore`, **not** from `screenStore` — `screenStore`
holds raw viewport breakpoints and does not know about interaction modes.

`RwdModal` maps layout → presentation: Mobile = bottom drawer (`AutoHeightDrawer`),
Tablet = `FloatingPopover`, Desktop = renders nothing.

## The Editable System

### Data model

Each element carries a `data-editable` attribute holding a JSON array of `ControlType`
**numeric enum values**, or the string `'*'` meaning everything:

```html
<text data-editable="[0,11,12]" .../>
<use data-editable="*" .../>
```

`ControlType` (`editable/base.ts`) enumerates every individually gateable control:
text content/transform/vertical, font family/style/size, fit-text & textpath alignment,
textpath offset, line & letter spacing, position X/Y/X2/Y2, size, rotation, flip, infill,
path infill, library, delete.

> **These numbers are persisted into `.beam` template files.** Inserting or removing an enum
> member shifts every later value and silently corrupts the editable flags of every existing
> template. Only ever append to the enum, or migrate deliberately.

`ControlTypes` is a hand-maintained array of every member; `allEditableInfo` is built from it.
A new enum member that isn't added to `ControlTypes` will be silently dropped on serialization.

### Mode overrides

`getOverrideValue()` in `editable/getter.ts` short-circuits before the attribute is read:

| Situation | Result |
|---|---|
| mode is `editor` | `allEditableInfo` — everything editable |
| temp group (multi-select) in `project` | `allEditableInfo` |
| temp group in `template` / `explore` | `{}` — nothing editable |
| otherwise | fall through to `data-editable` |

Multi-select editing is therefore not supported in template/explore mode by design.

### Reading

```ts
parseEditableInfo(elem): EditableInfo            // raw attribute → { [ControlType]: true }
getEditableInfo(elem, controllableTypes): MultiValue<EditableInfo>
                                                  // → { [ControlType]: { value, hasMultiValue } }
getControllableType(elem, objectPanelContext): ControlType[]
                                                  // which controls this element even *has*
```

`getControllableType` derives the applicable control set from the element's tag and its
`ObjectPanelContext` (`RightPanel/OptionsBlocks/utils.ts`) — e.g. `line` gets `POSITION_X2/Y2`
instead of `_SIZE`; text controls only appear when `textOptions` says so.

`getEditableInfo` only fills keys present in `controllableTypes`. `hasMultiValue` is currently
always `false` (the implementation keeps a single-element array for future multi-select work).

### Writing

```ts
setEditableInfo(elem, { [ControlType.ROTATION]: false }, { overwrite?, ...historyOptions })
clearEditableInfo(elem, historyOptions)
toggleEditableInfo(ControlType.DELETE)   // reads + writes useSelectedElementStore
```

`setEditableInfo` expands a temp group to its children, serializes the merged set, and — if any
of `DimenstionControls` (rotation, size, position X/Y/X2/Y2) changed — calls
`selector.getSelectorManager().requestSelector(elem)?.updateNonEditableGripVisibility()` so the
selection grips reflect the new state.

### How it reaches the canvas

Three places consume `editableInfo` at interaction time, **all gated on
`withinInteractionModes(templateModes)`**:

1. **`selector.ts` → `updateNonEditableGripVisibility()`** — hides resize grips when `_SIZE`
   (or, for `line`, the relevant `POSITION_X/X2/Y/Y2`) is locked, and hides the rotate grips
   when `ROTATION` is locked. Note it only *hides*; the normal `resize()` path re-shows all
   grips beforehand, but calling it standalone will not restore them.
2. **`interaction/mouse/index.ts` → `mouseMove`** — pins `x`/`y` to `startX`/`startY` and zeroes
   `dx`/`dy` in the drag branch when the corresponding position control is locked.
3. **`interaction/mouse/index.ts` → `onResizeMouseMove`** — intends to switch to
   resize-from-center when a position axis is locked.

> Beware: (2) clamps `x` at the **top of `mouseMove`**, and that same `x` is passed to
> `onResizeMouseMove`, where `dx = x - startX`. So `dx` is already 0 by the time (3) runs, and
> the resize-from-center branch cannot take effect. If you touch this area, the clamp in (2)
> needs to be scoped to the drag path only.

### How it reaches the panels

`stores/element/utils.ts` `getDerivedData()` computes, on every selection change:

```ts
state.objectPanelData   = getObjectPanelContext(elem)
state.controllableTypes = getControllableType(elem, state.objectPanelData)
state.editableInfo      = getEditableInfo(elem, state.controllableTypes)
```

Panels then read `useSelectedElementStore(state => state.editableInfo)`.
`ObjectPanel/tabs.tsx` `displayTabs()` decides which tabs to show:

- in `templateModes` → a tab shows if **any** of its `controlTypes` has `editableInfo[t].value`
- otherwise → a tab shows if any of its `controlTypes` is in `controllableTypes`

`ControlBlock` / `EditableButton` (`RightPanel/common/ControlBlock.tsx`) render the per-control
lock toggle in `project` mode; `ObjectPanel/TemplateConfig.tsx` renders the coarse
"allow editing" / "allow deleting" switches.

## Derived element state (`stores/element/`)

`useSelectedElementStore` holds the selected element **plus** a bag of derived data
(`DerivedData` in `interface.ts`). Fields split in two:

- **Eager** — computed synchronously in `getDerivedData()` on every selection change:
  `nodeType`, `nodeCategory`, `ungroupedElems`, `elementCount`, `canGroup`, `canUngroup`,
  `objectPanelData`, `controllableTypes`, `editableInfo`.
- **Lazy** — the optional fields (`isFillable`, `isFilled`, `isShading`, `isVariableText`,
  `hasChild*`, `canChildrenConvertToPath`). Computed on first access via `getLazyData(key)` /
  `useLazyData(key)` and cached in a module-level `Map` that `getDerivedData()` clears.

A `MutationObserver` on the selected element watches `d`, `fill`, `data-shading`, `data-vt-type`
and calls `invalidateLazyData()` for the corresponding key.

When adding a lazy field: add it as an optional key on `DerivedData`, add a compute function
plus a `{ compute, fallback }` entry to `lazyDataMap`, and — if a DOM attribute should
invalidate it — add that attribute to `relatedLazyDataKeyMap` in `selectedElementStore.ts`
(the observer's `attributeFilter` is derived from that map's keys, so an attribute missing
there will never trigger the callback).

`activeKey` on the same store tracks which ObjectPanel popup is open; it is cleared whenever
`layoutStore.layout` changes.

## Adding mode-dependent UI

1. Decide the axis: mode (`useIsInteractionMode` / `useWithinInteractionModes`) or layout
   (`useIsTabletOrMobile`). Explore/template implies tablet layout, so often the layout hook
   alone is enough.
2. For a new gateable property, add a `ControlType` **at the end of the enum**, add it to
   `ControlTypes`, and push it in `getControllableType()` under the right condition.
3. Wrap the control in `ControlBlock type={ControlType.X}` so the authoring toggle appears in
   project mode and the control hides in template/explore when locked.
4. If the property affects canvas manipulation (position/size/rotation), also handle it in
   `selector.ts` and `interaction/mouse/index.ts`.

## Related

- [[content-library]] — the swappable-content feature available on `use` / `image` elements in project mode
- [[template-file-format]] — how template flags, thumbnails and target layers are persisted in `.beam`
- [[svgedit-recalculate]] — transform absorption, relevant when resize/rotate is gated
