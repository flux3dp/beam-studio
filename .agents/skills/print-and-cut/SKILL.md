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
   (replace previous tagged cut layer, insert aligned contour geometry, hide
   ALL original layers — UV Print layers included: they yield no machine task
   but sit at the design position, misaligned next to the aligned cut layer),
   then save the reusable config. UV layers that were visible when Finish hid
   them are tagged `data-pnc-hidden` (`PRINT_AND_CUT_HIDDEN_ATTR`, set outside
   undo history). The tag means "hidden by Finish, still design content" and
   the flow reads tagged layers IN PLACE — `getContentsLayers` counts
   visible-or-tagged layers, the renderers (contour raster, PDF export,
   preview clone) strip `display` from their clones, and collection measures
   inside `measureWithLayersShown` — so Start Over never mutates the document
   and adds nothing to undo history. A layer the user hid carries no tag and
   stays excluded; a manual visibility toggle (`setLayerVisibility`) strips
   the tag as an undoable subcommand, so re-hiding a layer by hand excludes it
   from the next run. (An aligned-instead-of-hidden variant via a display-only
   `transform` on the UV layer groups was built and reverted 2026-08-26:
   editing content inside a transformed layer group misbehaves. An
   unhide-at-Start-Over variant — plain, then as an undoable BatchCommand —
   was replaced by read-in-place 2026-08-27.)

**Design content = UV Print layers that are visible or `data-pnc-hidden`-tagged**
(`data-module` = `LayerModule.UV_PRINT`, filtered in `getContentsLayers`): that
is what gets rasterized, exported to PDF and snapshotted. Entering a fresh run requires the
`enable-uv-print-file` preference: `startFreshRun` alerts with an
Open-Preferences button (settings modal → Editor tab, scrolls to
`#set-enable-uv-print-file`) when it is off, alerts `no_uv_layer` when no layer
has the UV Print module, and `no_content` when the UV layers are empty/hidden.
The resume path opens regardless (frozen config); a failed Start Over shows the
matching alert and closes the dialog (config kept).

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
    ├── startFreshRun.ts     # preference + UV-layer guards → collect → clearRasterCache → init
    ├── collectContents.ts   # Visible design elements + bbox + element snapshots
    ├── contentsLayers.ts    # getContentsLayers (UV Print layers only; excludes data-pnc-cut + hidden), getGeneratedCutLayers
    ├── printingContentsSnapshot.ts  # Snapshot capture + matchPrintingContents (resume check)
    ├── contourElements.ts   # Layer-mode contour readers (frozen markup or live layer)
    ├── computeContourPathD.ts  # Raster → fluxghost image_contour → ClipperOffset → d
    ├── layout.ts            # Pure sheet geometry: computeFullBBox, marks, grid, content bbox, paper
    ├── measure.ts           # getPathBBox, measureWithLayersShown
    ├── exportPdf.ts         # jsPDF export (marks incl. white base disc)
    ├── rigidTransform.ts    # L0 pure math: Point/RigidTransform, 2D Kabsch fit (+ per-axis residual, diagnostic scale), match tolerance
    ├── align/               # Camera alignment, layered (each file imports only lower layers)
    │   ├── alignByCamera.ts     # L3 orchestrator: alignByCamera() = capture → refine → redetect → fit → calibration offset
    │   ├── capture.ts           # L2 captureWorkareaImage: full-area shot / smart sweep / region sweep → mark centers
    │   ├── smartMarkSweep.ts    # L2 mark-seeking regional sweep (stops when 4 marks found)
    │   ├── refineMarkPatches.ts # L2 per-mark centered retake, patch kept
    │   ├── detectMarks.ts       # L1 detectMarkBlobs (fluxghost window) + findAlignment + detectFromBackground
    │   ├── previewSession.ts    # L1 supportsRegionPreview / ensurePreviewMode / ensureRegionPreview / endPreviewMode
    │   ├── alignProgress.ts     # reporter: phases → store alignProgress
    │   └── alignLog.ts          # leaf: Logger('print-and-cut') events + one failure-image slot → bug report section
    └── generateCutLayer.ts  # Finish: cutting layer + config save
└── calibration/             # Vernier offset calibration (separate menu item, see below)
    ├── index.tsx            # showPrintAndCutCalibration(device): guards, device select, dialog
    ├── PrintAndCutCalibration.tsx  # 3-step DraggableModal: print / align+scratch / readings
    ├── layout.ts            # Sheet geometry: 80 mm box, scales start at READING_MAX+2 mm so they never cross; getScaleSegments(bbox, 'printed' | 'scratch') — 1.0 mm outward / 0.95 mm inward (41 lines, ±1 mm)
    ├── exportCalibrationPdf.ts  # Vector jsPDF: marks + scales + index labels (no bbox arg: laid out around a box at the origin, paper-relative)
    ├── scratchTask.ts       # Per-model scratch power/speed table; buildScratchSvg → getFcodeFromSvgString → doCalibration
    ├── scaleProfile.ts      # Pure: darkness sampler, 4 bands → 1D profiles (sheet frame through the transform), line centers, sparse-comb estimateReading
    ├── measureReading.ts    # Camera read of both scales: region previews on each scale (else full-area) → background → per-axis estimate
    └── offsetStore.ts       # PncOffset: machine camera_calib/pnc.json, else local storage by serial; readingToOffset, clearPncOffset
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

One entry point, `alignByCamera({ applyCalibration })` in `utils/align/`,
called by StepAlign and by the calibration dialog. It writes `cameraImageUrl`,
`detectedMarkCenters` and `alignmentFit` to the store as it goes, so the
callers only reset state, call, and apply the returned transform. Layers:

1. **capture** — `captureWorkareaImage({expectedMarks, onProgress})` returns
   the located mark centers (or null) plus the image: clears the background
   drawer, `ensurePreviewMode` (setup awaited, so a full-area machine's own
   capture is not raced), then
   - regional machine: `runSmartMarkSweep` (serpentine tiles + per-tile
     `detectMarkBlobs` + pair-lock/single-anchor hypotheses + targeted confirm
     captures, budget 10, ESC/Stop stops it); a sweep that never locked on
     degrades to a plain `previewRegion` and `detectFromBackground` on the
     whole bed;
   - full-area machine: one shot, `detectFromBackground` → `findAlignment`
     (all C(N,4)×4! assignments, Kabsch fit, per-axis residual within
     `getMatchTolerance(expected)` — each axis max(2 mm, 2 % of the mark
     rectangle's side along that axis), residuals measured in the sheet frame
     so camera distortion on large designs widens the tolerance rather than
     failing — smallest |angle| wins; the rectangle is 180°-symmetric);
   - dual-mode fallback (fbm2, wide-angle BB2/HEXA II): blobs seen
     (`detectedCount > 0`) but no fit → `ensureRegionPreview` and the regional
     sweep above; zero blobs still fail fast (sheet missing / exposure).
   Preview mode stays running whenever `supportsRegionPreview()`; the
   lowest-residual fit of a failed detection comes back as `closestFit` for
   the readout.
2. **refine** — `refineMarkPatches`: `ensureRegionPreview` (switches a
   dual-mode machine out of FULL_AREA), then per mark a centered retake of
   which only a `REFINE_PATCH_SIZE_PX` patch is kept; machines without region
   previews skip it. Then `detectFromBackground` again on the patched image.
3. **fit** — the redetected fit, else `fitRigidTransform(expected, marks)`
   on the located centers; stored as `alignmentFit` (rotation / scale / fit
   error x / y mm in StepAlign, red over tolerance; `scale` is the similarity
   best-fit, diagnostic only — the applied transform stays rigid); then
   `correctByCalibration` (machine-stored offset, see below) unless
   `applyCalibration: false`. `endPreviewMode` in `finally`.
4. `setAlignmentTransform` → CanvasManager `setContentTransform` moves
   design+marks overlay over the fixed camera image.

Diagnostics: every stage calls `logAlign(event, data)` (alignLog.ts; mm units,
also mirrored to the console) — `run` (device, sheet setup, expected marks,
tolerance), `exposure` (from ExposureControl), `detect` (per searched image:
blobs, closest fit, matched), `smart-sweep` / `sweep` / `dual-mode-fallback`,
`refine`, `aligned`, `detect-failed`, `error`. A failed run also keeps ONE
downscaled JPEG of the background (`saveFailureImage`, ~200 KB base64,
overwritten by the next failure). `output-error.ts` emits both as the
`======::print-and-cut::======` section; the automatic S3 upload passes
`includeImages: false` so a photo of the bed only leaves with a deliberate
report.

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

## Offset calibration (`calibration/`)

Menu item `CALIBRATE_PRINT_AND_CUT` (Calibration submenu, both menus →
`menuDeviceActions`). Measures the machine's systematic print-to-laser offset
with a vernier: the sheet prints 41 lines per axis at 1.0 mm pitch (x scale
below the box center, y scale to its right, numbered every 5th line) plus the
standard 4 marks; the laser scratches 41 lines at 0.95 mm pitch against each
scale, so the printed index k that coincides with a scratched line means the
laser landed `k × 0.05 mm` (right/down positive, range ±1 mm) from the print.

- Borrows the dialog store: `init({printingContentsBBox: getCalibrationBBox()})`
  seeds `markPositions`, `reset()` on unmount; refuses to open while the main
  dialog is open (and vice-versa is not guarded — the calibration is modal).
- Align = `alignByCamera({ applyCalibration: false })` — the stored offset
  must not be applied while measuring it. The capture lands in the editor's
  background drawer like any preview (showing it in the modal / clearing it on
  close is an open discussion).
- Scratch (`runScratchTask`): `buildScratchSvg` renders the transformed combs
  as a bare stand-alone scene (one `<g class="layer">` with the attributeMap
  keys module/strength/speed/repeat; no root data-* — workarea, dpi and flags
  travel as parser args) and `exportFuncs.getFcodeFromSvgString` feeds it to
  `fetchTaskCode` via its `uploadFile` override (skips the canvas prep; fluxghost
  engine only, never Swiftray; `buildScratchThumbnail` rasterizes the same
  string cropped to the sheet, strokes thickened, ≤500 px — the parser insists
  on decoding a thumbnail, and a 1×1 png is the fallback when none is given), then `deviceMaster.doCalibration({ blob })`. The
  document is never touched. Power /
  speed are dialog inputs seeded from `getDefaultScratchParams(model)`, a
  per-`WorkAreaModel` table (placeholder 10 % / 20 mm/s until hardware-tuned).
- Camera read (`measureReading`, step 3 button `auto_read`, also auto-run once
  after a successful scratch): `ensurePreviewMode`, then on region-capable
  machines one silent `preview(x, y)` centered on each scale's line pattern
  (SCALE_START + PRINTED_LINE/2 along its axis, through the transform); the
  background drawer canvas becomes an ImageData + `createDarknessSampler`
  (ratio = image px / canvas px). Per axis, `getScaleBands` gives `printed`
  (SCALE_START..+PRINTED_LINE, base length only so every line weighs the
  same) and `scratch` (SCALE_START−SCRATCH_LINE..SCALE_START).
  `extractProfile` walks a band IN THE SHEET FRAME and maps each sample
  through the transform (no image rotation), 0.1 mm steps over
  ±(READING_MAX+1) mm — the span is deliberately NOT wider, or the other
  axis's lines would leak into the band. `findLinePositionsMm`: rolling
  20th-percentile baseline over 3 pitches (NOT a median — the scratch kerf is
  ~0.4 mm at 0.95 pitch, a median climbs onto the lines; hardware-observed
  dropouts) − LOCAL threshold per sample (window ±5 pitches: min(p70,
  0.35·p95) with a 10/255 floor — contrast varies along one scale on hardware,
  printed ink faded to ¼ within a scale under uneven exposure) − runs above
  threshold, SPLIT at internal valleys (`splitRun`: peaks ≥ 0.4 mm apart, a
  dip below 0.8× the lower peak splits — wide printed ink merged lines 9+10
  into one run on hardware) → darkness-weighted centroid.
  `measureScratchLengthsMm`: per scratched line, walk inward from
  SCALE_START−0.5 until 3 samples fall below (line interior + paper beside
  it)/2 → length. Lengths are MEASURED, not sampled in fixed bands, because
  on hardware every burn came out ≈2.5 mm longer than designed (pattern
  intact) and fixed extension bands then saw all 41 lines.
  `estimateReading({printedMm, scratchMm, scratchLengthsMm})`: printed ≥ 30
  lines, indexed by circular-mean phase + extent (shift ∈ −2..2; a single
  fit within ±20 wins), else by the ORIGIN PRIOR (the shift whose origin is
  within 0.35 mm of the designed position — the fit places the sheet far
  better than half a pitch; needed when an end line is lost to fade); scratch
  ≥ 6 lines, phase from every line, shift ∈ {−1,0,1} relative to the printed
  origin; candidates outside ±20 drop, the rest are scored by the length
  anchors relative to the comb's MEDIAN length: ≥ median+0.75 mm → 5th-line
  anchor (index % 5 must be 0, ±1), the single longest ≥ median+2.25 mm →
  middle anchor (index must be 0, ±2). Unique survivor or clear best score
  wins, else null. offset = mean(s − origin − i·0.95), reading = round(offset
  / 0.05), |reading| ≤ 20. No anchoring on the alignment fit is needed:
  both trains are sampled through the same transform. A failed axis keeps
  the manual value and a warning message (`auto_read_failed`) shows.
  Spec: scaleProfile.spec.ts — synthetic rotated sheet with the length
  pattern (paint symmetric 2 px lines; an asymmetric rasterizer biases every
  centroid by ¼ px): complete, sparse-with-anchor (indices ≤ 3 → −12), same
  with +2.5 mm burns, sparse-without-anchor → null; PLUS five hardware crops
  as grayscale PNG fixtures in `__fixtures__/` (decoded in the spec with
  `pngjs` + `fs`, since jsdom cannot decode images; geometry per crop —
  axis, pxPerMm, crop origin (u0, v0), expected reading — lives in the spec's
  `crops` table): `read-scales-{x,y}-beamo` read −1/−1 (beamo, 2026-09-14;
  burns at designed length, even lighting — the beamo II crops, with 2.5 mm
  overlong burns, were never captured raw and should be re-captured).
  To capture a new fixture, TEMPORARILY add a file write of the crop canvas
  BEFORE the overlay is drawn in `logDebugCrop` (plus the exact geometry:
  bbox, transform, ratio, crop left/top — the current crops only have an
  approximate identity-transform geometry, which is why the origin-prior
  test runs on the synthetic sheet); earlier crops were dropped because
  overlay ticks were baked in —
  those two failure modes (uneven exposure fading the printed ink to ¼
  contrast; a fleck 0.3 mm beside a burn) are covered by synthetic cases and
  by the local threshold / fleck rejection they motivated, and should get a
  raw hardware crop again when they recur. Regression-test any detector
  change against all crops; add one from every new failure mode. Dev builds
  (isDev) print each scale's crop to the console with overlays: printed
  centers green, each scratched line's measured extent red beside it + blue
  mark at its inner end; nothing is written to disk.
- Store: `PncOffset {x, y}` mm in the sheet frame = where the laser landed
  relative to the print. ON THE MACHINE as `camera_calib/pnc.json` when its
  firmware takes a json upload there, ELSE ON THIS COMPUTER in storage
  `'pnc-offset-store'` keyed by serial. The fluxmonitor firmware generation
  (beamo, Beambox, HEXA, beamo II; ~/Desktop/dev/beambox-firmware) refuses
  every directory: its `upload` only knows the `SD`/`USB`/`SAMPLE` entries
  (BAD_ENTRY otherwise — preference/ and laser_records/ were tried and
  dropped, per user) and `config set/get` a fixed key list (camera_offset has
  a dedicated key, there is no generic one), so those machines always land in
  local storage. Read = machine then local; write = machine (and drop the
  local copy) else local; clear = both
  (`fetchPncOffset` / `savePncOffset` over `jsonDataHelper`'s loadJson /
  uploadJson; a missing or malformed file reads as undefined). The offset is
  only valid for the camera calibration it was measured against, so
  `clearPncOffset` (deleteFile, missing file ignored) runs after EVERY camera
  calibration write: `doSetConfigTask` (classic camera_offset) and
  `setFisheyeConfig` in camera-calibration-helper (not the wide-angle.json
  upload, per user decision). A new camera write path must call it too.
  `savePncOffset` rounds to 3 decimals (µm) so 8 × 0.05 does not upload as
  0.39999999. `alignByCamera`
  fetches it BEFORE the capture (control socket still free — preview may hold
  it in raw mode) and applies it after the fit via `correctByCalibration`:
  the negated offset, rotated by the fitted angle, is added to `tx/ty`.

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
paper rect, `align` whole workarea). The align flow feeds the canvas through
store state (`cameraImageUrl`, `detectedMarkCenters` — the latter zooms via
`zoomToMarks` while the marks are refined). (A manager-in-the-store variant
with direct imperative calls was tried and rolled back 2026-08-27: grid/mark
syncing needed a second mount-time path because `initFromConfig` runs before
the canvas exists.)

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
- The resume entry bypasses the startFreshRun guards (preference may have been
  turned off, or content hidden, since the finish); Start Over does not — on
  failure the alert shows, the dialog closes, and the config is kept.
- Resume previews and snapshot matching tolerate the fully hidden design:
  `renderContent` force-shows cloned layers when `isResume`, and the match
  runs inside `measureWithLayersShown`.

## Gotchas

- `getBBox()` returns zeros inside a `display:none` subtree — wrap DOM
  measurement of possibly-hidden layers in `measureWithLayersShown` (measure.ts).
- Layer-mode caveats (accepted): serialized `<use>` needs its symbol alive in
  live defs; `cloneLayerConfig` reads the LIVE source layer's machine params on
  the first Finish only — a repeat Finish clones the config from the replaced
  cut layer's detached group instead, preserving the user's tuning.
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
  (persisted in .beam), `data-pnc-cut` and `data-pnc-hidden` attrs,
  `ContourState` semantics, the frozen-at-Finish rules above, fluxghost
  command names/params, the single-BatchCommand undo contract of
  `generateAlignedCutLayer`.
