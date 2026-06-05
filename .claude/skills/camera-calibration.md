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

## Storage

`loadJson`/`uploadJson` (`helpers/device/jsonDataHelper.ts`) read/write the device `fisheye` dir:
- **`fisheye_params.json`** — active saved params (written by `setFisheyeConfig`). Default source for `getCheckpointData`.
- **`checkpoint.json`** — intermediate snapshot (`saveCheckPoint` in `AdorCalibration/utils.ts`); the `allowCheckPoint` fallback. Lets a slow computation be reused next run.
- **`wide-angle.json`** — V4 wide-angle params (WideAngle reads via `getData`, writes via `uploadJson`).
- **Promark** is different: params live in **localStorage** `promark-store` via `promarkDataStore.get/set(serial, 'cameraParameters')` (V3), NOT on the device.

`cameraCalibrationApi.updateData(data)` uploads params to the calibration backend (image remap);
`setFisheyeConfig(param)` (`camera-calibration-helper`) writes the final `fisheye_params.json`.

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

## Shared step components (`common/`)

- **`ChArUco`** — capture ChArUco board at N positions → `updateParam({ d, k, rvec, tvec, ret, is_fisheye })`.
- **`Calibration`** — chessboard/charuco capture wrapper (Promark).
- **`SolvePnP`** — drag marker points → `onNext(rvec, tvec, point)`.
- **`CheckPnP`** — overlay a grid using the params to verify alignment.
- **`Instruction`** — video + steps + `buttons: Array<{label,onClick,type?}>` (+ optional `renderWrapper`).
- **`ProcessingDialog`** — runs a `process()` with progress, then `onNext`.
- **`AdorCalibration/CalibrateChessBoard`** — chessboard intrinsics; optional `onSkip` prop renders a Skip button.

## Key files

- `camera/index.tsx` — `calibrateCamera` + `showLaserHeadFisheyeCalibration` / `showWideAngleCameraCalibration` / `showPromarkCalibration`
- `common/checkpointData.ts` — `getCheckpointData`, `applyCheckpointData`
- `AdorCalibration/{index,AdorCalibration,CalibrateChessBoard,utils}.tsx` (`utils.ts`: `calibrateWithDevicePictures`, `calibrateFromDevicePictures`, `saveCheckPoint`, `getMaterialHeight`)
- `beamo2Calibration/{index,Beamo2Calibration}.tsx`, `WideAngleCamera/index.tsx`, `PromarkCalibration.tsx`
- `interfaces/FisheyePreview.d.ts`, `helpers/api/camera-calibration.ts`, `helpers/device/jsonDataHelper.ts`, `helpers/device/promark/promark-data-store.ts`

## Maintenance

Update this doc when: a parameter version changes (new `Vn`), the storage files/keys change, the
data-fetch-before-dialog pattern or the `getCheckpointData`/`applyCheckpointData`/`calibrateFromDevicePictures`
helpers change, or a machine family's step flow/modes change.
