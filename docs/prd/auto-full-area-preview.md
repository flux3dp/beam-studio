# PRD: Auto full-area preview on door open/close

| | |
|---|---|
| **Status** | Draft (2026-10-19; open-lid validity revised 2026-10-30). Design settled; implementation not started. Hardware acceptance pending — no test machine available. |
| **Author** | Product with the software team |
| **Created** | 2026-10-19 |
| **Target product** | Beam Studio desktop (Electron) and web. Models: `fbm2` (beamo II), `fbb2` (Beambox II), `fhx2rf` (HEXA RF). |
| **Owner area** | Camera preview, device communication |
| **Related code** | Listener (new): `packages/core/src/web/helpers/device/camera/autoFullAreaPreview.ts`; Managers: `app/actions/camera/preview-helper/Beamo2PreviewManager.ts`, `Bb2Hx2PreviewManager.ts`, `BasePreviewManager.tsx`, `DoorChecker.ts`, `handlePreviewSetupError.tsx`, `FisheyePreviewManagerV4.ts`; Background-task manager (companion): `helpers/device/background/`; Door/status: `helpers/device-master.ts`, `helpers/api/control.ts`; Drawer: `app/actions/beambox/preview-mode-background-drawer.ts`; Preferences: `interfaces/Preference.d.ts`, `app/actions/beambox/beambox-preference.ts`, `app/stores/globalPreferenceStore.ts`, `app/components/settings/categories/Camera.tsx`; Precedent: `helpers/device/promark/promark-button-handler.ts` |
| **Companion PRD** | `docs/prd/background-tasks.md`: the manager this feature registers with (context, device selection, foreground yield, `canTouchMachine`). Lands first. |
| **External repos** | None changed. Firmware facts from `../BeamOS_NX_backend` and frame-processing facts from `../fluxghost` (both read-only). |

---

## 1. Summary

Today a full-area camera preview is a manual action: the user clicks the camera button, Beam Studio connects, moves the head (fbm2) or switches to the lid camera (fbb2/fhx2rf), captures, and draws the photo as the canvas background. This PRD makes that happen **automatically when the user closes the door**, so the canvas already shows the material by the time they return to the computer.

Three design choices drive everything else:

1. **The door is the trigger, and it is poll-only.** Firmware has no push for door state; Beam Studio polls `play get_door_open` on the control socket it already holds for the selected machine. fbm2 captures *after* the door closes (its camera is on the head and needs a closed door). fbb2/fhx2rf capture *while* the door is open (their wide-angle camera sits on the lid and needs it open), then draw the best photo at close.
2. **A capture is a one-shot reuse of the existing preview managers**, run outside preview mode. No floating bar, no mouse-mode change, no `PreviewModeController`. The managers gain two options: `silent` (never pop alerts) and `messagePrefix` (so the usual "Capturing image…" sequence reads "Auto preview: Capturing image…").
3. **A half-closed lid should not become the background.** fbb2 and fhx2rf use the same timing rule: at close, draw the newest photo that finished at least 1.5 s before the close event, else the newest photo. The ArUco markers on the fhx2rf honeycomb were evaluated as a validity signal and rejected for v1 (§2.6, §10 decision 1).

The feature is on by default and switchable in Settings → Camera. It is a background task in the sense of `docs/prd/background-tasks.md`: it only ever runs when the machine is idle and nothing else in this Beam Studio instance is using the machine; if the user starts an export, framing or calibration mid-capture, the manager's foreground yield in `checkDeviceStatus` shows this task's prompt: "The machine is capturing the work area for auto preview. Stop capturing and continue?".

---

## 2. Background & current state

### 2.1 Door state

- Normal mode: `control.ts:930` `getDoorOpen` sends `play get_door_open`, reply `{ value: '0' | '1' }`. Raw mode: `control.ts:1732` `rawGetDoorOpen` sends `M136P179` and parses `Interlock`. Exposed as `deviceMaster.getDoorOpen()` (`device-master.ts:1458`) and `rawGetDoorOpen()` (`:1315`).
- Existing pollers: `DoorChecker.ts` (1 s `setInterval`, used by fbm2 preview to abort when the door opens mid-capture, pops `door_opened` alert when `showError`), `framing.ts:684-713` (per-step check). Nothing listens continuously while idle.
- There is no door field in the status report (`IDevice.d.ts:44` has `st_id`, `st_label` only).

### 2.2 Full-area capture per model

| | fbm2 | fbb2 / fhx2rf |
|---|---|---|
| Manager | `Beamo2PreviewManager` | `Bb2Hx2PreviewManager` |
| Camera | one camera on the laser head | wide-angle camera on the lid (`setCamera(1)`) |
| Door | must be **closed** (`DoorChecker.doorClosedWrapper`, `Beamo2PreviewManager.ts:82`) | must be **open** (`Bb2Hx2PreviewManager.ts:105-121`, `getWideAngleCameraData.ts:58`) |
| Setup | `connectCamera` → `setupFisheyePreview({ cameraPosition: cameraCenter, shouldKeepInRawMode: true })` (`FisheyePreviewManagerV4.ts:40-82`): enters raw mode, homes, `rawMove` to `workarea.cameraCenter` | `connectCamera` → `getWideAngleCameraData` (V4 params, firmware ≥ `BB2_WIDE_ANGLE_CAMERA` 6.0.12) → `setCamera(1)` → `setupFisheyePreview()` with no movement, no raw mode (`:130-165`) |
| Capture | `previewFullWorkarea` (`:198-281`): disables auto-exposure, shoots light (`exposure + 500`) and dark frames, draws light as background, dark as mask | `previewWithWideAngleCamera` (`:318-333`): one `getPhotoFromMachine`, `drawFullWorkarea` |
| End | `endCameraPreview` (`:119-147`): `rawMove` to `cameraRestPosition`, `rawLooseMotor`, `endSubTask`, disconnect camera, restore exposure, `kick` | no raw task to end; disconnect camera |
| Homing | yes, inside `setupFisheyePreview` | **none** — the "no homing for BB2/RF" requirement already holds |

Frames from the camera socket are already undistorted and flattened: fluxghost `camera.py:107-120` runs `handle_fisheye_image` (`fisheye_camera_mixin.py:311`) on every frame for `fbb2`/`fbm2`/`fhx2rf` once `set_fisheye_matrix` has been sent (`FisheyePreviewManagerV4.ts:88`). For V4 it remaps through `apply_points` onto the perspective grid at 5 px/mm (`fluxghost/utils/camera/constants.py:4`); with `hx2FullAreaPerspectiveGrid` (x 0–740, y 0–410 mm, `fisheyeCameraConstants.ts:102`) the photo Beam Studio receives is 3700×2050 and covers exactly the workarea.

Messages: `BasePreviewManager.tsx:59-71` `showMessage`/`closeMessage` are Ant Design `message` toasts keyed by `progressId`, level `LOADING`, so successive steps replace each other. Alerts come from `handlePreviewSetupError.tsx` and `DoorChecker.checkDoorClosed(showError)`.

### 2.3 Machine busy / multi-client

- Status: `deviceMaster.getReport()` (`device-master.ts:1512`) → `st_id` from `device-constants.ts:7-30`; `IDLE = 0`, `TASK_RAW = -10`, `TASK_MAINTAIN = -1`.
- Same-instance guard: `check-device-status.ts:17-33` — when a manual preview session is active it pops `device_is_used` (Yes ends the preview and continues, No cancels). 21 callers: export (`handleExportClick.ts`), every machine-menu action (`menuDeviceActions.tsx`), framing, calibration dialogs, curve measurer, Print and Cut, path preview. `getDevice()` (`get-device.ts:33-35`) additionally calls `endSubTask()` whenever the control socket is in a mode — so without a guard, an export mid-capture would silently break raw mode under the fbm2 manager.
- Firmware (`BeamOS_NX_backend`, serves all three models — `fluxmonitor/security/identify.py:36-41`):
  - Camera service (TCP 23812) accepts any number of clients (`interfaces/listener.py:30,47-56`, `interfaces/camera.py:27-32`); each client pulls its own frames; camera index and exposure are device-wide state (`interfaces/camera.py:62-92`).
  - Control service (TCP 23811) accepts any number of connections; exclusivity is per *task* (`services/robot.py:290-296` raises `RESOURCE_BUSY`); `kick` (`controller/tasks/command_task.py:1638-1643` → `services/robot.py:304-317`) sends `error KICKED` to the holder and closes its socket (`controller/tasks/base.py:147-151`).
- Control-socket close handling: `device-master.ts:186-194` default listener closes the connection; `:196-230` reconnect-on-close (used during manual preview, `preview-mode-controller.ts:163`).

### 2.4 Background listener precedent

`promark-button-handler.ts` is the only background machine poller today. Rather than copy its requirements pattern, this feature and Promark both become tasks of the background-task manager (`docs/prd/background-tasks.md`), which owns the selected-device / canvas-mode / workarea / tab-focus subscriptions, device selection, the foreground yield in `checkDeviceStatus`, and `canTouchMachine` (no modal, no manual preview, no sub-task, current device, `st_id === IDLE`).

### 2.5 Modal state

Every id registered through `addDialogComponent` is a real modal (settings, array, offset, keychain, rotary, USB selector, …); nothing passive lives there, so "any dialog, alert or progress open" is a safe gate. The query itself, `hasAnyModal()`, belongs to the background-task manager (`background-tasks.md` §7.4).

### 2.6 Markers (evaluated, not used)

fhx2rf and fbm2 honeycomb boards carry four ArUco markers at the corners; fbb2 boards do not, and fbb2 machines are already shipped. They were evaluated as the open-lid validity signal for fhx2rf on 2026-10-27 to 2026-10-30 and rejected for v1. Facts, for whoever revisits it (§11 F2):

- Dictionary `DICT_5X5_1000`, ids 996 TL / 997 TR / 998 BL / 999 BR, printed white on black (needs `detectInvertedMarker`), ≈ 50 px wide in the raw 3264×2448 frame. The stock detector finds at most 2 of 4; background subtraction (σ = 25 Gaussian, min-max normalise) plus `adaptiveThreshConstant = 3`, `errorCorrectionRate = 1.0`, `perspectiveRemovePixelPerCell = 8` finds all 4 on the best sample (≈ 115 ms per frame).
- **All four sit outside the flattened frame.** In the 3700×2050 output (§2.2) the top two are cut off entirely and the bottom two leave only a sliver. Using them would need a wider grid plus a crop before drawing, which puts the manual preview path in the blast radius.
- **Lighting decides which markers read.** With a light source on the right, the right-hand markers blow out to white even at the exposure users pick; one sample at the user's exposure read only 998. Users tune exposure until *they* can see the material, which does not guarantee marker contrast.
- **The head at its origin hides the top two.** Jobs end with the head at the origin unless they start from the current position.
- **The platform moves.** A lower platform (taller object) shifts markers inward in the image, a higher one outward, so an expected position needs the platform height, which the open-lid loop does not know.

---

## 3. Goals & non-goals

**Goals**

- G1. After the user closes the door of an idle, selected fbm2/fbb2/fhx2rf, the canvas background updates to a fresh full-area photo without any click.
- G2. The photo is not one taken with the lid in motion, as far as timing can tell (fbb2/fhx2rf: timing rule, best-effort, R2; fbm2: door-closed capture).
- G3. The feature never interferes with a user action: anything that needs the machine either finds the listener idle or gets a Yes/No prompt to stop the capture.
- G4. Zero behaviour change when the preference is off, when another model is selected, or when job origin is enabled.

**Non-goals**

- Legacy Beam Series, Ador, Promark (no wide-angle / full-area door flow).
- Region or precise-region auto capture.
- Multi-computer turn-taking (§11 F1).
- Any firmware change. Any change to the manual preview flow beyond the two manager options.

---

## 4. Scenarios

- **S1 fbm2, place material.** Door opens for ≥ 2 s, closes. 1 s later the toasts "Auto preview: Connecting…", "… Entering raw mode…", "… Homing…", "… Moving to preview position…", "… Capturing image…" run, the head parks, "Auto preview: Successfully previewed" shows for 3 s, the canvas background is the new photo.
- **S2 fbb2 / fhx2rf, place material.** Door opens; while it is open the listener keeps taking photos back to back (§7.3) without showing anything. Door closes; the loop stops, within about a second "Auto preview: Successfully previewed" shows and the background is the newest photo that finished ≥ 1.5 s before the close.
- **S3 Slow close (fbb2 / fhx2rf).** The lid swings shut over more than 1.5 s: the picked photo may show the lid partly closed. Accepted (R2); a manual preview replaces it.
- **S4 Quick peek.** fbm2 door opens for 1 s and closes: nothing happens. fhx2rf/fbb2: the loop ran briefly; if it finished a photo, close draws the newest one (fallback); if not, nothing.
- **S5 Reopen during the 1 s wait (fbm2).** The pending capture is cancelled; a new ≥ 2 s open re-arms it.
- **S6 Door opens mid-capture (fbm2).** `DoorChecker` fails the capture; the partial result is discarded; the head parks; the listener waits for the next cycle. No alert.
- **S7 Export during capture.** User clicks Go while S1 is running. Alert: "The machine is capturing the work area for auto preview. Stop capturing and continue?" Yes: the capture stops at the next safe point, the head parks, export proceeds. No: export is cancelled, capture continues.
- **S8 Machine busy elsewhere.** Another computer is running a job or holds raw mode: door cycles do nothing on this computer (status not IDLE / `RESOURCE_BUSY`). Nothing is shown.
- **S9 Kicked mid-capture.** Another computer kicks this one: the control socket closes, the partial photo is dropped, no `end()` is attempted, the task's next tick reconnects through `deviceMaster.getControl()` (`device-master.ts`, reconnects when the control socket is gone) and polling resumes.
- **S10 No wide-angle calibration (fbb2 / fhx2rf).** The open-lid loop does not start; door cycles do nothing, nothing is shown. Manual preview behaves as today.
- **S11 Preference off / job origin on / document workarea ≠ machine / other tab focused / canvas not in Draw mode.** No polling, no capture.
- **S12 Manual preview after an auto photo.** The manual session starts exactly as today; with `keep-preview-result` off the auto photo is cleared by `start()` as any previous result would be.

---

## 5. Acceptance criteria

Each criterion names how to operate it and what proves it. "Toast" means the top-centre Ant Design message.

| # | Operate | Expected | Edge cases |
|---|---|---|---|
| A1 | fbm2 selected, document fbm2, preference on, canvas idle. Open door, wait 3 s, close. | After ~1 s the prefixed toast sequence runs; head moves to camera centre and back; background updates; success toast 3 s. | Open < 2 s: nothing. Reopen within 1 s of close: nothing until the next ≥ 2 s open. |
| A2 | fbb2 or fhx2rf, lid open 5 s with the material placed, close at normal speed (< 1 s swing). | No toast while open. Within ~2 s of close: success toast, background = a photo of the fully open view (finished ≥ 1.5 s before close). | Open only 1 s and close: the newest photo is used (fallback). Slow close (≈ 3 s swing): a partly closed view is possible and accepted (R2). |
| A3 | fbb2 or fhx2rf without wide-angle calibration. Cycle the door. | Nothing, no alert. | — |
| A4 | During A1's capture, click Go. | Alert with the auto-preview text, Yes/No. Yes → head parks, no background change from this capture, export continues. No → export cancelled, capture completes normally. | Same from Framing, Calibrate camera (menu), Monitor. |
| A5 | During A1, open the door. | Capture aborts silently, head parks, no alert, background unchanged. | — |
| A6 | Second computer running a job on the same machine. Cycle the door on the first. | Nothing happens; console log only. | Second computer in raw mode (calibration): same. |
| A7 | Kick this computer from another one during A1. | No alert; within ~5 s after the other side releases the machine, door cycles work again. | — |
| A8 | Settings → Camera → "Auto full-area preview" off. Cycle the door. | Nothing. Turn it back on: next cycle works without restarting the app. | Default for a fresh install is on. |
| A9 | Document Settings → enable job origin. Cycle the door. | Nothing (all models). Disable: next cycle works. | — |
| A10 | Document workarea set to another model than the selected machine. | Nothing. | — |
| A11 | Electron: open a second tab, focus it, cycle the door. | Nothing in the first tab; the second tab (same machine selected) captures. Web: switch browser tab away → nothing; back → next cycle works. | — |
| A12 | Open any dialog (Preferences, Array, Monitor) and cycle the door. | Nothing until the dialog closes. | Alert or progress popup open: same. |
| A13 | fhx2rf with the honeycomb removed (rotary). | Same as A2: the honeycomb plays no part in the pick. | — |
| A14 | Manual preview button after an auto photo, `keep-preview-result` off. | Manual session starts; canvas cleared as today. | `keep-preview-result` on: photo kept. |

---

## 6. Must not change

Shared files the design touches, with each caller and the behaviour that must stay the same.

- `app/actions/camera/preview-helper/BasePreviewManager.tsx` (`showMessage`, new `silent` / `messagePrefix` options, default off)
  - `PreviewModeController.start` (manual preview, all managers) — messages unchanged, alerts unchanged.
  - `Bb2Hx2PreviewManager`, `Beamo2PreviewManager`, `BeamPreviewManager`, `AdorPreviewManager`, `PromarkPreviewManager` — unchanged defaults.
- `app/actions/camera/preview-helper/Beamo2PreviewManager.ts` (honour `silent` in `DoorChecker` calls and `handleSetupError`)
  - `PreviewModeController` manual fbm2 preview — `door_opened` alert and setup-error alerts still pop.
  - `BeamPreviewManager` reuse of `handlePreviewSetupError` (error-report PR) — untouched.
- `app/actions/camera/preview-helper/Bb2Hx2PreviewManager.ts` (honour `silent`; `previewWithWideAngleCamera` optionally returns the image URL without drawing)
  - Manual fbb2/fhx2rf preview — draws as today; door-closed alert still pops on manual switch to FULL_AREA.
- `app/actions/camera/preview-helper/DoorChecker.ts` (`doorClosedWrapper(callback, showError = true)`: the hard-coded `true` becomes a parameter)
  - `Beamo2PreviewManager` manual flow — `door_opened` alert still pops.
  - `SolvePnP.tsx`, `Beamo2Calibration.tsx`, `ModuleCalibration/Align.tsx` (×2) — default `true`, alert still pops.
- `interfaces/Preference.d.ts`, `beambox-preference.ts`, `globalPreferenceStore.ts`, `settings/categories/Camera.tsx` (one key, one switch)
  - All other preference keys — unchanged.
- `app/lang/*.ts`, `interfaces/ILang.ts` (new keys under `settings` and `message.auto_preview`)
  - Existing keys — unchanged.
- `checkDeviceStatus`, `DialogContext` / `AlertProgressContext`, `GoButton`, `promark-button-handler` — changed by the companion PRD, listed in `background-tasks.md` §6. This feature only adds a task.

---

## 7. Design

### 7.1 Task (`helpers/device/camera/autoFullAreaPreview.ts`)

A background task (`background-tasks.md` §7.2), registered at startup:

- `id = 'auto-full-area-preview'` (priority 10, the lowest: it is a convenience and may always yield), `models = {fbm2, fbb2, fhx2rf}`.
- `isEnabled(ctx)`: preference `auto-full-area-preview` on; `ctx.workarea === ctx.device.model`; `ctx.mode === Draw`; `enable-job-origin` off. Its own subscriptions (`globalPreferenceStore`, `useDocumentStore` `enable-job-origin`) call `backgroundTasks.refresh()`. Selected device, canvas mode, workarea and tab focus come from the manager.
- `start(device)` / `stop()`: begin / end the door poll; `stop()` while capturing aborts.
- `isBusy()` = capturing or looping (§7.3); `abort()` as in §7.5; `busyMessage()` = `message.auto_preview.abort_to_continue`.

**Polling**: `setInterval(DOOR_POLL_MS = 500)`, skip a tick while the previous call is pending, while `!backgroundTasks.isCurrent(this)`, or while `deviceMaster.currentControlMode` is truthy (raw-mode commands differ; it is `null` after a kick, which `getControl()` recovers). Device selection and reselection are the manager's.

**Capture gate** (right before a capture): `await canTouchMachine(this)` (`background-tasks.md` §7.4) and mouse mode ∉ `{preview, pre_preview}`. Any failure skips the cycle with a `console.log`.

**State machine**

```
idle ─(requirements ok)─▶ polling
polling: door closed→open at t0
  fbm2: wait for close; if close − t0 ≥ OPEN_MIN_MS (2000) → armed(t_close)
        armed: if door opens again before t_close + CLOSE_DELAY_MS (1000) → polling
               else → gate → capturing(fbm2) → polling
  bb2/hx: → looping (open-lid photo loop, §7.3); on close → pick → draw → polling
capturing/looping: abort() from §7.5 or socket close → discard → polling
```

**fbm2 capture**: `new Beamo2PreviewManager(device)`, `manager.setup({ silent: true, messagePrefix })` → `manager.previewFullWorkarea()` → `manager.end()`. The manager draws the background itself (as the manual flow does). `end()` always runs, also on failure.

**Control-socket close** during capture (kick or disconnect): the task keeps the default close listener (`device-master.ts:186-194`), not reconnect-on-close; on close it drops any partial photo, skips `end()`, and returns to polling; the next command reconnects through `getControl()`, since the current device is unchanged by a kick.

### 7.2 Manager options

`BasePreviewManager` gains `protected silent = false` and `protected messagePrefix = ''`, set through `setup({ silent, messagePrefix })`. `showMessage` prepends `messagePrefix` to `content` when it is a string. `Beamo2PreviewManager.handleSetupError` and its `DoorChecker` calls pass `showError = !this.silent`; `Bb2Hx2PreviewManager.handleSetupError` likewise. Alerts from `handlePreviewSetupError` are skipped when silent (logged instead), and so is the camera-cable warning in `getPhotoFromMachine` (the capture continues). Nothing else in the managers changes.

### 7.3 Open-lid loop (fbb2 / fhx2rf)

Setup once at door-open: `new Bb2Hx2PreviewManager(device)`, `setup({ silent: true })` with the manager in FULL_AREA (it already picks FULL_AREA when wide-angle data exists). If the device has no wide-angle calibration (`hasWideAngleCamera === false` or `setup` fails), the loop does not start; the listener stays silent for this machine.

Loop while the door reads open:

```
url = await manager.getPhotoFromMachine()      // flattened JPEG object URL (§2.2)
t   = Date.now()                               // time the photo finished
push {url, t}; keep the last N = 4 entries, revoke dropped URLs
await sleep(LOOP_GUARD_MS = 200)               // capture error → sleep 1000
```

On door close, both models: newest entry with `t ≤ t_close − SETTLE_MS (1500)`; none → newest entry; no entry at all → do nothing.

Then `previewModeBackgroundDrawer.drawFullWorkarea(url)` (`preview-mode-background-drawer.ts:116`), show "Auto preview: Successfully previewed" (3 s), `manager.end()`.

### 7.4 `hasAnyModal()`

Provided by the background-task manager (`background-tasks.md` §7.4) and used through `canTouchMachine`.

### 7.5 Busy guard

`checkDeviceStatus` asks the manager (`backgroundTasks.yieldTo(device)`, `background-tasks.md` §7.3); while this task `isBusy()`, the same machine gets a Yes/No prompt with `message.auto_preview.abort_to_continue`, another machine gets a silent abort.

`abort()`: set the abort flag, await the in-flight manager call, run `manager.end()` (fbm2: park, loose motor, exit raw; bb2/hx: disconnect camera), discard the partial photo, return. `isBusy()` is false while merely polling, so idle callers never see the prompt; `canTouchMachine` then stops new captures while the caller's dialog, progress, preview mode or sub-task is active.

### 7.6 Tab focus

From the manager (`background-tasks.md` §7.5): Electron tab focus, browser-tab visibility on web.

### 7.7 Preference and settings

Key `auto-full-area-preview: boolean`, default `true`, added to `Preference.d.ts`, `beambox-preference.ts` defaults, `globalPreferenceStore.ts`, and a `SettingSwitch` in `Camera.tsx` under "Keep Preview Result". Label `settings.auto_full_area_preview` = "Auto Full-Area Preview" / 自動全範圍拍照. Changing it starts or stops the listener live via the store subscription.

### 7.8 i18n keys

- `settings.auto_full_area_preview`
- `message.auto_preview.prefix` = "Auto preview: " / 「自動預覽：」
- `message.auto_preview.abort_to_continue` = "The machine is capturing the work area for auto preview. Stop capturing and continue?" / 「機器正在自動拍攝工作區域，是否中止拍攝並繼續？」

---

## 8. Data contracts

### 8.1 Preference

`'auto-full-area-preview': boolean` (default `true`).

---

## 9. Performance

- Door poll: one `play get_door_open` round trip every 500 ms on the existing control socket, serialised by `addTask`. Idle machines only; paused in sub-task modes.
- Open-lid loop: one camera frame (≈ 0.3–1 s on the machine, including fluxghost's undistort and flatten) per iteration; the loop is naturally throttled by that latency. At most 4 object URLs retained.
- fbm2 capture: identical cost to a manual full-area preview (raw mode, homing, two frames).

---

## 10. Open decisions

Settled during design (2026-10-16), kept for the record:

1. ~~Validity signal for open-lid photos~~ → 2026-10-16: ArUco markers on honeycomb corners (fhx2rf), timing rule (fbb2, no markers in the field). Stable-pair image diff rejected: first-frame bootstrap problem. **Revised 2026-10-30: timing rule for both fbb2 and fhx2rf**; markers rejected for v1 because they fall outside the flattened frame, read only under favourable lighting, are hidden by the head at its origin, and move with the platform (§2.6).
2. ~~Absolute marker positions~~ → relative rectangle check only (2026-10-16). Moot since 2026-10-30: no marker check in v1. A future revisit would need "any marker at its expected position", which depends on the platform height (§11 F2).
3. ~~Where the busy prompt lives~~ → `checkDeviceStatus`, not `getDevice()` (menu actions bypass `getDevice`). Since 2026-10-30 through the background-task manager's `yieldTo`, not a hard-coded block.
4. ~~"Any dialog" vs a curated id list~~ → any dialog, alert or progress. Since 2026-10-30 implemented by the background-task manager's `canTouchMachine`.
5. ~~Message style~~ → original sequence with "Auto preview:" prefix, connecting step included; bb2/hx silent until the success toast.
6. ~~Job origin~~ → listener off for all models while enabled.
7. ~~fhx2rf with no valid photo~~ → do nothing (2026-10-16). Moot since 2026-10-30: fhx2rf follows the fbb2 rule, including the newest-photo fallback.
8. ~~Deferred retry when the machine was busy~~ → not in v1 (§11 F1).
9. ~~Own listener or shared infrastructure~~ → shared: this feature is the second task of the background-task manager, Promark the first (2026-10-30, `background-tasks.md`).

Pending facts (not decisions): how long a normal lid close takes on fbb2 and fhx2rf, to confirm `SETTLE_MS = 1500`.

---

## 11. Risks & follow-ups

- **R1 `SETTLE_MS` untested on hardware.** No machine is available; 1.5 s is a guess at how long a normal close takes. Mitigation: one constant; hardware rows in §12 stay pending.
- **R2 Timing rule is heuristic (fbb2 and fhx2rf).** A lid closed very slowly can still yield a tilted "settled" photo. Accepted (product decision); manual preview remains.
- **R3 Shared exposure on the camera service.** Two computers looping on the same fbb2/fhx2rf interleave frames; neither changes exposure in the wide-angle flow, so no corruption expected. fbm2's exposure dance is inside the exclusive raw task.
- **R4 Door poll in raw mode.** `play get_door_open` is not valid in raw mode; the task pauses polling while any sub-task is open. If a future flow leaves raw mode open for long, auto preview silently waits.
- **F1 Turn-taking across computers.** When a cycle is skipped because the machine is busy, remember one pending capture and fire it once `st_id` returns to IDLE within a window, so several computers get their preview in turn. One flag plus a deadline; deferred.
- **F2 Marker validity, revisited.** Start from the facts in §2.6. Workable shape: "any marker found at its own expected position counts", falling back to the timing rule when none is found. Prerequisites: markers inside the flattened frame (wider grid plus a crop before drawing), the platform height to compute expected positions, and a machine to measure detection rates under real lighting.

---

## 12. Test plan

Hardware-free (Jest, `unit-test` skill conventions; manager, `checkDeviceStatus` and tab-focus tests live in `background-tasks.md` §12):

- `autoFullAreaPreview.spec.ts`: requirements gating (each requirement toggled), fbm2 debounce (open < 2 s, reopen within 1 s, happy path with fake timers), gate failures skip, abort during capture calls `end()` and discards, socket close skips `end()` and resumes polling, `isEnabled` mapping, open-lid pick rule (settled photo, newest fallback, empty list does nothing).
- `BasePreviewManager.spec.tsx`: `messagePrefix` prepends; `silent` suppresses alerts in `Beamo2PreviewManager` / `Bb2Hx2PreviewManager` setup errors.

Hardware (pending a machine; map to §5):

- fbm2: A1, A4 (export, framing, menu calibration), A5, A7, A8, A9, A11, A12, A14.
- fhx2rf: A2 (including the slow-close case), A3, A4, A6, A10, A13.
- fbb2: A2, A3, A4.
- Web build: A11 browser-tab variant.
