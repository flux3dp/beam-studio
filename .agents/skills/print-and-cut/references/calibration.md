# Print and Cut offset calibration

Location: `packages/core/src/web/app/components/dialogs/PrintAndCut/calibration/`
Reference for the `print-and-cut` skill (dialog, stores, alignment pipeline live in
SKILL.md). This doc only covers the calibration modal and the offset it produces.

## Overview

Menu item `CALIBRATE_PRINT_AND_CUT` (Calibration submenu, both menus →
`menuDeviceActions`). Measures the machine's systematic print-to-laser offset
with a vernier: the sheet prints 41 lines per axis at 1.0 mm pitch (x scale
below the box center, y scale to its right, numbered every 5th line) plus the
standard 4 marks; the laser scratches 41 lines at 0.95 mm pitch against each
scale, so the printed index k that coincides with a scratched line means the
laser landed `k × 0.05 mm` (right/down positive, range ±1 mm) from the print.

## Files

```
calibration/
├── index.tsx                   # showPrintAndCutCalibration(device): guards, device select, dialog
├── PrintAndCutCalibration.tsx  # 3-step DraggableModal: print / align+scratch / readings
├── layout.ts                   # Sheet geometry: 80 mm box, scales start at READING_MAX+2 mm so they never cross;
│                               #   getScaleSegments(bbox, 'printed' | 'scratch') — 1.0 mm outward / 0.95 mm inward (41 lines, ±1 mm)
├── exportCalibrationPdf.ts     # Vector jsPDF: marks + scales + index labels (no bbox arg: laid out around a box at the origin, paper-relative)
├── scratchTask.ts              # Per-model scratch power/speed table; buildScratchSvg → getFcodeFromSvgString → doCalibration
├── scaleProfile.ts             # Pure: darkness sampler, 4 bands → 1D profiles (sheet frame through the transform), line centers, sparse-comb estimateReading
├── scaleProfile.spec.ts        # Synthetic sheet cases + hardware crops from __fixtures__/
├── measureReading.ts           # Camera read of both scales: region previews on each scale (else full-area) → background → per-axis estimate
└── offsetStore.ts              # PncOffset: machine camera_calib/pnc.json, else local storage by serial; readingToOffset, clearPncOffset
```

## Dialog flow

- Borrows the main dialog store: `init({printingContentsBBox: getCalibrationBBox()})`
  seeds `markPositions`, `reset()` on unmount. Both entry points refuse to open
  while the other dialog is up (`PRINT_AND_CUT_DIALOG_ID` /
  `PRINT_AND_CUT_CALIBRATION_DIALOG_ID` in `../constants.ts`).
- Step 2 align = `alignByCamera({ applyCalibration: false })` — the stored offset
  must not be applied while measuring it. The capture lands in the editor's
  background drawer like any preview (showing it in the modal / clearing it on
  close is an open discussion).
- Step 3 readings are dialog inputs per axis; `auto_read` runs `measureReading`
  (also auto-run once after a successful scratch). A failed axis keeps the
  manual value and shows the `auto_read_failed` warning.

## Scratch task (`runScratchTask`)

`buildScratchSvg` renders the transformed combs as a bare stand-alone scene:
one `<g class="layer">` with the attributeMap keys module/strength/speed/repeat,
no root data-* — workarea, dpi and flags travel as parser args.
`exportFuncs.getFcodeFromSvgString` feeds it to `fetchTaskCode` via its
`uploadFile` override (skips the canvas prep; fluxghost engine only, never
Swiftray). `buildScratchThumbnail` rasterizes the same string cropped to the
sheet, strokes thickened, ≤500 px — the parser insists on decoding a thumbnail,
and a 1×1 png is the fallback when none is given. Then
`deviceMaster.doCalibration({ blob })`. The document is never touched.

Power / speed are dialog inputs seeded from `getDefaultScratchParams(model)`, a
per-`WorkAreaModel` table (placeholder 10 % / 20 mm/s until hardware-tuned).

## Camera read (`measureReading` + `scaleProfile.ts`)

### Sampling

`ensurePreviewMode`, then on region-capable machines one silent `preview(x, y)`
centered on each scale's line pattern (SCALE_START + PRINTED_LINE/2 along its
axis, through the transform); the background drawer canvas becomes an ImageData
+ `createDarknessSampler` (ratio = image px / canvas px).

Per axis, `getScaleBands` gives `printed` (SCALE_START..+PRINTED_LINE, base
length only so every line weighs the same) and `scratch`
(SCALE_START−SCRATCH_LINE..SCALE_START). `extractProfile` walks a band IN THE
SHEET FRAME and maps each sample through the transform (no image rotation),
0.1 mm steps over ±(READING_MAX+1) mm — the span is deliberately NOT wider, or
the other axis's lines would leak into the band.

### Line detection (`findLinePositionsMm`)

1. Rolling 20th-percentile baseline over 3 pitches — NOT a median: the scratch
   kerf is ~0.4 mm at 0.95 pitch, a median climbs onto the lines
   (hardware-observed dropouts).
2. LOCAL threshold per sample (window ±5 pitches: min(p70, 0.35·p95) with a
   10/255 floor) — contrast varies along one scale on hardware; printed ink
   faded to ¼ within a scale under uneven exposure.
3. Runs above threshold, SPLIT at internal valleys (`splitRun`: peaks ≥ 0.4 mm
   apart, a dip below 0.8× the lower peak splits) — wide printed ink merged
   lines 9+10 into one run on hardware.
4. Darkness-weighted centroid per run.

`measureScratchLengthsMm`: per scratched line, walk inward from SCALE_START−0.5
until 3 samples fall below (line interior + paper beside it)/2 → length.
Lengths are MEASURED, not sampled in fixed bands, because on hardware every
burn came out ≈2.5 mm longer than designed (pattern intact) and fixed extension
bands then saw all 41 lines.

### Reading estimation (`estimateReading({printedMm, scratchMm, scratchLengthsMm})`)

- **Printed comb**: ≥ 30 lines, indexed by circular-mean phase + extent
  (shift ∈ −2..2; a single fit within ±20 wins), else by the ORIGIN PRIOR (the
  shift whose origin is within 0.35 mm of the designed position — the fit
  places the sheet far better than half a pitch; needed when an end line is
  lost to fade).
- **Scratch comb**: ≥ 6 lines, phase from every line, shift ∈ {−1,0,1}
  relative to the printed origin; candidates outside ±20 drop, the rest are
  scored by the length anchors relative to the comb's MEDIAN length:
  ≥ median+0.75 mm → 5th-line anchor (index % 5 must be 0, ±1); the single
  longest ≥ median+2.25 mm → middle anchor (index must be 0, ±2). Unique
  survivor or clear best score wins, else null.
- offset = mean(s − origin − i·0.95), reading = round(offset / 0.05),
  |reading| ≤ 20. No anchoring on the alignment fit is needed: both trains
  are sampled through the same transform.

### Spec and hardware fixtures (`scaleProfile.spec.ts`, `__fixtures__/`)

Synthetic rotated sheet with the length pattern (paint symmetric 2 px lines; an
asymmetric rasterizer biases every centroid by ¼ px): complete,
sparse-with-anchor (indices ≤ 3 → −12), same with +2.5 mm burns,
sparse-without-anchor → null.

PLUS hardware crops as grayscale PNG fixtures (decoded in the spec with `pngjs`
+ `fs`, since jsdom cannot decode images; geometry per crop — axis, pxPerMm,
crop origin (u0, v0), expected reading — lives in the spec's `crops` table):
`read-scales-{x,y}-beamo` read −1/−1 (beamo; burns at designed
length, even lighting). The beamo II crops, with 2.5 mm overlong burns, were
never captured raw and should be re-captured.

To capture a new fixture, TEMPORARILY add a file write of the crop canvas
BEFORE the overlay is drawn in `logDebugCrop` (plus the exact geometry: bbox,
transform, ratio, crop left/top — the current crops only have an approximate
identity-transform geometry, which is why the origin-prior test runs on the
synthetic sheet). Earlier crops were dropped because overlay ticks were baked
in; those two failure modes (uneven exposure fading the printed ink to ¼
contrast; a fleck 0.3 mm beside a burn) are covered by synthetic cases and by
the local threshold / fleck rejection they motivated, and should get a raw
hardware crop again when they recur.

**Regression-test any detector change against all crops; add one from every
new failure mode.** Dev builds (isDev) print each scale's crop to the console
with overlays: printed centers green, each scratched line's measured extent red
beside it + blue mark at its inner end; nothing is written to disk.

## Offset store (`offsetStore.ts`)

`PncOffset {x, y}` mm in the sheet frame = where the laser landed relative to
the print.

- **Where**: ON THE MACHINE as `camera_calib/pnc.json` when its firmware takes
  a json upload there, ELSE ON THIS COMPUTER in storage `'pnc-offset-store'`
  keyed by serial. The fluxmonitor firmware generation (beamo, Beambox, HEXA,
  beamo II; ~/Desktop/dev/beambox-firmware) refuses every directory: its
  `upload` only knows the `SD`/`USB`/`SAMPLE` entries (BAD_ENTRY otherwise —
  preference/ and laser_records/ were tried and dropped, per user) and
  `config set/get` a fixed key list (camera_offset has a dedicated key, there
  is no generic one), so those machines always land in local storage.
- **Read** = machine then local; **write** = machine (and drop the local copy)
  else local; **clear** = both (`fetchPncOffset` / `savePncOffset` over
  `jsonDataHelper`'s loadJson / uploadJson; a missing or malformed file reads
  as undefined). `savePncOffset` rounds to 3 decimals (µm) so 8 × 0.05 does
  not upload as 0.39999999.
- **Invalidation**: the offset is only valid for the camera calibration it was
  measured against, so `clearPncOffset` (deleteFile, missing file ignored) runs
  after EVERY camera calibration write: `doSetConfigTask` (classic
  camera_offset) and `setFisheyeConfig` in camera-calibration-helper (not the
  wide-angle.json upload, per user decision). A new camera write path must
  call it too.
- **Consumer**: `alignByCamera` fetches it BEFORE the capture (control socket
  still free — preview may hold it in raw mode) and applies it after the fit
  via `correctByCalibration`: the negated offset, rotated by the fitted angle,
  is added to `tx/ty`. Skipped with `applyCalibration: false`.

## Maintenance

Update this doc when: the vernier geometry (pitches, line counts, READING_MAX,
SCALE_START), the scratch task path, the detector thresholds / anchoring rules,
the fixture set, or the offset storage location / invalidation triggers change.
Step-flow or store changes in the main dialog belong in SKILL.md.
