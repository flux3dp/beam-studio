---
name: print-and-cut
description: Print and Cut dialog — print a design on paper, then camera-align and laser-cut it. Covers the step flow, stores (dialog + persisted config), contour tracing, mark alignment pipeline, resume/repeat runs, and .beam persistence. Use when working on components/dialogs/PrintAndCut/ or its fluxghost opencv commands.
---

# Print and Cut

Location: `packages/core/src/web/app/components/dialogs/PrintAndCut/`

## Overview

FullWindowPanel dialog: the user prepares a design → exports a PDF with alignment
marks → prints it → places the sheet in the machine → the camera detects the marks
→ the cut geometry is aligned to the physical sheet and emitted as a cutting layer.
Supports repeat runs (cut many printed sheets from one preparation) and survives
save/reopen via `.beam` miscData.

The **main flow is stable** — UI polish and performance work should not change the
step sequence, the store contracts, or the persisted config shape.

## Step flow

Linear steps `printAndCutSteps = ['setup', 'paper', 'export', 'align']` plus a
virtual `'resume'` entry step (outside the array, shown when a saved config exists).

1. **setup** — choose `contourSource`: `'outline'` (trace design silhouette, offset
   by `offsetDistance`) or `'layer'` (use an existing layer as the contour).
2. **paper** — paper size (`'fit'` or a standard size), orientation, grid
   rows/columns/gap.
3. **export** — render design + marks to a 300 dpi PDF (contour NOT included).
4. **align** — one button: camera capture → mark detection → rigid fit; preview
   shows the design landing on the photographed sheet.
5. **Finish** (footer) — `generateAlignedCutLayer()`: one undoable BatchCommand
   (replace previous tagged cut layer, insert aligned contour geometry, hide all
   original layers), then save the reusable config.

**Resume**: reopening with a saved config lands on the resume screen (canvas shows
the printed sheet: paper + marks + contour + snapshot-verified artwork).
*Continue to Alignment* → step 4 directly (align's Back returns to resume);
*Start Over* → `startFreshRun()` + `clearResumeConfig()`.

## File structure

```
PrintAndCut/
├── index.tsx                # showPrintAndCut() entry: resume-vs-fresh branching
├── PrintAndCut.tsx          # Dialog shell: step match, sidebar, shared footer
├── Canvas.tsx               # Store→CanvasManager effect bindings
├── CanvasManager.ts         # EmbeddedCanvasManager subclass (preview rendering)
├── store.ts                 # Dialog zustand store (ephemeral; withFullBBox action helper)
├── resumeConfigStore.ts     # Persisted ResumeConfig store (survives dialog)
├── constants.ts             # Steps, paper sizes, mark sizes, tolerances, CUT_COLOR
├── steps/                   # StepSetup / StepPaper / StepExport / StepAlign / StepResume + RemainingTime
└── utils/
    ├── startFreshRun.ts     # collect → no_content guard → clearRasterCache → init
    ├── collectContents.ts   # Visible design elements + bbox + element snapshots
    ├── contentsLayers.ts    # getContentsLayers (excludes data-pnc-cut + hidden), getGeneratedCutLayers
    ├── printingContentsSnapshot.ts  # Snapshot capture + matchPrintingContents (resume check)
    ├── contourElements.ts   # Layer-mode contour readers (frozen markup or live layer)
    ├── computeContourPathD.ts  # Raster → fluxghost image_contour → ClipperOffset → d
    ├── layout.ts            # Pure sheet geometry: computeFullBBox, marks, grid, content bbox, paper
    ├── measure.ts           # getPathBBox, measureWithLayersShown
    ├── exportPdf.ts         # jsPDF export (marks incl. white base disc)
    ├── captureWorkareaImage.ts  # Camera capture orchestration (preview mode + sweeps)
    ├── smartMarkSweep.ts    # Mark-seeking regional sweep (stops when 4 marks found)
    ├── alignByCamera.ts     # detectAlignmentTransform + refineMarkPatches
    ├── detectMarkBlobs.ts   # Shared fluxghost detect_blobs param window
    ├── rigidTransform.ts    # Point/RigidTransform, 2D Kabsch fit
    ├── alignProgress.ts     # Unified align progress (phases → store alignProgress)
    └── generateCutLayer.ts  # Finish: cutting layer + config save
```

## State model

Two stores, deliberately separate:

- **`store.ts` (`usePrintAndCutStore`)** — ephemeral; `reset()` on dialog unmount.
  `combine` pattern. Type hierarchy: `ContourState` (cut geometry) ⊂
  `SheetSetupState` (+ grid/marks/paper/offset + printingContentsElements
  snapshots — everything the persisted config shares verbatim with the dialog
  state, so a config spreads straight into the store on resume) ⊂ `CanvasState`
  (+ fullBBox nullable, printingContentsBBox/ElementIds, step/resume flags);
  `State = AlignState & CanvasState`.
- **`resumeConfigStore.ts` (`useResumeConfigStore`)** — `ResumeConfig extends
  SheetSetupState` adding only `fullBBox: BBox` (non-null: Finish only saves once
  a layout exists); written by Finish, serialized into `.beam` miscData (`pnc` key),
  restored on load (`config: data.pnc ?? null` — explicit null so other files
  clear it), cleared by `clearScene` (svg-editor.ts) on New file.
  `setResumeConfig` also marks the file unsaved.

Key naming (post-2026-07-30 rename — keep consistent):

- `printingContents~` = the artwork that gets printed (`printingContentsBBox`,
  `printingContentsElements` snapshots, `printingContentsElementIds`,
  `isPrintingContentsChanged`).
- `contour~` = the cut geometry (`contourSource: 'outline' | 'layer'`,
  `contourPathD`, `contourLayerName`, `contourElements` frozen markup).
- `fullBBox` = the box the sheet is laid out around — **the contour's extent**,
  not the design layers' bbox (an image's transparent padding inflates its element
  bbox; the traced path hugs opaque pixels). Computed by `computeFullBBox`:
  outline mode → `getPathBBox(contourPathD)` (contents bbox stands in pre-trace);
  layer mode → contents ∪ `getContourLayerBBox`.
- "cut" is reserved for the laser output: `CUT_COLOR`, `data-pnc-cut`
  (`PRINT_AND_CUT_LAYER_ATTR`), `generateCutLayer`, `cutting_layer_name`.

### Layout invariant

Every change to what gets cut or how it is arranged goes through
`withFullBBox(state, patch)` (store-internal): it recomputes `fullBBox` and
`markPositions` together via `utils/layout.ts`. Marks sit `markBaseRadiusPx`
outside the grid box corners — **no extra offset term**: the traced path already
includes the contour offset. `setOffsetDistance` is a plain set; marks move when
the re-traced path arrives via `setContourPathD`. All other geometry
(`getGridBBox` / `getGridOffsets` / `getContentBBoxFromState` /
`getPaperDimensionsMm` / `getPaperRect`, `MarkPosition`) lives in
`utils/layout.ts` — pure functions over the state, no store access; store.ts
holds only state, actions and `withFullBBox`.

## Contour tracing (outline mode)

`computeContourPathD(printingContentsBBox, offsetDistance)`:
raster all design layers at 1px = 1 canvas unit (`switchSymbolWrapper` for image
symbols) → fluxghost `image_contour` (`min_area: 1`, alpha/luminance silhouette,
RETR_EXTERNAL — no holes) → **contours cached as a promise per dialog run**
(`cachedContours`, cleared by `clearRasterCache` in `startFreshRun`) → one outward
`ClipperOffset` pass (jtRound + **etClosedLine**, NOT etClosedPolygon — spikes at
small deltas) → orientation filter drops inner band/holes → `buildSvgPathD`.
Fallback on any failure: `fallbackRectD` (rounded rect around bbox + offset).
StepSetup drives it through a remeda `funnel` (300 ms, leading+trailing) with a
`runIdRef` guard against out-of-order completion.

## Alignment pipeline (step 4)

`handlePreviewAndAlign` in StepAlign:

1. `captureWorkareaImage({expectedMarks, onProgress})` — clears the background
   drawer, enters preview mode if needed (`setupPreviewMode({waitForFullAreaCapture:
   true})` so the setup's own full-area capture is awaited, not raced); regional
   machines run `runSmartMarkSweep` (serpentine tiles + per-tile `detectMarkBlobs` +
   pair-lock/single-anchor hypotheses + targeted confirm captures, budget 10,
   ESC stops); degrades to a plain full `previewRegion`; full-area machines
   one-shot. Keeps preview mode running whenever `supportsRegionPreview()`
   (manager's supportedPreviewModes includes REGION — regional AND dual-mode
   machines), because refinement needs the camera.
2. `detectAlignmentTransform` — mark centers from the sweep, else
   `detectFromBackground` (`findAlignment`: all C(N,4)×4! assignments, Kabsch fit,
   residual < `MATCH_TOLERANCE` (2 mm rms), smallest |angle| wins — the mark
   rectangle is 180°-symmetric). Then `refineMarkPatches`: per-mark centered
   retake, only a `REFINE_PATCH_SIZE_PX` patch kept, redetect. On a dual-mode
   machine still in FULL_AREA (fbm2, wide-angle BB2/HEXA II) it first
   `switchPreviewMode(REGION)` so the camera can be driven over each mark;
   machines without region previews skip refinement. Always ends preview mode
   in `finally`.
3. `setAlignmentTransform` → CanvasManager `setContentTransform` moves
   design+marks overlay over the fixed camera image.

Progress: reporters call `reportAlignProgress(phase, {current, total, stoppable})`
(`alignProgress.ts` phases: preparing/capture/locate/detect/refine/completing →
% ranges; `completing` is the post-refine redetect, the flow's last step —
reported inside the refinement branch so the tail phases stay in ascending order
and `refine` keeps advancing the bar);
store clamps the percentage **monotonically** (phases legally revisit).
`AlignProgress` stays language-free — it carries `phase`/`current`/`total`, and
the view builds the label (`buildMessage` in StepAlign, where `completing` reuses
the `detecting` label so the message does not flip). StepAlign renders an antd
`Progress` in the sidebar; `clearAlignProgress` in `finally`.
`steps/RemainingTime.tsx` owns the countdown: it restarts from each new
`remainingSeconds` estimate (average pace since phase start) and ticks down
locally in between, showing `calculating` until an estimate exists and
`completing` during the wrap-up phase instead of a time.
`isProcessing` disables the shared footer (owned by PrintAndCut.tsx).

## Preview canvas

`PrintAndCutCanvasManager extends EmbeddedCanvasManager`; constructed once per
dialog with `{printingContentsElementIds, isResume}` read via `getState()`.
`renderContent` deep-clones live `#svgcontent` (display-only: pointer-events
none), removes generated cut layers, filters to snapshot ids (resume), force-shows
hidden layers (resume), then wraps everything in
`contentGroup { designGroup(+contourPathElem+contourLayerGroup), copiesGroup, marksGroup }`
so `setContentTransform` moves design+marks as one unit while the camera `<image>`
stays fixed. `setBackgroundRect` sets the viewport (white rect = paper);
`setGridOffsets` renders `<use>` copies. Canvas.tsx binds store → manager with
effects; background is per-step (`setup` padded content, `paper/export/resume`
paper rect, `align` whole workarea).

## Resume correctness rules

- Frozen at Finish, never re-read live: `contourPathD` / `contourElements`
  (markup `outerHTML`), `fullBBox`, `markPositions`, grid/paper settings,
  `printingContentsElements` snapshots. A resumed Finish passes the frozen
  snapshot through unchanged.
- Snapshot match = id AND tag AND rounded bbox (ids get recycled via draw.js
  `releaseId`, so id alone is unsafe). Any mismatch ⇒ `isPrintingContentsChanged`
  ⇒ artwork suppressed in preview (empty id set) + `design_changed` Alert. Match
  runs inside `measureWithLayersShown` (getBBox is zero inside `display:none`).
- Repeat Finish **replaces** the previous `data-pnc-cut` layer inside the same
  BatchCommand (`deleteLayerByName` + `identifyLayers` resync before createLayer).
- The resume entry bypasses the no-content guard (design layers are hidden after
  a finish); Start Over does not (alert + keep config).

## Gotchas

- `getBBox()` returns zeros inside a `display:none` subtree — wrap DOM
  measurement of possibly-hidden layers in `measureWithLayersShown` (measure.ts).
- Layer-mode caveats (accepted): serialized `<use>` needs its symbol alive in
  live defs; `cloneLayerConfig` reads the LIVE source layer's machine params.
- The generated cut layer is excluded everywhere design content is gathered
  (`getContentsLayers`, raster, PDF, preview clone) — always via
  `PRINT_AND_CUT_LAYER_ATTR`, never by name.
- `image_contour` / `detect_blobs` command strings are string-matched against
  fluxghost `cmd_mapping` — never rename unilaterally; after backend changes run
  `uv run python tools/ws_smoke.py` in ../fluxghost (must end ALL PASS).
- Marks: 6 mm black dot on a 12 mm white base disc (PDF only, not the dialog
  preview); `getContentBBox` inflates by the BASE radius so 'fit' paper doesn't
  clip it. `PRINT_MARGIN_MM = 10` guards printer unprintable borders.
- Old dev `.beam` files saved before the 2026-07-30 config-key rename
  (`designBBox`/`cutSource: 'contour'` era) will not resume — re-Finish rewrites
  them.
- jsPDF swaps format dimensions against orientation — exportPdf derives
  orientation from the computed dimensions instead of state.

## Safe vs load-bearing for future work

- **Safe to change**: step sidebar UI, progress presentation, canvas styling,
  paper size list, mark sweep heuristics/budgets, contour cache strategy.
- **Load-bearing (coordinate before changing)**: `ResumeConfig` shape
  (persisted in .beam), `data-pnc-cut` attr, `ContourState` semantics, the
  frozen-at-Finish rules above, fluxghost command names/params, the
  single-BatchCommand undo contract of `generateAlignedCutLayer`.
