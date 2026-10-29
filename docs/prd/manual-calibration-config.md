# PRD: Manual Calibration Configuration

| | |
|---|---|
| **Status** | Draft — design and D1–D6 settled 2026-10-28, no code yet |
| **Author** | Product + Beam Studio team |
| **Created** | 2026-10-28 |
| **Target product** | Beam Studio (desktop + web), fluxghost (next release after 2.5.6) |
| **Owner area** | Calibration menu, camera preview (fisheye remap), module offsets, Print and Cut offset |
| **Related code** | Menus: `packages/core/src/web/app/components/beambox/TopBar/useMenuData.ts`, `apps/app/src/node/menu-manager.ts`, `packages/core/src/web/app/actions/beambox/menuDeviceActions.tsx`; camera params: `packages/core/src/web/interfaces/FisheyePreview.d.ts`, `packages/core/src/web/helpers/camera-calibration-helper.ts` (`setFisheyeConfig`, `doSetConfigTask`), `packages/core/src/web/helpers/device/jsonDataHelper.ts`, `packages/core/src/web/helpers/device/promark/promark-data-store.ts`; preview: `packages/core/src/web/app/actions/camera/preview-helper/Beamo2PreviewManager.ts`, `FisheyePreviewManagerV4.ts`, `BeamPreviewManager.ts`; module offsets: `packages/core/src/web/helpers/device/moduleOffsets.ts`, `packages/core/src/web/app/components/dialogs/camera/ModuleCalibration/OffsetSettings.tsx`; Print and Cut offset: `packages/core/src/web/app/components/dialogs/PrintAndCut/calibration/offsetStore.ts`, `PrintAndCut/utils/align/alignByCamera.ts` |
| **External repos** | fluxghost (`fluxghost/api/fisheye_camera_mixin.py`, `fluxghost/utils/camera/perspective.py`, `docs/api/camera.md`, `tools/ws_smoke.py`) |
| **Translation** | [manual-calibration-config.zh-tw.md](manual-calibration-config.zh-tw.md) |

---

## 1. Summary

Every calibration in Beam Studio today runs a flow: engrave a pattern, photograph it, solve. There is no
way to nudge a result by hand. Support cases that need a 0.5 mm correction have to redo the whole
calibration, and some values (module offsets, the Print and Cut offset) can only be reached from inside
their flows.

This feature adds **Manual Configuration** as the last item of the Calibration submenu. It opens one
modal with a tab per parameter family that is safe to edit by hand: **Camera**, **Modules**, **Print and
Cut**. Nothing in it fires the laser or moves the head.

For cameras the raw fisheye intrinsics and extrinsics (`k`, `d`, `rvec`, `tvec`) are not human-editable,
so the Camera tab exposes a **manual offset in mm** instead. The offset is stored as a new field inside
the saved camera parameters and applied by **fluxghost** when it projects the perspective grid, so the
remapped image stays centred on the preview point and no px conversion happens in Beam Studio. Full-area
preview on fbm2 / fbb2 / fhx2rf can use one offset for the whole bed or **nine per-region offsets**,
mirroring the nine `WideAngleRegion` extrinsics those parameters already carry. Legacy pinhole cameras
(beamo, Beambox, HEXA) edit their existing `X`/`Y` directly because those already are a pure translation.

## 2. Background & current state

### 2.1 Calibration menu

Both menus build the Calibration submenu per device model: `useMenuData.ts:100-201` (web) and
`menu-manager.ts:126-191` (Electron). Items map to `menuDeviceActions.tsx` handlers by id. The last item
today is `CALIBRATE_PRINT_AND_CUT`.

### 2.2 Camera parameters

| Camera | Params | Where | Written by |
|---|---|---|---|
| ado1 | V2 | device `fisheye/fisheye_params.json` | `setFisheyeConfig` |
| fbb2, fhx2rf laser-head cam | V3 | `fisheye/fisheye_params.json` | `setFisheyeConfig` |
| fbb2, fhx2rf wide-angle cam | V4 | `fisheye/wide-angle.json` | `uploadJson` (WideAngleCamera dialog) |
| fbm2 (one camera, both modes) | V4 | `fisheye/fisheye_params.json` | `setFisheyeConfig` |
| fpm1 (Promark) | V3 + `rotate180` | localStorage `promark-store` by serial | `promarkDataStore.set` |
| beamo, Beambox, HEXA | `X Y R SX SY` text | device setting `camera_offset` (+ `camera_offset_borderless` on open-bottom models) | `doSetConfigTask` |

`setFisheyeConfig` and `doSetConfigTask` both call `clearPncOffset` afterwards (`camera-calibration-helper.ts:137,179`):
the Print and Cut offset is only valid for the calibration it was measured against.

### 2.3 How the fisheye image is remapped

Beam Studio never touches pixels. It sends the params (`set_fisheye_matrix`) and a **perspective grid in
mm** — `set_fisheye_grid {x:[start,end,step], y:[...]}` for V3, `grids` inside the params for V4 — and
fluxghost's `FisheyeCameraMixin` projects each grid point through `rvec`/`tvec`/`k`/`d` to a source pixel
(`fisheye_camera_mixin.py:187-274`). The returned image covers exactly the grid extent at 5 px/mm, and the
preview manager pastes it centred on the preview point (`RegionPreviewMixin.ts:148-156`,
`drawFullWorkarea`).

- V3 (`set_fisheye_grid`): one `rvec`/`tvec` for the whole grid.
- V4 (`set_fisheye_height` → `calculate_regional_perspective_points`, `perspective.py:45-85`): each grid
  point picks one of nine regions by its position inside `total_width × total_height` and is projected
  with that region's polyfitted `rvec`/`tvec`.
- V2 (`set_fisheye_height`): fluxghost builds the grid itself from `HW_PROFILE[model]`; no client grid.
- Promark goes through the same mixin over the `camera-transform` websocket (`PromarkPreviewManager.ts:63-79`).

`set_fisheye_matrix` reads its keys explicitly (`data['k']`, `data.get('total_width')`, …), so unknown
keys are ignored by current releases.

fbm2 sends the **same V4 params in both modes**: `Beamo2PreviewManager.switchPreviewMode` only swaps the
grid (region grid shifted to `cameraCenter`, or the full-area grid) via `FisheyePreviewManagerV4.updateGrid`
(`Beamo2PreviewManager.ts:300-340`). fluxghost cannot tell the modes apart.

### 2.4 Legacy pinhole cameras

`BeamPreviewManager` uses `X`/`Y` only to position the head: `getPhotoAfterMove` moves to
`canvas/dpmm − (X, Y)` and pastes the photo centred on the canvas point (`BeamPreviewManager.ts:223-227,
306-311`). `R`/`SX`/`SY` only rotate and scale the photo about its own centre in `preprocessImage`. So
`X`/`Y` are a pure translation in machine mm, independent of the other three. Two side effects:
`X = Y = 0` makes the manager fall back to the ideal constants (`:177-185`), and `constrainPreviewXY`
clamps the previewable area to `≥ (X, Y)`.

### 2.5 Module offsets

`moduleOffsets.ts`: fbm2 and fuv1 store offsets on the device (`toolhead_shift` setting); other models in
the `module-offsets` global preference. `OffsetSettings.tsx` already edits one module's offset
**relative to its default** through `getModuleOffsets` / `updateModuleOffsets` with `isRelative: true`; it
is only reachable from the end of a module calibration.

### 2.6 Print and Cut offset

`offsetStore.ts`: `PncOffset {x, y}` mm = where the laser landed relative to the print, right/down
positive. Stored on the machine (`camera_calib/pnc.json`) or locally by serial. `alignByCamera` fetches it
and applies the negation after the fit (`correctByCalibration`); the calibration dialog measures with
`applyCalibration: false`. "精準對位" in the UI is Print and Cut.

## 3. Goals & non-goals

**Goals**

- One menu entry, one modal, tabs per parameter family, no laser or motion.
- Camera: mm offset for every fisheye model, per-region option for full-area V4 preview, direct `X`/`Y`
  edit for legacy cameras.
- Modules: every supported module of the selected device on one tab.
- Print and Cut: view, edit, clear the offset; import it into the camera offset.
- Values survive the paths they already travel: import/export calibration data, recalibration resets.

**Non-goals**

- Editing `k`, `d`, `rvec`, `tvec`, polyfits, leveling data or `rotate180` (dialogs with pictures exist
  for these; the user asked to leave them out).
- Live re-preview from the modal. Changes take effect on the next preview session (§10 D4).
- Deprecated V1 Ador parameters.
- Rotating or scaling corrections for fisheye cameras. Offset is translation only.

## 4. Scenarios

1. **S1 Nudge region preview** — beamo II owner sees cuts land 0.6 mm right of the previewed object.
   Opens Manual Configuration → Camera, sets region offset X = 0.6, saves, previews again: aligned.
2. **S2 Full-area per region** — Beambox II wide-angle preview is good in the centre, 1 mm off at the
   corners. Switches the full-area block to "per region", edits the four corners, saves.
3. **S3 Legacy camera** — beamo preview is 1 mm high. Camera tab shows `X`, `Y`; user changes `Y`.
4. **S4 Module offset without a print** — fbm2 4C printer is 0.3 mm left of the laser. Modules tab, edit
   PRINTER_4C X, save. Boundary overlay updates.
5. **S5 Print and Cut** — support reads a customer's pnc values, or clears a bad one. Print and Cut tab.
6. **S6 Import Print and Cut into camera** — the vernier measured (0.4, −0.2). User presses "Import
   from Print and Cut" on the Camera tab: region offset becomes (0.4, −0.2), pnc.json is cleared, Print
   and Cut alignment is now corrected through the preview itself.
7. **S7 Old backend** — web app against fluxghost 2.5.6: the offset saves normally but has no visible effect
   until the backend is updated (D1: no gate).

## 5. Acceptance criteria

**Menu**
- Every device submenu's Calibration list ends with "Manual Configuration" (`menu.manual_configuration`),
  both web and Electron, all models. Enabled on mobile (no laser or motion involved), unlike the other
  calibration items.
- Click: `checkDeviceStatus` + `deviceMaster.select`, then the modal. Refused with the usual alert if the
  device is busy. The modal may open during a preview session; saved values apply from the next preview
  session, because `previewModeController.start` creates a new manager that refetches the params (D4).

**Modal**
- `DraggableModal`, title "Manual Configuration", antd `Tabs`. Tabs shown per model:

| Model | Camera | Modules | Print and Cut |
|---|---|---|---|
| fbm2 | one "Camera offset" (region preview, and full-area unless per-region) + radio "full-area: same as region / per region" with the 3×3 table | yes | yes |
| fbb2, fhx2rf | "Region preview offset" (laser-head cam) + "Full-area preview offset" (wide-angle cam) with radio "one offset / per region"; the full-area block only when `wide-angle.json` exists | no | yes |
| ado1 | single offset | yes | yes |
| fpm1 | single offset | no | yes |
| beamo, Beambox, HEXA | `X`, `Y` only (`R`, `SX`, `SY` not shown); second row for `camera_offset_borderless` on open-bottom models | no | yes |
| fuv1 | none | yes | yes |

- Each tab has its own Save. Save writes only that tab's store and shows the standard saving progress;
  failure shows an error alert and keeps the modal open. Cancel/close discards unsaved edits.
- Inputs are `UnitInput` in mm (inch when the document unit is inch, same precision rule as
  `OffsetSettings.tsx:35-41`), step 0.1. Camera offsets are limited to **±5 mm**: a larger residual means
  the calibration itself is off, and shifting the sampled area further risks leaving the photo; the input
  caps at 5 and a hint says to recalibrate. Module and Print and Cut fields keep their existing ranges.

**Camera tab, fisheye**
- On open: loads the current params from the row's store (§2.2) and shows the stored offset, or 0, 0.
  Missing params → the block says "calibrate the camera first" and is disabled (same message as
  `calibrate_camera_before_calibrate_modules`).
- Save writes the params back with `offset` (and `region_offsets` when per-region) through the same
  writer the calibration used (`setFisheyeConfig`, `uploadJson('fisheye','wide-angle.json')`,
  `promarkDataStore.set`). All other fields byte-for-byte unchanged apart from number rounding already
  applied by `setFisheyeConfig`. Saving clears pnc.json (existing rule, via `setFisheyeConfig`; the
  wide-angle and Promark writers call `clearPncOffset` explicitly).
- **Sign**: offset = where the laser landed relative to the object seen in the preview, right/down
  positive (same convention as `PncOffset`). After saving X = +1, the next preview shows the object 1 mm
  further right on the canvas than before. Verified on hardware once per camera family (§12).
- The wide-angle block (fbm2, and bb2 / hx2 when `wide-angle.json` exists) edits `region_offsets` with a
  Segmented "One offset / Per region". One offset writes the same pair into all nine regions; a stored
  table whose nine pairs are equal loads as one offset. Switching to per region prefills the nine cells
  (3×3 like the bed, topLeft … bottomRight) with the single value. The region block edits `offset`; the
  two are independent values (D7) and share one Save.
- "Apply the Print and Cut offset" toggle on the region block, shown when `fetchPncOffset(serial)` has a
  value, with the value beside it. On: unsaved edits are dropped, the inputs lock and show **stored +
  pnc** (the vernier was read through a preview that already carried the stored offset, so pnc is a
  residual); off: back to the stored value. Saving clears pnc.json, so the toggle disappears.
- No backend gate (D1): the fields are always shown; the tab description notes that the offset needs the
  fluxghost release that ships §7.3.

**Camera tab, legacy**
- Loads `camera_offset` (and `camera_offset_borderless` when `getAddOnInfo(model).openBottom`) with the
  regexes `BeamPreviewManager` uses (`parseCameraOffset`). Shows only `X`, `Y` as absolute mm, **unbounded**:
  the stored value is no anchor either (a calibrated beamo reads X 8.9 / Y 37.9 against the 20 / 30 factory
  constants, and a bad calibration must be correctable); `R`, `SX`, `SY` are kept in memory for the
  write-back and never shown (D6). Both rows sit in one block with one Save.
- Save writes through `sendPictureThenSetConfig` → `doSetConfigTask` with the unchanged `R`/`SX`/`SY`, so
  the `S` vs `SX/SY` firmware split and the pnc.json clearing stay as they are. No value is rejected and no
  "calibrated" state is inferred: a never-calibrated machine answers the firmware default `X0 Y0 R0 SX1 SY1`
  (`fluxmonitor/storage.py:391`) and the row simply shows it; whatever is saved, `BeamPreviewManager` keeps
  treating `0, 0` as "use the ideal constants", and a machine in that state needs a calibration anyway.
- **Flip toggle** per row ("Flip image"), from the setting's `F:` flag (`parseCameraFlip`). Some old machines
  have the camera mounted the other way, and the firmware defaults `F` to 1 when the setting file was never
  written (`fluxmonitor/storage.py:391`), so their photos come out upside down. Saving a changed flip sends a
  partial `config set camera_offset F:0|1`: the firmware merges partial sets (`command_task.py:1105`,
  `storage.py:395`), so X/Y/R/S stay. It also clears pnc.json (the flip moves everything in the photo) and
  writes `deviceMaster.currentDevice.cameraNeedsFlip`, the once-per-connection cache `connectCamera` reads,
  so the next preview flips the new way without reconnecting.
- **Sign** (opposite to the fisheye offset, because `X`/`Y` are the camera position, not a correction):
  the head moves to `canvas − (X, Y)`, so a cut landing `e` to the right of the previewed object means
  `X` is too large by `e`: decrease `X` by `e`; below → decrease `Y`. Verified on hardware (§12 case 7).

**Modules tab**
- One row per module in `getWorkarea(model).supportedModules` excluding `LASER_UNIVERSAL`, each with
  X, Y relative to the model default (same semantics as `OffsetSettings`), loaded with `useCache: false`.
- Save calls `updateModuleOffsets` per changed row; the boundary overlay updates (`boundaryDrawer.update`
  already runs inside `updateModuleOffsetsInStore`; device-stored models get an explicit call).

**Print and Cut tab**
- Shows `fetchPncOffset(serial)` or empty. Save → `savePncOffset`; Clear → `clearPncOffset` and empties
  the fields. Values in mm, 3-decimal rounding as today.

**Edge cases**
- Device disconnects mid-edit: Save fails with the standard error alert; modal stays open.
- fbb2/fhx2rf without wide-angle data: no full-area block, no error.
- fbm2 region preview after saving a per-region table: unaffected, it uses the single `offset` (§7.2).
- Import/export calibration data (`backUpCalibrationData`) carries `offset`/`region_offsets` because it
  copies the json files verbatim. Importing a backup without the fields = offset 0.
- Recalibrating a camera rewrites its json without the fields = offset reset to 0. Intended.

## 6. Must not change

| Shared file / function | Caller — expected behaviour |
|---|---|
| `useMenuData.ts` `calibrationChildren`, `menu-manager.ts` calibration submenu | all device submenus — existing items, order and gating unchanged; one appended item |
| `menuDeviceActions.tsx` | menu click dispatch — existing handlers unchanged; one new key |
| `FisheyePreview.d.ts` V2/V3/V4 (+ `PromarkCameraParameters`) | every params reader — new fields optional, nothing required |
| `FisheyePreviewManagerV4.setupFisheyePreview` / `updateGrid` | `Beamo2PreviewManager`, `Bb2Hx2PreviewManager` wide-angle — same commands in the same order; only the params payload may omit `region_offsets` in fbm2 REGION mode |
| `Beamo2PreviewManager.switchPreviewMode` | PreviewFloatingBar → `previewModeController.switchPreviewMode` — grid choice, mask-image merge, head move unchanged |
| `camera-calibration-helper.ts` `setFisheyeConfig`, `doSetConfigTask` | calibration dialogs — unchanged; reused as writers |
| `offsetStore.ts` | `alignByCamera`, PnC calibration dialog — read/write/clear semantics unchanged |
| `moduleOffsets.ts` | ConfigPanel boundary, module calibration, export — unchanged; reused |
| `jsonDataHelper.ts` `FileMap` | unchanged (all needed files already listed) |
| `BeamPreviewManager.ts` camera_offset parsing | preview on legacy models — same regexes, moved to `helpers/device/camera/cameraOffset.ts` (`parseCameraOffset`); 0,0 fallback stays in the manager |
| `device-master.ts` `currentDevice.cameraNeedsFlip` | `connectCamera` — still read once per connection; the legacy block only overwrites the cached value after a saved `F` change |
| fluxghost `set_fisheye_matrix` | all clients — params without `offset` behave exactly as before (offset defaults to 0) |
| fluxghost `calculate_regional_perspective_points` | `set_fisheye_height` v4, `cmd_check_pnp`? — new optional kwargs default to no shift; CheckPnP keeps passing nothing (calibration runs without manual offset) |
| fluxghost `ws_smoke.py` | must still end `ALL PASS`; add a case with `offset` and one with `region_offsets` |

## 7. Design

### 7.1 Data model

```ts
// FisheyePreview.d.ts — added to V2, V3, V4 (PromarkCameraParameters inherits from V3)
offset?: [number, number];                                   // mm, machine frame, right/down positive
// V4 only
region_offsets?: Record<WideAngleRegion, [number, number]>;  // wide-angle preview, always all nine
```

Rules (D7): `offset` is the **region preview** offset (the whole preview on ado1 / Promark, which have no
region mode). `region_offsets` is the **wide-angle preview** offset and is always written complete: the
"one offset" mode stores the same pair nine times, and a uniform table loads as one offset, so there is
no mode flag. In fluxghost `region_offsets[region]` wins over `offset` per point, so the two never mix.

### 7.2 Where each value is used

| Preview | Params sent | Offset applied by fluxghost |
|---|---|---|
| fbb2/fhx2rf REGION, PRECISE_REGION | V3 `fisheye_params.json` | `offset` in `set_fisheye_grid` |
| fbb2/fhx2rf FULL_AREA | V4 `wide-angle.json` | `region_offsets[region]` in `set_fisheye_height` (its `offset` is never written) |
| fbm2 FULL_AREA | V4 `fisheye_params.json` | `region_offsets[region]` (same file as the region `offset`) |
| fbm2 REGION | V4 `fisheye_params.json` **with `region_offsets` stripped** | `offset` |
| ado1 | V2 | `offset` in `set_fisheye_height` |
| fpm1 | V3 over camera-transform | `offset` in `set_fisheye_grid` |

fbm2 strip: `FisheyePreviewManagerV4` gains an option `useRegionOffsets: boolean` on
`setupFisheyePreview` and `updateGrid`; it sends `{ ...params, region_offsets: useRegionOffsets ?
params.region_offsets : undefined }`. `Beamo2PreviewManager` passes `mode === PreviewMode.FULL_AREA`.
`Bb2Hx2PreviewManager` always passes `true` (its V4 params are the wide-angle camera only).

Shared file: fbm2's two blocks patch different fields of `fisheye_params.json`, so `CameraTab` gives them one
`createParamsSource` (`offsetParams.ts`) that loads once and merges every save into its cached copy before
writing the whole file; a second save right after the first cannot write stale fields back.

Sign derivation: if calibration maps the pixel it believes is world W to true world W − e, the laser
lands +e from the previewed object, so the stored offset is e and the grid point must be projected at
W + e. fluxghost adds the offset to the object point before `project_points`.

### 7.3 fluxghost

`fisheye_camera_mixin.py`:
- `set_fisheye_matrix`: for v2/v3/v4 store `'offset': data.get('offset', [0, 0])`; for v4 also
  `'region_offsets': data.get('region_offsets')`.
- `set_fisheye_grid` (v3): `objp[..., 0] += ox; objp[..., 1] += oy` before `project_points`.
- `set_fisheye_height` v2: same shift on `objp`. v4: pass `offset` and `region_offsets` to
  `calculate_regional_perspective_points`.

`perspective.py` `calculate_regional_perspective_points(..., offset=(0, 0), region_offsets=None)`: inside the
per-point loop, `ox, oy = region_offsets.get(region, offset) if region_offsets else offset`, project
`(x + ox, y + oy, -h)`. The region is chosen from the **unshifted** `(x, y)`, so a cell in the table
means "the pixels displayed in this part of the bed move by this much", matching what the user sees;
the shifted point is still projected with that region's extrinsics even if it crosses a region border.

Offset size: `project_points` is the full forward model, so any offset is projected exactly; the only
residual is second order (calibration scale error × offset, about 0.1 mm for 2 % × 5 mm). Hence the ±5 mm
cap above rather than a smaller step or a different formula.

Why object points and not `perspective_points`: the latter are source-image pixels before the warp. Image
axes are rotated, scaled and perspective-skewed relative to the bed, and 1 px is a different number of
mm near and far from the camera, so a constant pixel shift is neither axis-aligned nor uniform on the
bed. Shifting the mm object point before `project_points` lets the projection handle all of that per
point and yields an exact bed-plane translation after the warp. The cached lookup map (commit e61462d) keys on the perspective points, so it
invalidates naturally.

`docs/api/camera.md`: document the two keys under `set_fisheye_matrix`. `ws_smoke.py`: two cases.

### 7.4 Beam Studio UI

```
components/dialogs/camera/ManualConfiguration/
├── index.tsx            # showManualConfiguration(device): guards, select, addDialogComponent
├── ManualConfiguration.tsx  # DraggableModal + Tabs, tab visibility table (§5)
├── CameraTab.tsx        # fisheye block(s), legacy block, import button
├── RegionOffsetGrid.tsx # 3×3 UnitInput pairs
├── ModulesTab.tsx       # rows over getModuleOffsets / updateModuleOffsets
└── PrintAndCutTab.tsx   # fetch / save / clear over offsetStore
```

Loading per store reuses existing helpers: `getCheckpointData({ allowCheckPoint: false })` for
`fisheye_params.json`, `loadJson('fisheye', 'wide-angle.json')`, `promarkDataStore.get(serial,
'cameraParameters')`, `deviceMaster.getDeviceSetting('camera_offset')`. No new store; the modal keeps
form state in React.

### 7.5 i18n

New namespace `manual_config` in `en.ts` / `zh-tw.ts`: `title`, `tab_camera`, `tab_modules`,
`tab_print_and_cut`, `region_offset`, `full_area_offset`, `single_offset`, `per_region`, `import_pnc`,
`import_pnc_desc`, region names reuse existing
`calibration` keys where present. Menu key `menu.manual_configuration` = "Manual Configuration" /
"手動輸入". Remaining 21 languages before PR.

## 8. Data contracts

- `fisheye_params.json` / `wide-angle.json` / `promark-store.cameraParameters`: `offset?: [x, y]` mm;
  V4 `region_offsets?: {topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight:
  [x, y]}` mm. Absent = 0. Readers must tolerate absence (fluxghost `.get`).
- `set_fisheye_matrix` JSON gains the same two optional keys; everything else unchanged.
- `camera_offset` device setting: format unchanged; `X`/`Y` written through the full string, `F` through a
  partial `F:0|1` set that the firmware merges.
- `camera_calib/pnc.json`: unchanged format; cleared on camera-offset save and on import.

## 9. Rollout (PR plan)

1. **fluxghost** — offset + region_offsets in the mixin and `perspective.py`, docs, smoke cases. Tag.
2. **beam-studio PR A** — types, menu item (both menus), modal with Modules + Print and Cut tabs,
   legacy Camera block, fisheye Camera block, fbm2 strip. en + zh-tw.
3. **beam-studio PR A follow-up in the same PR before merge** — 21 languages, hardware sign check
   recorded in §12, Status row flipped.

Ship order: fluxghost tag → bump in beam-studio CD → PR A.

## 10. Open decisions

1. ~~D1 Backend gate~~ — **always show**, decided 2026-10-28: desktop bundles its fluxghost, so skew is
   rare; an old backend ignores the field.
2. ~~D2 Offset applied in Beam Studio (grid shift) or fluxghost~~ — **fluxghost**, decided 2026-10-28:
   covers V2 Ador and keeps one implementation for all versions.
3. ~~D3 Print and Cut → region preview as a checkbox or an import~~ — **import button**, decided
   2026-10-28: no runtime flag, no double-apply paths in `alignByCamera` / the PnC calibration.
4. ~~D4 Modal during preview~~ — **allow, applies next session**, decided 2026-10-28: zero code, since
   each `start` refetches params.
5. ~~D5 Import semantics~~ — **add** to the current offset, decided 2026-10-28: saving an offset clears
   pnc.json, so a stored pnc can only have been measured through a preview already carrying the current
   offset; it is the residual on top of it. With a zero offset add and replace coincide. §12 case 6 confirms.
6. ~~D6 Legacy `R`/`SX`/`SY`~~ — **not shown**, decided 2026-10-28: only `X`, `Y` are exposed. Rotation and
   scale are better fixed by recalibrating than by hand; open later only on a concrete request.
7. ~~D7 Region vs wide-angle offset on fbm2~~ — **independent**, decided 2026-10-29: different shots
   (head over the point vs fixed camera centre; different cameras on bb2 / hx2), so `offset` = region
   and `region_offsets` = wide-angle, with "one offset" stored as nine equal pairs. Drops the earlier
   "same as region" option.

## 11. Risks & follow-ups

- The PnC offset is applied in the sheet frame (rotated by the fit angle) while the camera offset is in
  the machine frame. Import copies the numbers; for a sheet aligned to the axes they are identical.
- fbm2 shares one file for region and full-area; a user who only tunes full-area per-region gets no
  region-preview change. The tab labels make this explicit.
- A manual offset is lost on recalibration by design; mention it in the tab description.
- Follow-up: expose `levelingData`/height for ado1 if support needs it.
- Follow-up: Promark `rotate180` stays in the calibration dialog.

## 12. Test plan

Unit (jest, `--runInBand`):
- `ManualConfiguration` tab visibility per model (table in §5).
- CameraTab save payload per store: unchanged fields preserved, `offset` added, `region_offsets`
  added/dropped by the radio, pnc cleared.
- Legacy block: regex parse of `camera_offset`, `doSetConfigTask` called with unchanged `R/SX/SY`.
- `FisheyePreviewManagerV4` strips `region_offsets` when `useRegionOffsets` is false.

fluxghost: `ws_smoke.py` cases; a unit asserting that `offset = (1, 0)` shifts every projected point by
the projection of a 1 mm step.

Hardware (record results here):
1. fbm2 region: save X = +1, Y = +1, preview the same object: it moves 1 mm **left and up** on the canvas
   (a positive offset says the cut landed right/down of the previewed object, so the preview was drawn
   too far right/down and must move back). __
2. fbm2 full-area single: same check. Sign confirmed 2026-10-29 (+X/+Y → left/up). Then per-region with one
   corner at +1: only that corner moves. Passed 2026-10-29, as did the D7 independence check (a wide-angle
   edit leaves the region preview untouched and vice versa) and the Print and Cut toggle. __
3. fbb2 wide-angle per-region. __
4. ado1 single offset. __
5. fpm1 single offset. __
6. Print and Cut import on fbm2: vernier → import → re-run PnC alignment, cut lands on the print (settles D5). __
7. beamo: cut lands 1 mm below the previewed object → decrease `Y` by 1 → aligned. Sign confirmed/flipped: __
8. Old fluxghost (2.5.6): save works, preview unchanged, no error. __
