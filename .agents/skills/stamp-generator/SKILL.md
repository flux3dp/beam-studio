---
name: stamp-generator
description: Stamp generator dialog — SVG templates with color roles, the 150×150 design space and export scale, text slot placements (arc / box fit modes / vertical), font resolution, invert via containment, export-only mirror. Use when working on components/dialogs/StampGenerator/ or authoring a stamp template.
---

# Stamp Generator

Location: `packages/core/src/web/app/components/dialogs/StampGenerator/`

## Overview

A dialog for laying out rubber-stamp faces (hand-authored Taiwan company and name seals, plus the
design-team catalog: JP hanko, US/EU office stamps, badges, date stamps, …) and importing them to the canvas as an engrave layer plus a cut outline. Layout runs in
paper.js; text is converted to outlines with fontkit at preview time so preview and export share one
geometry. Sibling of the keychain and puzzle generators; shared text/path helpers live in
`packages/core/src/web/helpers/generator/` (never import across dialogs).

## File Structure

```
StampGenerator/
├── index.tsx                  # showStampGenerator(): selects the first circle template, mounts the dialog, reset on close
├── StampGenerator.tsx         # DraggableModal: [TemplatePicker][Preview][OptionsPanel]; switch-template warning
├── constants.ts               # PX_TO_MM_RATIO=10, DESIGN_SIZE=150, ROLE_COLORS, EXPORT_COLORS, PREVIEW_COLORS
├── types.ts                   # TextPlacement, TextSlotDef, ElementSlotDef, BorderDef, StampTemplate, ParsedTemplate, StampShape, StampState
├── useStampStore.ts           # Zustand store: template/parsed/state/shape, font resolution, applyOptions rebuild
├── exportToCanvas.ts          # Two layers via helpers/generator/exportPaths; applies the horizontal mirror
├── templates/
│   ├── borders.ts / borders/<family>/  # BORDER_STYLES[BorderShape]: decorative borders per family (rect: design's 188×72 SVGs, ?raw)
│   ├── index.ts               # STAMP_TEMPLATES[] (hand-authored + ...CATALOG_TEMPLATES) + getTemplateById; size tables
│   ├── catalog.ts             # Entries converted from design-team JSONs; plain objects, tune by hand
│   ├── catalog/<id>.svg       # Their frames (imported as `?raw` like the hand-authored ones)
│   ├── fonts.ts               # KAI_FONTS / JP_FONTS candidate lists (shared with catalog.ts)
│   ├── *.svg                  # Hand-authored template frames (imported as `?raw`)
│   └── icons/*.svg            # Bundled element shapes registered as stamp/<name> (buildElement BUNDLED_SHAPES): plum, star, plane, camera, check
├── builders/
│   ├── buildTemplate.ts       # parseTemplate: SVG → { frames, outline, baselines } by color role
│   ├── buildText.ts           # buildTextPaths: arc slots, box slots (spacing/center/stretch), vertical columns
│   ├── buildElement.ts        # buildElementPaths (async): shape via helpers/generator/loadShape, fitted in slot box, scale % + rotation; registers bundled stamp/* icons
│   ├── buildBorder.ts         # buildBorder: runtime stroke ring (solid / dashed) or decorative style inside template.border.bounds
│   ├── sliceBorder.ts         # nine-slice of a border style: sliceStyle (cached cut), layoutSlices (fixed corners, stretch/tile edges)
│   ├── buildShape.ts          # buildStampShape (compose + invert), buildPreviewSvg, invertFace
│   ├── resolveOverlaps.ts     # item.unite(item) to merge overlapping glyph contours
│   ├── templates.spec.ts      # Parses every bundled template
│   └── *.spec.ts
└── components/
    ├── TemplatePicker.tsx     # Template cards (thumbnail or name fallback)
    ├── Preview.tsx            # Keychain-style preview, size badge (mm/inch), legend (engrave / cut / mirrored)
    ├── OptionsPanel.tsx       # Tabs: Basic (invert, flip, size, reset) · Text · Element · Border; tabs gated on slots / border
    ├── TextTab.tsx            # Accordion per labeled slot; shared FontSelect when template.sharedFont
    ├── ElementTab.tsx         # Per labeled element slot: shared @core/app/widgets/ElementPicker (presets + Element panel) + size %
    ├── BorderTab.tsx          # "Decorative frame" switch; off → line width (mm via sizeRatio) + dashed rows, on → BORDER_STYLES grid
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
| `#722ED1` stroked | Explicit cut outline; never engraved. Needed when the visible edge isn't one closed contour (dashed rings) |

The **outline** is the `#722ED1` path when present, else the largest frame: its outer contour
(`outerContour`, largest-area child) becomes the cut path and drives the scale. Slot boxes are NOT in the SVG; they live in `templates/index.ts`.

Adding a hand-authored template: drop the SVG in `templates/`, import it with `?raw`, add an entry with
`nameKey` (i18n `stamp_generator.templates`), `sizes`, `texts`, `elements`, optional `preferredFonts` /
`sharedFont`; add the name key (and any new slot `labelKey`) to all 23 language files. `templates.spec.ts`
will parse it.

## Design-team JSON templates (`catalog.ts`)

Design exports `flux-stamp-template@1` JSONs (id, name, shape, sizeMm, `gen`, `p`, `fields`). They are
parameter sets for the prototype's render engine (印章製作 Stamp Maker Prototype.html), not
self-describing: ring radii, arc radii and star positions live in the engine. The catalog entries were
produced once by a converter script (`fromJson.mjs`, a one-time tool kept out of the repo; it is in
the history of commit e3348a97a if design sends more JSONs) that ported that geometry (prototype box =
sizeMm × 4 px, 3 px inset, everything relative to R = min(rx, ry); mapped so the outer frame spans 140
design px) into `catalog/<id>.svg` frames plus the entries below. The entries are plain objects: tune
them by hand, the JSONs stay out of the repo. Entries use `nameKey` = template id and `labelKey` =
a `stamp_generator.slots` key (design label → key); every new key goes into all 23 lang files. Arc slots
carry the prototype's default 2 px tracking via `letterSpacing`, center lines become `fit: 'center'`
boxes (`fontSize` = R × s, box center 0.35 em above the baseline), stars become element slots with
`shapeKey: 'star'`, `hr` / divider / signature rules become thin frame rects, ornaments (`orn`, the
prototype's 24×24 `Qm` icons) become element slots keyed by icon name — icons live in
`templates/icons/`, filled outlines only (nonzero winding, holes wound the other way; stroked prototype
icons are re-drawn as outlines). The prototype scales the 24 px viewport but `buildElement` fits the
ink, so the script's `ORNAMENTS` table holds each icon's ink extent and sizes the slot by it — add the
extent when adding an icon. Row templates with an ornament get `clearOf: { elementId: 'icon', padding: 4 }`
on every row, so the text sits beside the icon at any user size instead of under it (the design's own
render overlaps them). `fontPreset` picks `preferredFonts`: `en-*` → named family + Montserrat,
`tc-kai` → KAI_FONTS, `jp*` / `mono-type` → JP_FONTS / Montserrat. Supported gens on round / oval / rect /
square: `ringAround`, `rows`, `badge`, `seal` (vertical column or one centered line; `grid` falls back
to one line), `date` (date line pinned to Montserrat; a dashed ring becomes filled dash segments — one compound
frame — plus a `#722ED1` cut ellipse along their outer edge), `split` (`bar` mode only, via `knockout`), `jp` (maru1 / maruV / sumi / ginko).
Not ported: per-line font and bold weight, laurel wreaths, image slots, `max` field lengths, the other
split modes; other shapes (triangle, diamond, shield, …) need the prototype's shape path function.

## Runtime borders (`border`, `builders/buildBorder.ts`)

A template may declare `border: { bounds, radius?, lineWidth? }` instead of (or as well as) frame
paths in its SVG; `svgContent` is then optional. `bounds` is the ring's outer edge in design px and
becomes the cut outline (`parseTemplate` uses it as `outline` when there is no `#722ED1` cut path), so
the stamp size never changes with the line width: the ring grows inward. `state.border`
(`{ lineWidth, dashed }`, design px) is edited in the Border tab, shown in mm via `sizeRatio`.
`buildStampShape` appends `buildBorder()` to the cloned frames, so knockout/invert treat it like any
frame. Dashed rings: `dashRanges(length, lineWidth)` picks an integer dash count (dash 2×, gap 1× the
width, half a gap in so a dash centers each side), and `strokeSegment` traces each dash on the outer
and inner rounded rects by matching curve (arcs by angle, straights by midpoint distance); rounded
rects are floored at radius 0.01 so all three rings share the 8-curve structure. Butt caps.
`state.border.style` is `'stroke'` or a key of `BORDER_STYLES[shape]` (`templates/borders.ts`, SVGs under
`templates/borders/<family>/`, one folder per `BorderShape`). Files are the design team's, cleaned to
`<svg viewBox><path|circle|g>` only (no `<defs>/<style>`, ids or classes: the Border tab inlines them as
thumbnails on one page). **rect** (長方形邊匡12種, 188×72 viewBox = the 47×18 mm engine box at 4 px/mm)
is nine-sliced by `builders/sliceBorder.ts` per its `slice` config (native px): `sliceStyle` first
centers the ink in the 188×72 canvas (design files aren't centered, margins differ up to 1.5 px), then
cuts it once per style (contours wholly inside a cell pass through; the rest are merged and
boolean-clipped per cell so band pieces are plain filled contours, holes already subtracted) and
`layoutSlices` places it in the box at the stamp's physical scale (`pxPerMm / 4`, capped so a corner
cell is at most 40% of a side: MAX_CORNER_SHARE, for the 12 mm name seals and narrow stamps): corners
fixed, center stretched, each edge stretched along its axis or, with `tile.h/v`, repeated a whole
number of times (stars, postage scallops, floral side motif, and the hand-drawn waves: their corner
cut + period were searched for a self-matching peak/trough, see borders.ts). Only the top-left corner
and the top/left repeat units come from the drawing; the other corners and the bottom/right units are
their mirrors, so tile junctions match even when the designer's file isn't symmetric. A style with
four different corners would need a flag to opt out. A portrait box is laid out landscape and rotated
90° so long-side motifs follow the long sides. **square** (100×100 = 25 mm), **circle** (120×120 =
30 mm) and **oval** (180×120 = 45×30 mm) have no `slice`: `fitStyleBorder` maps the design canvas
(the viewBox, which the designers drew as the stamp box) onto `bounds` per axis, so ornaments shrink
with the stamp, keep their drawn margins and meet the cut on every side. The ink itself is not fitted —
asymmetric ornaments make it off-square (floral_1 is 99.2×100). An oval box off 3:2 (the 50×30
templates) stretches the frame 11%; a uniform fit was tried first and its bare rim on the long axis
read worse than the stretch. Both
caches (`inkCache`, slice `cache`) are keyed by the style object: keys like `postage` / `vintage_1`
repeat across families. Round styles are drawn to a square canvas, so after the fit they shrink until
their farthest ink point (ellipse metric) lies on the cut (the vintage frames: ~85%).
**Content fits the hole**: a decorative frame reaches further in than the stroke ring the design was
laid out against, so `buildStampShape` scales the whole design (SVG frames, text, elements) about the
box center by `holeScale`: the Minkowski gauge of the ring's inner shape (`hypot(u/a, v/b)` for an
ellipse, `roundedRectGauge` with a side test + corner quadratic for rects) evaluated over the frame's
flattened vertices, minimum wins (0.54 wreath … 0.97 radial dots). Both measurements flatten to
`FLATNESS_MM` (0.02 mm, a stated precision rather than a sample count) and are memoized per style /
box / scale because the 6000-curve florals cost ~50 ms and every keystroke rebuilds. Stroke mode is
untouched (scale 1). Default stroke width rounds to 0.05 mm at the default size
(`defaultLineWidth` in the store). Skipped from design's folders: the "adjustable" stroked variants
(可調式波浪匡 / 可調整波浪 / 可調整虛線 — a wavy or dashed line at the user's width, a different
feature; dashed already exists in stroke mode) and the two Illustrator working files; the stroked
square 同心框 was hand-outlined into filled rings (`square/concentric.svg`).
A style's cut is the sharp box;
the stroke ring's cut keeps `radius`. `BorderDef.shape` (`BorderShape`: `rect | square | circle | oval`, default `rect`) picks
the family in `BORDER_STYLES`. For `circle` / `oval` the ring is an ellipse (`ringPath`, used for the
stroke ring, the dashes, the parsed outline and a style's cut). `BorderDef.dashed` is the initial dash
state (the post / passport date stamps).
`BorderDef.styles: false` keeps a template to the plain line (square_name, square_three_column: the
characters fill the box; rect_label/02: the title bar spans the box; a decorative frame collides). The
Border tab picks styles from the shared `@core/app/widgets/IconSelectorGrid` (moved out of the
keychain generator) with the raw SVG as thumbnail and no labels. Border templates: rect_title_name,
rect_confidential, rect_entry, rect_date, the portrait rect_signature_vertical, and the
squares square_name / square_three_column (100 px box, ring 1/30), square_camera, square_signature (boxes = their
old frame edges; SVGs deleted) and the split templates rect_label/02 (ring removed from the SVG,
the filled title bar stays there as a frame for the knockout text). The circle (circle_corporate, circle_notary, circle_paw, circle_approved, circle_postmark,
circle_done) and oval (oval_company, oval_registration, oval_received, oval_exit)
catalog templates lost their outer ring the same way; inner rings and date rules stay in the SVG. Only
the TW 統編章 pair still uses SVG outer frames.

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
  - `fit: 'shrink'`: like center, but an overlong line is scaled down uniformly (floor 0.5) — the
    design prototype's rule; every converted center line uses it.
  - `fit: 'stretch'`: non-uniform `fitToBounds` to fill the box (seal-maker style).
  - `vertical`: one character per line at 1em, default font size = box width.
  - `fontSize` set in the template → user-adjustable; otherwise sized by the box.
  - `clearOf: { elementId, padding }`: at build time the box is trimmed on the side that element's
    built ink is on (`keepClear` in buildText.ts), so text follows the icon's size. Needs the element
    built first — `buildStampShape` builds elements (keyed by slot id) before text.
  - `knockout: true`: the text is cut out of the engraved frame it sits on (`knockoutText` in
    buildShape.ts: smallest frame whose bounds contain the text + the glyphs become one compound,
    `reorient(false, true)` so containment depth decides fill — same trick as invert, no boolean ops).
    Used by the split "bar" catalog templates (title in negative on a filled band).
- `TextSlotDef` adds `id`, `placeholder`, optional `labelKey` (i18n `stamp_generator.slots`) —
  **omit it to keep the slot fixed**: it renders its placeholder and is
  not listed in the Text tab (`isLabeled()` in types.ts is the one check) — optional `letterSpacing`
  (initial tracking, design px) and `fontPostscriptName` (pins a face, e.g. the bundled
  `Montserrat-Medium` for 統一編號). `StampTemplate.nameKey` is the i18n key (= id for catalog entries).
- Every template declares `category: TemplateCategory` (`TEMPLATE_CATEGORIES` in types.ts: the frame
  shapes `circle | oval | square | rect`, then `tw_company` for the regulated 統編章 pair
  tw_company_oval / tw_company_rect). The dialog's top bar (a row of antd outlined Buttons in
  `StampGenerator.tsx`) reads the current template's category, filters the picker to it, and picking one
  selects its first template through the normal switch-template path (so the unsaved-changes warning
  still applies). No extra store state. A template with `locales` is listed only in those UI languages
  and one with `excludedLocales` everywhere else (the TW 統編章 pair: `['zh-tw']`; the 公司小章 square
  seals and rect_title_name: `CHINESE_LOCALES` from templates/fonts.ts; rect_title_name_latin excludes
  them and shares the nameKey). Japanese seals (circle_done, square_signature) stay global for now: too
  few templates to split. (`getVisibleTemplates()` in
  templates/index.ts), and a category button appears only while it has a visible template, so
  `tw_company` shows for zh-tw alone. The dialog opens on the first circle template. The TW seals keep
  their SVG frames: their outer rings are fixed by regulation, never a border.

Text measurement mounts the element off-screen (`withMounted`); glyph outlines come from
`convertTextsToPath` (fontkit). Every converted line goes through `resolveOverlaps` because static
Montserrat faces overlap contours on purpose (the "4").

## Element slots and icons

Element shape keys are Element-panel keys (`animals/i_land-16`, `basic/icon-star1`, Noun Project
`np/<id>`) loaded through `@core/helpers/generator/loadShape` (moved out of the keychain generator),
plus bundled `stamp/*` icons from `templates/icons` (camera, plane, check, plum, star: shapes the
panel doesn't have) that `buildElement.ts` registers in the shared `svgCache` so thumbnails and
loading treat them like any key. A labeled slot lists `options` (preset keys) in the Element tab via
the shared `@core/app/widgets/ElementPicker` (preset grid, selected slot with clear, "more" opens the
Element panel browser); clearing sets `enabled: false, shapeKey: ''`. Fixed slots (no label) just
render their `shapeKey`. The paw stamp's default is the panel's own paw; camera and plane have none.

## Fonts

- `resolveDefaultFont(template.preferredFonts)` in the store probes candidates in order with
  `getFontObj` (skips fonts that don't resolve or don't load: web font offline, macOS font not
  downloaded), falls back to the user's default font; cached per candidate list per session.
- Lists in `templates/fonts.ts`: `KAI_FONTS` (TW-MOE-Std-Kai web font, then OS 標楷體), `JP_FONTS`
  (Hiragino Mincho / Yu Mincho / MS Mincho). Catalog entries with a Latin preset pin the bundled
  Montserrat Medium as a fallback.
- Bundled fonts: `helpers/fonts/bundledFonts.ts` (Electron disk path or web `WebFont.url`);
  `getFontOfPostscriptName` resolves them by exact postscript name, and `useStampStore` registers the
  `@font-face` when a slot pins one. They are stamp-only on purpose: NOT in `requestAvailableFontFamilies`
  / `requestFontsOfTheFontFamily`, because image-based exports (thumbnails, Print-and-Cut PDF) render in
  an isolated document that only sees installed fonts and inlined web fonts, so a bundled family picked
  in the main Text tool would fall back there. Only Montserrat-Medium is bundled (OFL).
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
  and rotation about the slot center. `ElementSlotDef.shapeKey` picks the default shape (`plum`, `star`, …);
  a slot with `labelKey` is listed in the Element tab (switch + size %; rotation and shape picker
  have store support but no UI yet). Converted ornaments are labeled 圖示; stars stay fixed.

## paper.js Gotchas

- `child.clone()` on a compound's child inserts the clone into that compound → always
  `clone({ insert: false })` for detached copies.
- `compound.children` is live: copy the array before re-parenting children in a loop.
- `resolveCrossings` does not merge overlapping contours; `item.unite(item)` does.
- paperjs-offset (used for arc `offset`): positive always expands, result always clockwise, and offsetting
  a compound offsets every child the same way (counters grow shut). Strip degenerate curves first
  (`removeDegenerateCurves`) or it can recurse forever.

The options panel scrolls; its tab bar is sticky and antd's tab content pane is made non-positioned
(`OptionsPanel.module.scss`) so the Element picker's inline drawer anchors to the modal.

## Store (`useStampStore.ts`)

State: `template`, `parsed`, `project`, `state: StampState` (`texts`, `elements`, `invertColor`,
`flipHorizontal`, `sizeIndex`), `shape`, `previewSvg`, `sizeRatio`, `defaultFont`, `isModified`,
`buildVersion`. Actions: `selectTemplate`, `updateText`, `updateElement`, `updateSharedFont`,
`updateState`, `resetState` (rebuilds defaults from the stored `defaultFont`), `reset`. Every update
calls `applyOptions()`; a slower older build is discarded by `buildVersion`.

## i18n

`stamp_generator.{basic, border, categories, export_failed, layers, legend, slots, switch_template_warning, tabs, templates}`
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
- Element tab rotation / shape picker, designer-provided thumbnails and generator icon
  (`icons/generator/stamp.svg` is a placeholder), bold text (font-weight can't produce outlines; per-contour offset was too slow).
