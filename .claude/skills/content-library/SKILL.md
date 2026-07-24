---
name: content-library
description: ContentLibrary — swappable alternative contents attached to a use/image element in template projects, stored as owned <symbol> elements in defs. Use when working on helpers/contentLibrary/manager.ts, ObjectPanel/LibraryPanel/, or the 'pick' mouse mode.
---

# Content Library

## Purpose

In `project` mode a template author can attach a **set of alternative contents** to a single
`<use>` or `<image>` element. The template consumer then picks one of them from the Library
panel and the element swaps its content in place, keeping its position and size. The author can
also allow the consumer to upload their own file.

Available only when the interaction mode is `project` and the selected element's node category
is `image` or `use` — see [[template-modes]].

## File Locations

- `packages/core/src/web/helpers/contentLibrary/manager.ts` — all data operations (604 lines)
- `packages/core/src/web/app/components/beambox/RightPanel/ObjectPanel/LibraryPanel/`
  - `index.tsx` — panel shell, desktop vs tablet layout
  - `ContentSection.tsx` — the content grid; also exports the shared `restrictToParent` dnd modifier
  - `ContentGrid.tsx` / `ButtonGrid.tsx` — grid cells
  - `CustomDataToggle.tsx` — the "customer may upload" switch
  - `DataActions.tsx` — import / export library contents

## Data Model

Everything lives in the SVG `<defs>` as `<symbol>` elements, tagged with attributes:

### On the owner (the canvas `<use>` / `<image>`)

| Attribute | Meaning |
|---|---|
| `data-library-default` | id of the symbol shown by default / on template reset |
| `data-library-current` | id of the symbol currently displayed |
| `data-customer-upload` | `'true'` if the consumer may add their own file |

Accessors: `getCurrentContentId`, `getCustomerUploadAllowed`, `setCustomerUploadAllowed`
(exported); `getDefaultContentId`, `setDefaultContentId`, `setCurrentContentId` (module-private).

### On the content `<symbol>` elements

| Attribute | Meaning |
|---|---|
| `data-library-owner` | id of the owning canvas element — this is what makes a symbol "library content" |
| `data-image-symbol` | (on an **origin** symbol) id of its rasterized preview symbol |
| `data-origin-symbol` | (on an **image** symbol) id of the origin symbol it was rendered from |

The `data-image-symbol` / `data-origin-symbol` pair is the pre-existing symbol-pairing
convention from `symbol-helper/symbolMaker.ts` — an origin symbol *points at* its image, and
the image *points back at* its origin. `getContentElements()` selects on the **pointer**, which
is why the selectors look inverted:

```ts
getContentElements({ doc?, ownerId?, target })
// target →  selector suffix                                        → what you get
// 'all'         ''                                                 → everything owned
// 'image'       ':not([data-image-symbol]):not([data-origin-symbol])' → plain image contents
// 'use_origin'  '[data-image-symbol]'                              → origin symbols of use contents
// 'use_image'   '[data-origin-symbol]'                             → image (preview) symbols
// 'origin_data' ':not([data-origin-symbol])'                       → image contents + use origins  (for saving)
// 'preview'     ':not([data-image-symbol])'                        → image contents + use previews (for display)
```

Two library types, held on the singleton as `contentLibraryManager.type`:

- `LibraryType.IMAGE` — owner is `<image>`; each content is a bare `<symbol><image/></symbol>`
- `LibraryType.USE` — owner is `<use>`; each content is an origin symbol **plus** a generated
  image symbol from `symbolMaker.makeImageSymbol(origin, { fullColor: false })`

## Lifecycle

### Init

`contentLibraryManager.init(elem, onUpdate)` is called from `ContentSection`'s effect and
returns a cleanup function.

```ts
useEffect(() => contentLibraryManager.init(owner, onUpdate), [owner, onUpdate]);
```

It registers `onUpdate` on the `'library'` event emitter, sets `this.owner` / `this.type`, and
runs `initContentLibrary(elem)`, which seeds the library on first use:

- `<image>` owner → wraps its current `origImage` into a new content symbol
- `<use>` owner → claims the symbols it already references (`getSymbols(useElem)`) as content

and then writes `data-library-default` / `data-library-current`.

> `ContentLibraryManager` is a **module singleton** with a mutable `owner`. `init` does not
> await `initContentLibrary`, and the cleanup unconditionally nulls `owner`. Any async work
> that spans a selection change or unmount must capture `owner` locally rather than re-reading
> `this.owner`.

### Change

```ts
changeContent(owner, contentSymbol, historyOptions?)
setDefaultContent(owner, contentSymbol)   // changeContent + update data-library-default
```

- `<image>` owner: copies the content's image data onto the owner's `origImage` and calls
  `updateImageDisplay`. `batchCmd.onAfter` re-runs `updateImageDisplay` — `BatchCommand.onAfter`
  fires on both apply and unapply, so undo refreshes correctly.
- `<use>` owner: computes `getAttributesToFitOwnerBBox(owner, content)` — a
  `matrix(sx 0 0 sy tx ty)` that maps the new symbol's bbox onto the owner's current bbox, plus
  a `data-xform` record — then repoints `xlink:href` and calls `symbolMaker.reRenderImageSymbol`.
  This is what keeps a swapped content in exactly the same place and size.

`getSymbolBBox()` (`svgedit/utils/getBBox.ts`) caches its result on the symbol as `data-bbox`
and there is no invalidation, so a symbol whose content is replaced while keeping its id will
report a stale bbox.

### Add

Four entry points, all ending with `eventEmitter.emit(CONTENT_UPDATED)`:

| Function | Source |
|---|---|
| `addContentFromDialog(owner)` | file picker — SVG for `use` owners, PNG/JPG/BMP/WEBP for `image` owners |
| `ContentLibraryManager.addContentFromCanvas(pickedElem)` | the **`pick` mouse mode** (below) |
| `importContents(owner)` | bulk import of a previously exported library SVG |
| `initContentLibrary(owner)` | implicit, first time the panel opens |

`addContentFromCanvas` normalizes whatever the user picked:
- image library + non-image pick → `convertSvgToImage`, take `origImage`, unapply the temp cmd
- use library + `use` pick → clone its real symbol, new id
- use library + shape/group pick → clone into a detached `<svg>` wrapper, `convertTextToPath`
  any text, strip `<image>` children, then `parseSvg(..., 'nolayer')` to get a symbol
- either way, `makeImageSymbol` produces the preview and both symbols get `data-library-owner`

It finishes by re-running `selectionManager.selectOnly([owner])`, because the conversions above
can change the canvas selection.

### The `pick` mouse mode

`ContentSection` fires `setMouseMode('pick')`. `interaction/mouse/index.ts` `mouseDown` has:

```ts
case 'pick': {
  setMouseMode('select');
  const pickTarget = svgCanvas.getMouseTarget(evt);
  if (pickTarget && pickTarget !== svgRoot) {
    await contentLibraryManager.addContentFromCanvas(pickTarget as SVGGraphicsElement);
  }
  return;
}
```

The mode is one-shot — it reverts to `select` on the first mousedown regardless of outcome.
There is currently no Escape/cancel path and no cursor affordance.

### Reorder / Remove

`reorderContents(sourceId, destinationId, isBackward)` moves the source symbol with
`insertBefore`, then re-inserts its paired origin symbol immediately before it so the pairs stay
adjacent in `defs`. Driven by dnd-kit in `ContentSection` with the `restrictToParent` modifier.

`removeContent(content)` removes the paired origin symbol first (if any), then the content
itself, in one `BatchCommand`.

### Import / Export

`exportContents(ownerId)` serializes all owned symbols into a standalone
`<svg><defs>…</defs></svg>` (via `outerHTML`) and writes it through `dialog.writeFileDialog`.

`importContents(owner)` reads such a file, adopts the nodes into the current document,
regenerates ids (`svgCanvas.getNextId()` + `updateSymbolStyle` for use contents), re-owns them,
and — for use contents — regenerates image symbols.

## Update Propagation

There is no store. The manager uses an event emitter:

```ts
const eventEmitter = eventEmitterFactory.createEventEmitter('library');
const CONTENT_UPDATED = 'CONTENT_UPDATED';
```

`init()` subscribes the component's `onUpdate`, which re-reads
`contentLibraryManager.getContent()` and re-resolves the current symbol by id. Every mutating
function emits `CONTENT_UPDATED` in its `finally` block.

Note that some paths (`setDefaultContent` from `ContentSection`) call `onUpdate()` manually
instead of relying on the emitter.

## UI Behaviour by Mode

`ContentSection` renders two completely different trees:

- **`templateModes` (consumer)** — a read-only grid; clicking a cell calls `changeContent`.
  An upload cell appears only when `getCustomerUploadAllowed(owner)` is true.
- **`project` (author)** — a dnd-sortable grid with per-item remove, plus a control row:
  add-from-file, pick-from-canvas, and "set as default".

`LibraryPanel/index.tsx` picks the container: `ObjectPanelItem` (popup) on tablet/mobile,
a plain panel on desktop.

## Gotchas

- `changeContent` (image owner) resolves the new source from `imageElem.getAttribute('origImage')`
  — the attribute `addImageContent` actually writes — falling back to `xlink:href`. (Earlier code
  read a non-existent `data-origImage`, so it always hit the fallback.)
- `blobSrcToBase64` returns the original `src` on fetch failure. If that src is a `blob:` URL it
  will be dead after reload, and the failure is silent.
- `addContentFromDialog`'s image branch creates an object URL that is never revoked.
- Several functions put `handleHistoryActionOptions(batchCmd)` and the "not supported" error
  alert in a `finally`, so an early `return` commits an empty BatchCommand and shows a
  misleading error.

## Related

- [[template-modes]] — gating, `ControlType.LIBRARY`, and when the panel is available
- [[template-file-format]] — how library symbols survive save/load
- [[svgedit-recalculate]] — the transform maths behind `getAttributesToFitOwnerBBox`
