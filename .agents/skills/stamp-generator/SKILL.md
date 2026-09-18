---
name: stamp-generator
description: Stamp generator dialog — SVG templates with color roles, the 150×150 design space and export scale, text slot placements (arc / box fit modes / vertical), font resolution, invert via containment, export-only mirror. Use when working on components/dialogs/StampGenerator/ or authoring a stamp template.
---

# Stamp Generator

Location: `packages/core/src/web/app/components/dialogs/StampGenerator/`

## Overview

A dialog for laying out rubber-stamp faces (Taiwan company seals and name seals, Japanese hanko, US/EU
address stamps) and importing them to the canvas as an engrave layer plus a cut outline. Layout runs in
paper.js; text is converted to outlines with fontkit at preview time so preview and export share one
geometry. Sibling of the keychain and puzzle generators; shared text/path helpers live in
`packages/core/src/web/helpers/generator/` (never import across dialogs).

## File Structure

```
StampGenerator/
├── index.tsx                  # showStampGenerator(): selects the first template, mounts the dialog, reset on close
├── StampGenerator.tsx         # DraggableModal: [TemplatePicker][Preview][OptionsPanel]; switch-template warning
├── constants.ts               # PX_TO_MM_RATIO=10, DESIGN_SIZE=150, ROLE_COLORS, EXPORT_COLORS, PREVIEW_COLORS
├── types.ts                   # TextPlacement, TextSlotDef, ElementSlotDef, StampTemplate, ParsedTemplate, StampShape, StampState
├── useStampStore.ts           # Zustand store: template/parsed/state/shape, font resolution, applyOptions rebuild
├── exportToCanvas.ts          # Two layers via helpers/generator/exportPaths; applies the horizontal mirror
├── templates/
│   ├── index.ts               # STAMP_TEMPLATES[] + getTemplateById; font candidate lists; size tables
│   └── *.svg                  # Template frames (imported as `?raw`), plum-icon.svg for element slots
├── builders/
│   ├── buildTemplate.ts       # parseTemplate: SVG → { frames, outline, baselines } by color role
│   ├── buildText.ts           # buildTextPaths: arc slots, box slots (spacing/center/stretch), vertical columns
│   ├── buildElement.ts        # buildElementPaths: shape fitted in slot box, scale % + rotation
│   ├── buildShape.ts          # buildStampShape (compose + invert), buildPreviewSvg, invertFace
│   ├── resolveOverlaps.ts     # item.unite(item) to merge overlapping glyph contours
│   ├── templates.spec.ts      # Parses every bundled template
│   └── *.spec.ts
└── components/
    ├── TemplatePicker.tsx     # Template cards (thumbnail or name fallback)
    ├── Preview.tsx            # Keychain-style preview, size badge (mm/inch), legend (engrave / cut / mirrored)
    ├── OptionsPanel.tsx       # Tabs: Basic (invert, flip, size, reset) · Text · Element; tabs gated on labeled slots
    ├── TextTab.tsx            # Accordion per labeled slot; shared FontSelect when template.sharedFont
    └── FontSelect.tsx         # AntdSelect widget over the font list; shared font helpers
```

`*.svg?raw` is supported by a webpack `asset/source` rule in both apps, `declaration.d.ts`, and in jest by
a moduleNameMapper plus `packages/core/jest.raw-transform.js`.

## Design Space and Scale

- Every template is authored in a **150×150 design space** (`DESIGN_SIZE`); slot boxes and font sizes in
  `templates/index.ts` are design px.
- Export scale: `sizeRatio = widthMm × PX_TO_MM_RATIO / outline.bounds.width`, so the **outermost
  frame's width** maps to the chosen size; height follows the template's aspect ratio. Sizes come from
  `StampTemplate.sizes` (e.g. 四分…一吋 for the square seals, hanko diameters, inch sizes via `inch()`).
- The preview badge converts the outline bounds through `sizeRatio` and shows mm or inch per
  `useStorageStore.isInch`.

## Template SVG Contract

Designers author frames as SVG; `parseTemplate` classifies each path by color (`ROLE_COLORS`, lowercase
hex as paper reports them):

| Color             | Role                                                                            |
| ----------------- | ------------------------------------------------------------------------------- |
| `#E5400A` filled  | Frame ring, engraved. Rings are two contours (even-odd); `reorient(false, true)` |
| `#1890FF` stroked | Arc-text baseline; never exported. Sorted top→bottom, normalized to run left→right |

The largest frame is the **outline**: its outer contour (`outerContour`, largest-area child) becomes the
cut path and drives the scale. Slot boxes are NOT in the SVG; they live in `templates/index.ts`.

Adding a template: drop the SVG in `templates/`, import it with `?raw`, add an entry with `nameKey`
(i18n `stamp_generator.templates`), `sizes`, `texts`, `elements`, optional `preferredFonts` /
`sharedFont`; add the name key (and any new slot `labelKey`) to all 23 language files. `templates.spec.ts`
will parse it.

## Text Slots (`TextPlacement`)

- **Arc** `{ baseline, fontSize, offset? }`: text-on-path along the n-th baseline. The em box is centered
  on the arc (`alignment-baseline` + `dominant-baseline="central"`, both needed: Chrome only shifts
  reported positions for alignment-baseline alone, and font-funcs applies the measured shift ×
  `glyphScaleY`). `offset` shifts the arc parallel to itself. `fitTextToArc` shrinks the font until the
  text fits the arc length and returns `glyphScaleY` to stretch glyphs back to the intended height.
- **Box** `{ bounds, fit?, fontSize?, vertical? }`:
  - `fit: 'spacing'` (default): glyph shape kept, letter spacing rewritten so the line spans the width
    (user letter spacing hidden in the UI).
  - `fit: 'center'`: user's spacing kept, ink centered in the box.
  - `fit: 'stretch'`: non-uniform `fitToBounds` to fill the box (seal-maker style).
  - `vertical`: one character per line at 1em, default font size = box width.
  - `fontSize` set in the template → user-adjustable; otherwise sized by the box.
- `TextSlotDef` adds `id`, `placeholder`, optional `labelKey` (i18n `stamp_generator.slots`; **omit to keep
  the slot fixed** — it renders its placeholder and is not listed in the Text tab) and
  `fontPostscriptName` (pins a face, e.g. the bundled `Montserrat-Medium` for 統一編號).

Text measurement mounts the element off-screen (`withMounted`); glyph outlines come from
`convertTextsToPath` (fontkit). Every converted line goes through `resolveOverlaps` because static
Montserrat faces overlap contours on purpose (the "4").

## Fonts

- `resolveDefaultFont(template.preferredFonts)` in the store probes candidates in order with
  `getFontObj` (skips fonts that don't resolve or don't load: web font offline, macOS font not
  downloaded), falls back to the user's default font; cached per candidate list per session.
- Lists in `templates/index.ts`: `KAI_FONTS` (TW-MOE-Std-Kai web font, then OS 標楷體), `JP_FONTS`
  (Hiragino Mincho / Yu Mincho / MS Mincho), `WESTERN_FONTS` (bundled Montserrat Medium).
- Bundled fonts: `helpers/fonts/bundledFonts.ts` (Electron disk path or web `WebFont.url`);
  `getFontOfPostscriptName` checks bundled first. Only Montserrat-Medium is bundled (OFL).
- `sharedFont: true` → one FontSelect above the slot list; `updateSharedFont` sets every labeled,
  unpinned slot. Per-slot pickers are hidden.

## Build Pipeline

```
selectTemplate(id)
  → resolveDefaultFont → new paper.Project → parseTemplate → getDefaultState → applyOptions()
applyOptions()  (async, buildVersion guards against stale builds)
  → buildStampShape(parsed, template, state)
      frames cloned · buildTextPaths · buildElementPaths · cut = outerContour(outline)
      invertColor ? [invertFace(cut, engraved)] : engraved
  → buildPreviewSvg(shape) (engrave filled black, cut dashed red) · sizeRatio
exportToCanvas()
  → flip group if state.flipHorizontal → capture path data → flip back (sync, before any await)
  → layer "Stamp - Engrave" (#ff7a45, filled) + layer "Stamp - Outline" (#000000)
```

- **Invert** (`invertFace`): one CompoundPath of every engraved contour plus the cut, then
  `reorient(false, true)` so containment depth decides fill (glyph → hole, its counter → filled). ~40ms vs
  ~2.4s for boolean ops. Contours coincident with the cut are dropped so the outer ring's inner edge
  bounds the face. Assumes engraved parts don't overlap or leave the outline.
- **Flip** is export-only: the preview always reads naturally; the legend shows "Mirrored on import"
  while the toggle is on.
- **Elements**: `buildElementPaths` fits the shape uniformly inside the slot box, then applies scale %
  and rotation about the slot center. Only the plum blossom exists; the Element tab UI is parked until a
  template has configurable elements.

## paper.js Gotchas

- `child.clone()` on a compound's child inserts the clone into that compound → always
  `clone({ insert: false })` for detached copies.
- `compound.children` is live: copy the array before re-parenting children in a loop.
- `resolveCrossings` does not merge overlapping contours; `item.unite(item)` does.
- paperjs-offset (used for arc `offset`): positive always expands, result always clockwise, and offsetting
  a compound offsets every child the same way (counters grow shut). Strip degenerate curves first
  (`removeDegenerateCurves`) or it can recurse forever.

## Store (`useStampStore.ts`)

State: `template`, `parsed`, `project`, `state: StampState` (`texts`, `elements`, `invertColor`,
`flipHorizontal`, `sizeIndex`), `shape`, `previewSvg`, `sizeRatio`, `defaultFont`, `isModified`,
`buildVersion`. Actions: `selectTemplate`, `updateText`, `updateElement`, `updateSharedFont`,
`updateState`, `resetState` (rebuilds defaults from the stored `defaultFont`), `reset`. Every update
calls `applyOptions()`; a slower older build is discarded by `buildVersion`.

## i18n

`stamp_generator.{basic, export_failed, layers, legend, slots, switch_template_warning, tabs, templates}`
in all 23 languages. Shared generator strings are `generators.general` (design_preview, exploded_view,
import_to_canvas, reset_to_default, size) and `generators.text_options`; the Basic tab reads
`generators.general.size` / `reset_to_default`. Slot and template labels are keys, never ids.

## Testing

`pnpm test packages/core/src/web/app/components/dialogs/StampGenerator` — builders have specs
(`buildTemplate`, `buildText`, `buildShape` incl. invert on the real rect template, `buildElement`,
`resolveOverlaps`, `templates`). Specs run paper headless via `paper.setup(document.createElement('canvas'))`.

## Known Limits / Parked

- Frame bands are thin at small sizes (0.18mm inner ring on the JP corporate round seal at 10.5mm,
  0.35mm on the company seals at 四分). Kerf compensation was prototyped and reverted for that reason;
  thicken frames before revisiting.
- Element tab, designer-provided thumbnails and generator icon (`icons/generator/stamp.svg` is a
  placeholder), bold text (font-weight can't produce outlines; per-contour offset was too slow).
