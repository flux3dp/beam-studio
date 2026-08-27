---
name: camera-preview
description: Camera preview system — PreviewModeController, per-model preview managers, preview modes (REGION/FULL_AREA/PRECISE_REGION), the cameraPreview store, and per-camera exposure. Use when working on preview managers under actions/camera/preview-helper/, preview-mode-controller, PreviewSlider/PreviewFloatingBar, or camera exposure helpers.
---

# Camera Preview

Controller: `packages/core/src/web/app/actions/beambox/preview-mode-controller.ts` (singleton)
Managers: `packages/core/src/web/app/actions/camera/preview-helper/*PreviewManager.ts`
Interface: `packages/core/src/web/interfaces/PreviewManager.d.ts`
Store: `packages/core/src/web/app/stores/cameraPreview.ts`
Entry/mode helpers: `packages/core/src/web/helpers/device/camera/previewMode.ts`
Exposure: `packages/core/src/web/helpers/device/camera/cameraExposure.ts`
UI: `components/beambox/SvgEditor/PreviewFloatingBar.tsx` (mode buttons), `PreviewSlider.tsx` (exposure)
Region indicator: `packages/core/src/web/app/actions/canvas/preview-region-indicator.ts`

## Overview

Camera preview draws machine photos onto the canvas background
(`preview-mode-background-drawer`). Flow: toolbar click → `handlePreviewClick` →
`setupPreviewMode` (`previewMode.ts`) → `PreviewModeController.start(device)` → picks a
manager by model → `manager.setup()` → writes `previewMode`/`supportedPreviewModes`/
`previewCameraIndex` to the store → emits canvas `UPDATE_CONTEXT`. The controller is a thin
dispatcher; all machine/camera specifics live in the managers.

## Preview modes

`PreviewMode` (const enum, `app/constants/cameraConstants.ts`): `REGION = 1`,
`FULL_AREA = 2`, `PRECISE_REGION = 3`.

`getSupportedPreviewModes(device, { hasWideAngleCamera, isCameraOblique })`:
- `REGION` — always
- `FULL_AREA` — wide-angle camera present, or `fbm2`
- `PRECISE_REGION` — oblique camera: `fhx2rf` always; `fbb2` when firmware meets
  `BB2_CAMERA_INSTALLATION` and device setting `camera_installation === '1'`
  (`checkCameraOblique`)

## Managers by model

All extend `BasePreviewManager` (message helpers, movement speed caps, `_previewMode`,
`previewRegionFromPoints` serpentine capture); region-capable ones mix in
`RegionPreviewMixin` (grid-based `regionPreviewAtPoint`/`regionPreviewArea`).

| Manager | Models | Modes | Cameras |
|---|---|---|---|
| `BeamPreviewManager` | legacy Beam Series (default) | REGION | offset laser-head camera |
| `AdorPreviewManager` | `ado1` | FULL_AREA | fixed door camera |
| `PromarkPreviewManager` | promark | FULL_AREA | fixed camera |
| `Beamo2PreviewManager` | `fbm2` | REGION, FULL_AREA | **one** camera; FULL_AREA moves head to `workarea.cameraCenter` and swaps perspective grid |
| `Bb2Hx2PreviewManager` | `fbb2`, `fhx2rf` | REGION (+PRECISE_REGION if oblique), FULL_AREA if wide-angle calibrated | **two** cameras: laser-head `setCamera(0)` in raw mode for region modes; wide-angle `setCamera(1)` for FULL_AREA |

Bb2Hx2 notes: FULL_AREA requires wide-angle calibration data (`getWideAngleCameraData`,
V4 params) and the door open (`getDoorOpen`); region modes home + raw mode + line check.
REGION ↔ PRECISE_REGION only swaps the fisheye perspective grid on the same camera
(`bb2PerspectiveGridWide` vs `bb2PerspectiveGrid`); crossing the FULL_AREA boundary tears
down / sets up the other camera.

Beamo2 FULL_AREA capture manages exposure itself: shoots a light image at
`originalExposure + 500` and a dark image at original, sets the dark one as mask image
(`setMaskImage`), restoring auto-exposure afterwards.

## cameraPreview store

Zustand + `subscribeWithSelector`. Fields: `isPreviewMode`, `isStarting`, `isDrawing`,
`isLiveMode`, `isClean`, `bgOpacity`, `previewMode`, `supportedPreviewModes`,
`pendingPreviewMode`, `previewCameraIndex`. Write from outside React via
`setCameraPreviewState`.

- `pendingPreviewMode` — mode chosen from the floating bar before preview finished
  starting; `setupPreviewMode` applies it via `switchPreviewMode` after `start()` and
  clears it. A store subscription drops it (or coerces `previewMode`) when
  `supportedPreviewModes` changes to exclude it.
- `previewCameraIndex` — physical camera used by the current mode, mirrored from the
  manager's optional `currentCameraIndex` (see Exposure below). `undefined` for
  single-camera managers.

## Capture messages

`previewRegionFromPoints` (batch) shows a `capturing_image i/n` counter and passes
`silent: true` down to each per-point `preview()` call. Single-shot region captures
(`RegionPreviewMixin.regionPreviewAtPoint`, `BeamPreviewManager.preview`) show
`capturing_image` + `succeeded` themselves unless `silent` is set. All messages share the
manager's `progressId` as Ant Design message key, so they replace each other — a
non-silent per-point message would stomp the batch counter.

## Preview region indicator

`preview-region-indicator.ts` draws a dashed rect (`#previewRegionIndicator` in
`#fixedSizeSvg`, canvas px) showing the single-shot capture footprint while hovering in
`preview`/`pre_preview` mouse modes with mode REGION/PRECISE_REGION. Called from
`mouse/index.ts` mouseMove (`!started` block); hidden on drag start and, via the
`mouseMode.ts` store subscription, when the mouse mode leaves preview.

- Cached `config` = footprint size + clamp bounds for the capture **center**.
  Recomputed only by subscriptions: cameraPreview store
  `[previewMode, pendingPreviewMode, isPreviewMode, supportedPreviewModes]`
  (`supportedPreviewModes` is what fires on pre-preview entry; `isPreviewMode` swaps
  ideal → live calibration) and canvas `canvas-change` (workarea/model switch).
  Mouse move only clamps and moves the rect.
- Grid models (`fbb2`/`fhx2rf`/`fbm2`): size from `getRegionPreviewGrid`
  (`fisheyeCameraConstants.ts` — **mirrors** `RegionPreviewMixin`'s constructor and
  `Bb2Hx2PreviewManager.switchPreviewMode` grid choice; keep in sync); footprint clamped
  inside workarea ⇔ center ≥ half-footprint from edges.
- Legacy Beam: square of side `imgHeight × scaleRatioY / (cos θ + sin θ)`; center clamped
  like `constrainPreviewXY` (footprint may overhang edges). Live `getCameraOffset()` when
  previewing, ideal camera constants in pre-preview.
- Model source: `previewModeController.currentDevice` when `isPreviewMode`, else
  `workareaManager.model`. `ado1`/promark (full-area only) show no indicator.

## Stale supportedPreviewModes

`supportedPreviewModes` is a snapshot of async device checks taken in
`handlePreviewClick` (`previewMode.ts`), so it can go stale if the selected device
changes while waiting in `pre_preview`. `SelectMachineButton.handleClick` handles
device changes (uuid compared against the previous selection): during active preview
it ends the session; during `pre_preview` it drops the mouse mode back to `select`,
closing the floating bar so the next preview click recomputes everything fresh.

## Mode switching

`PreviewFloatingBar` buttons → `previewModeController.switchPreviewMode(mode)` → awaits
`manager.switchPreviewMode(mode)` (returns the mode actually reached — may be the old one
on refusal, e.g. door closed / not calibrated) → **then** writes
`{ previewCameraIndex, previewMode }` to the store. Because the store updates only after
the switch fully completes, store subscribers may safely talk to the camera when these
change — don't move these writes earlier.

## Per-camera exposure

`cameraExposure.ts`: in raw mode with `CAMERA_SOCKET_EXPOSURE` firmware, exposure
read/write goes through the camera socket (`getCameraExposure`/`setCameraExposure`);
otherwise through the control socket device setting `camera_exposure_absolute`. Either
way it targets the **currently selected physical camera**, and each camera keeps its own
value.

`PreviewSlider` therefore refetches settings on `[isPreviewMode, previewCameraIndex]`:
a mode switch that changes the physical camera (Bb2Hx2 region ↔ full-area) refetches;
same-camera switches (REGION ↔ PRECISE_REGION, all fbm2 switches) don't.

**Contract**: a manager must define `currentCameraIndex` (getter) iff different preview
modes use different physical cameras — Bb2Hx2 returns `1` for FULL_AREA, else `0`.
Leaving it undefined means "one camera" and suppresses exposure refetch on mode switch.

fbb2 firmware gates in `PreviewSlider.getSetting`: `BB2_SEPARATE_EXPOSURE` (exposure
fetch), `BB2_AUTO_EXPOSURE` (auto-exposure toggle; models listed in
`supportCameraAutoExposureModels`). The auto toggle is hidden for fbm2 in FULL_AREA
because its capture flow sets exposure itself.

## Ending preview

`endPreviewMode` (`previewMode.ts`) → `controller.end()`: clears background drawer
boundary, restores device close listener, `manager.end()` (managers restore raw-mode
state, loose motor, disconnect camera), then `reset()` which clears the store
(`previewMode: REGION`, `previewCameraIndex: undefined`, `pendingPreviewMode: undefined`).
