---
name: camera-calibration
description: Camera calibration flows and camera data structures — fisheye parameter versions (V2/V3/V4), storage files, per-model dialog steps, SolvePnP and CheckPnP. Use when working on calibration dialogs under components/dialogs/camera/, on cameraCalibrationApi, or on Promark camera parameters and rotation (helpers/device/promark/camera-rotation.ts, webcam-helper getPicture).
---

# Camera Calibration & Camera Data

Location: `packages/core/src/web/app/components/dialogs/camera/`
Data types: `packages/core/src/web/interfaces/FisheyePreview.d.ts`
WS API: `packages/core/src/web/helpers/api/camera-calibration.ts` (`cameraCalibrationApi`)

## Overview

Each FLUX machine family calibrates its camera through a dedicated dialog. All dialogs share
the same shape: gather/produce a set of fisheye camera parameters, let the user align marker
points (SolvePnP), verify the result (CheckPnP), and persist the parameters. The parameter
**version (V2/V3/V4)** differs per machine.

## Camera data structures (`FisheyePreview.d.ts`)

`FisheyeCaliParameters` = `V2Cali | V3Cali | V4Cali` — the loose in-progress accumulator used
during calibration. Each has a "final" counterpart (`FisheyeCameraParametersV2/V3/V4`) with
required fields and a `v` tag, which is what gets saved.

| Version | Machines | Distinct fields | Height model |
|---|---|---|---|
| **V2** | Ador (`ado1`) | `refHeight`, `levelingData: Record<string,number>`, `source: 'device'\|'user'`, `rvec_polyfit`/`tvec_polyfit` | 2 heights (`dh1`,`dh2`) → `extrinsicRegression` → single polyfit |
| **V3** | laser-head fisheye (`fbb2`, `fhx2rf`), Promark (`fpm1`) | plain `rvec`/`tvec` | single height (`dh=0`) |
| **V4** | wide-angle (BB2/Hexa cam #2), Beamo2 (`fbm2`) | `rvec_polyfits`/`tvec_polyfits` **per `WideAngleRegion`** | 2 heights × 9 regions |

`WideAngleRegion` = `top|bottom|left|right|center|topLeft|topRight|bottomLeft|bottomRight`.
Common to all: `d` (distortion), `k` (intrinsics matrix), `rvec`/`tvec` (extrinsics), `is_fisheye`.

**Manual offset** (all versions, fluxghost ≥ 2.5.7): optional `offset: [x, y]` in mm, applied by
fluxghost to the bed-plane object points before `project_points` (+X/+Y moves the preview left/up).
V4 adds `region_offsets: Record<WideAngleRegion, [x, y]>`, picked by the region of the *unshifted*
point, falling back to `offset`. Storage rule (D7 in the PRD): `offset` = region preview,
`region_offsets` = wide-angle/full-area preview, nine equal values = "single" mode. The table also carries
`blend?: boolean` (absent = true, D8): fluxghost ramps the offsets across a band one third of a region wide
at each border instead of stepping, exact over the middle two thirds of each region — so iterate the table
with `REGIONS`, never `Object.values`. fluxghost 2.5.6 drops both keys silently, so saving against an old
backend is harmless; 2.5.7 before fluxghost #125 ignores `blend` and steps.

## Storage

`loadJson`/`uploadJson` (`helpers/device/jsonDataHelper.ts`) read/write the device `fisheye` dir:
- **`fisheye_params.json`** — active saved params (written by `setFisheyeConfig`). Default source for `getCheckpointData`.
- **`checkpoint.json`** — intermediate snapshot (`saveCheckPoint` in `AdorCalibration/utils.ts`); the `allowCheckPoint` fallback. Lets a slow computation be reused next run.
- **`wide-angle.json`** — V4 wide-angle params (WideAngle reads via `getData`, writes via `uploadJson`).
- **Promark** is different: params live in **localStorage** `promark-store` via `promarkDataStore.get/set(serial, 'cameraParameters')`, NOT on the device.
  The type is `PromarkCameraParameters` (`interfaces/Promark.d.ts`) = V3 + optional `rotate180`, see below.

`cameraCalibrationApi.updateData(data)` uploads params to the calibration backend (image remap);
`setFisheyeConfig(param, { clearPnc })` (`camera-calibration-helper`) writes the final `fisheye_params.json`.
`setFisheyeConfig` and `sendPictureThenSetConfig` (legacy `camera_offset`) clear the Print and Cut offset
(`camera_calib/pnc.json`) by default because a recalibration invalidates it; Manual Configuration passes
`{ clearPnc: false }` and clears it itself only when the user applies the Print and Cut toggle.

**Legacy `camera_offset`** (beamo / Beambox / HEXA, `BeamPreviewManager`): device setting string
`X Y R F SX SY` (`camera_offset`, `camera_offset_borderless` for open-lid). Firmware defaults to
`X0 Y0 R0 F1 S1 SX1 SY1` when no file exists and merges partial sets; `BeamPreviewManager` treats
`0,0` as "uncalibrated" and falls back to ideal `20/30/1.625`. X/Y are the camera position, so +X/+Y
move the preview right/down — the opposite sign of the fisheye `offset`.

## Entry point & modes

`calibrateCamera(device, opts)` (`camera/index.tsx`, also `eventEmitter.on('SHOW_CALIBRATE_CAMERA')`)
does `checkDeviceStatus` + `deviceMaster.select`, then routes by model to a `showXxx`:
`adorModels → showAdorCalibration` · `modelsWithWideAngleCamera → showWideAngleCameraCalibration`
(if `isWideAngle`) `/ showLaserHeadFisheyeCalibration` · `promarkModels → showPromarkCalibration`
· `fbm2 → showBeamo2Calibration` · else `showCameraCalibration` (legacy).

Modes (flags on the `showXxx`/component):
- **advanced** (`isAdvanced`) — full calibration from scratch: capture pattern (ChArUco/chessboard) → intrinsics, then engrave + SolvePnP for extrinsics.
- **basic** (default) — reuse existing params: load → upload → straight to put-paper/solve-PnP.
- **factory** (`factoryMode`, Ador only) — chessboard calibration with an optional skip-to-reuse button.

### Data-fetch-before-dialog architecture

The old in-dialog "CheckpointData" step was removed. Each `showXxx` now **fetches the params
up front** (before `addDialogComponent`) and passes them in as the **`currentData`** prop. Shared
helpers in `common/checkpointData.ts`:
- **`getCheckpointData({ allowCheckPoint, getData })`** → loads (`getData` or `fisheye_params.json`),
  normalizes V2/V3/V4, optional `checkpoint.json` fallback. Returns `{ data, isCheckPointData } | null`.
  Shows a **non-blocking `MessageCaller` LOADING toast** during the fetch.
- **`applyCheckpointData(data)`** → uploads to device (`cameraCalibrationApi.updateData`) under a
  **blocking** `progressCaller` progress. Callers seed their own ref via `updateParam` afterward.

No-data handling:
- LaserHead / Beamo2 basic mode, no params → alert (`#851 unable_to_load_camera_parameters`) with
  a **Cancel + "Calibrate Camera (Advanced)"** button that **self-calls** the show fn with `isAdvanced: true`. Dialog doesn't open.
- Ador basic mode, no params → `calibrateFromDevicePictures()` (`AdorCalibration/utils.ts`): if factory
  raw photos exist on the device (`ls camera_calib`), calibrate from them + `saveCheckPoint`, return param;
  else `#852 no_picture_found` alert (which uses `showCalibrateCamera`, not a self-call, to avoid a
  circular import). The param then opens the dialog at put-paper like stored data would.

## Per-dialog flows

**LaserHeadFisheyeCalibration** (V3, `fbb2`/`fhx2rf`): `[advanced]` PRE_CHESSBOARD → CHESSBOARD(ChArUco)
→ PUT_PAPER · `[basic]` starts at PUT_PAPER with `currentData` seeded → SOLVE_PNP_INSTRUCTION → SOLVE_PNP
→ CHECK_PNP → `setFisheyeConfig`. `dh=0`.

**Beamo2Calibration** (V4, `fbm2`): same advanced/basic split; CHESSBOARD → PUT_PAPER → 4× SOLVE_PNP
(TL/TR/BL/BR) → SOLVE_OTHER_PNP → CHECK_PNP. Polyfits faked from a single height.

**WideAngleCamera** (V4, cam #2): always opens at PREPARE_MATERIALS; **Skip button** there (when
`currentData`) jumps to PUT_PAPER. Two heights (focus + lowered 40mm via `moveZRel`), each: 4× SolvePnP
+ SOLVE_OTHER_PNP + CHECK_PNP → SOLVE_EXTRINSIC_REGRESSION → `uploadJson(wide-angle.json)`.

**AdorCalibration** (V2, `ado1`): initial step = advanced→PREPARE_CALIBRATION, factory→CALIBRATE, basic→PUT_PAPER.
- advanced → ChArUco (sets `d,k,rvec,tvec`); its `onNext` **also seeds `levelingData`(zeros)/`refHeight:0`/`source:'device'`** (matching CalibrateChessBoard, since ChArUco alone leaves them unset).
- factory → `CalibrateChessBoard` (sets those same fields); `onSkip` (when `currentData`) applies + jumps to PUT_PAPER.
- then PUT_PAPER → SOLVE_PNP_1 (@dh1) → ELEVATED_CUT → SOLVE_PNP_2 (@dh2) → `extrinsicRegression` → `setFisheyeConfig`.

**PromarkCalibration** (V3, `fpm1`): params from localStorage (`promarkDataStore`), passed as `currentData`.
Starts at PRE_CHESSBOARD with a **Skip** button (when `currentData`) → PUT_PAPER. CALIBRATION(`Calibration`)
→ PUT_PAPER → SOLVE_PNP → CHECK_PNP → `promarkDataStore.set`. Has a `with/without_promark_safe_plus` toggle
and supports an embedded `renderWrapper` (used by `InitializeMachine/Promark/InitCameraCalibration`).
PUT_PAPER engraves `assets/fcode/promark-calibration-<width>.bvg` via `loadCameraCalibrationTask(model, width)`
(`helpers/device/promark/calibration.ts`; widths 70/110/150/200/220, each with matching
`promarkPnPPoints[width]` in `fisheyeCameraConstants.ts` for SolvePnP). A UV source engraves at its weakest
output: `frequency = UV_FREQUENCY_LIMIT.max`, `power = UV_POWER_LIMIT.min` (`helpers/layer/uvPowerFrequency.ts`).

### Promark camera rotation (`rotate180`)

Desktop/MOPA Promark webcams are mounted upside down, UV ones are not, and the laser source the user
picked is not reliable enough to decide it. So the 180° rotation is a calibration choice stored **with
the camera parameters** — d/k/rvec/tvec are computed on frames in that orientation, so the flag must
never change without recalibrating.

- `helpers/device/promark/camera-rotation.ts`: `isCameraRotated(params)` = `params.rotate180 ?? true`
  (parameters saved before the flag existed are old machines → rotate); `getInitialCameraRotation(serial)`
  = stored choice when calibrated, else `laserType !== UV`. No migration rewrites storage; never backfill
  the flag from the laser source.
- `PromarkCalibration`: `rotate180` state from `getInitialCameraRotation`; the checkbox
  (`calibration.rotate_image_180`) sits in the CALIBRATION step via `Calibration`'s `extra` slot; Skip
  resets it to `isCameraRotated(currentData)` (it reuses the old intrinsics); CHECK_PNP saves it in params.
- `WebCamConnection.getPicture({ rotate180 })` — the argument is required. `useCamera` `Options` is a
  `CameraSource` union: `{ source: 'usb'; rotate180: boolean }` or wifi without it; `SolvePnP` takes
  `cameraSource`, `Calibration`/`CheckPnP` take `cameraOptions`. The live `<video>` gets the
  `.rotate180` class in `Calibration.tsx` (no hard-coded CSS rotation).
- `PromarkPreviewManager.preview` rotates by `isCameraRotated(fisheyeParams)`. `check-camera.ts` passes
  `false` (only the picture size matters).

## Manual Configuration (`ManualConfiguration/`)

"手動輸入" at the bottom of the Calibration menu (`menuDeviceActions.tsx` → `showManualConfiguration`):
edit stored values directly, no engraving. Tabs: Camera, Modules (bm2/ado1/fuv1 module offsets), Print
and Cut (view/edit/clear the pnc offset). Zustand `store.ts` holds the per-tab saver (one footer Save)
and the shared pnc value, so a Print and Cut save updates the Camera tab's toggle immediately.

Camera tab per model: legacy → `LegacyCameraBlock` (X, Y, R in degrees, SX, SY; F flip on the normal row only, `connectCamera` never reads the open-lid F; normal +
open-lid rows; any value saves, no range guard); fisheye → `FisheyeOffsetBlock` per params file via
`createParamsSource` (`offsetParams.ts`: load once, merge patches, write the whole file). fbm2 /
fhx2rf / fbb2 show two blocks — "局部預覽偏移" (`offset`) and "廣角預覽偏移" (`region_offsets`, single
or per-region `RegionOffsetGrid` with the "Blend between regions" switch above it); fbb2 probes `getWideAngleCameraData` first, fbm2 and fhx2rf always
show it. A single block is titled "預覽偏移" (ado1, Promark via `promarkDataStore`). UI caps the offset
at ±5 mm. The Print and Cut toggle on the region block disables the inputs, shows stored + pnc, and
on Save writes that sum and clears pnc.

## Shared step components (`common/`)

- **`ChArUco`** — capture ChArUco board at N positions → `updateParam({ d, k, rvec, tvec, ret, is_fisheye })`.
- **`Calibration`** — chessboard/charuco capture wrapper (Promark); `extra` renders below the exposure slider.
- **`SolvePnP`** — drag marker points → `onNext(rvec, tvec, point)`. `defaultPoints` (per model/region,
  hard-coded image points for a typical placement) feeds the dev-only Reset Points button and, with
  `initPoseWithDefaultPoints` (callers pass `isAdvanced`), seeds `rvec`/`tvec` via `solve_pnp_calculate`
  before the **first** step's find-corners — after ChArUco the stored pose is the hand-held board's, so
  corner detection would otherwise project from a random pose. Later steps reuse the previous step's solve.
- **`CheckPnP`** — overlay a grid using the params to verify alignment.
- **`Instruction`** — video + steps + `buttons: Array<{label,onClick,type?}>` (+ optional `renderWrapper`).
- **`ProcessingDialog`** — runs a `process()` with progress, then `onNext`.
- **`AdorCalibration/CalibrateChessBoard`** — chessboard intrinsics; optional `onSkip` prop renders a Skip button.

## Key files

- `camera/index.tsx` — `calibrateCamera` + `showLaserHeadFisheyeCalibration` / `showWideAngleCameraCalibration` / `showPromarkCalibration`
- `common/checkpointData.ts` — `getCheckpointData`, `applyCheckpointData`
- `AdorCalibration/{index,AdorCalibration,CalibrateChessBoard,utils}.tsx` (`utils.ts`: `calibrateWithDevicePictures`, `calibrateFromDevicePictures`, `saveCheckPoint`, `getMaterialHeight`)
- `beamo2Calibration/{index,Beamo2Calibration}.tsx`, `WideAngleCamera/index.tsx`, `PromarkCalibration.tsx`
- `ManualConfiguration/{ManualConfiguration,CameraTab,FisheyeOffsetBlock,RegionOffsetGrid,LegacyCameraBlock,ModulesTab,PrintAndCutTab}.tsx`, `store.ts`, `offsetParams.ts` — PRD `docs/prd/manual-calibration-config.md`
- `interfaces/FisheyePreview.d.ts`, `helpers/api/camera-calibration.ts`, `helpers/device/jsonDataHelper.ts`, `helpers/device/promark/promark-data-store.ts`, `helpers/device/promark/camera-rotation.ts`, `helpers/webcam-helper.ts`

## Maintenance

Update this doc when the Promark rotation rule changes, or when: a parameter version changes (new `Vn`), the storage files/keys change, the
data-fetch-before-dialog pattern or the `getCheckpointData`/`applyCheckpointData`/`calibrateFromDevicePictures`
helpers change, a machine family's step flow/modes change, or the manual `offset` / `region_offsets`
contract (storage rule, sign, fluxghost fallback) or the `clearPnc` rule changes.
