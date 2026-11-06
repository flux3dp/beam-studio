# Auto full-area preview: pose check (fluxghost companion)

| | |
|---|---|
| **Status** | Draft (2026-11-06). Study data collected on fhx2rf (14 door cycles, 103 raw frames); design agreed; no code yet. |
| **Author** | FLUX software team |
| **Created** | 2026-11-06 |
| **Target product** | Beam Studio 2.7.x + fluxghost 2.5.8, fbb2 and fhx2rf |
| **Owner area** | fluxghost camera endpoint; Beam Studio camera client and the auto full-area preview task |
| **Parent PRD** | `docs/prd/auto-full-area-preview.md` (§2.7 signals evaluated, §7.3 open-lid loop) |
| **External repos** | fluxghost: `fluxghost/api/camera.py`, `fluxghost/api/fisheye_camera_mixin.py`, new `fluxghost/utils/camera/pose_check.py`, `docs/api/camera.md`, `tools/lid_angle.py` (study tool) |
| **Related code** | `packages/core/src/web/helpers/api/camera.ts`, `packages/core/src/web/helpers/device-master.ts` (`takeOnePicture`), `packages/core/src/web/helpers/device/camera/autoFullAreaPreview.ts` (`captureOpenLid`, `pickPhoto`), `.github/workflows/app.cd.*.yml` (fluxghost tag) |

## 1. Summary

On fbb2 and fhx2rf the auto full-area preview shoots while the lid is open and draws one photo at the close (parent §7.3). The photo must show the lid at its calibrated stop: any other pose, including a lid lowered only slightly, stretches the remapped bed by centimetres at the front. This PRD is the fluxghost half of that pick. fluxghost, which already decodes every raw frame before remapping it, measures the angle of the two chassis rims (the side rulers) in the frame and compares them with the angles the stored calibration predicts for the lid at its stop. Each frame is reported as pose-OK or not; Beam Studio draws the newest pose-OK photo and draws nothing when none passes (parent decision 7); when the check cannot be enabled the loop does not start. No recalibration: the reference comes from the extrinsics every wide-angle calibration already stores.

## 2. Background & current state

### 2.1 Frame flow

- fluxghost `fluxghost/api/camera.py` `on_image` (line 94) receives each JPEG from the machine. For the fisheye models with `fisheye_param` set it decodes the frame, calls `handle_fisheye_image` (`fisheye_camera_mixin.py:311`), which undistorts and warps it onto the workarea grid, re-encodes and sends it as one binary message. The raw decoded frame exists inside `on_image` and nowhere else; the remap crops the rim out, which is why the check has to live in fluxghost.
- Beam Studio `helpers/api/camera.ts` splits incoming messages into binary (frames) and non-binary (`{status}` JSON) streams (`wsSubject`, line 104). `sendOneShot` (line 410) sends `require_frame` and resolves with the next binary message; JSON messages with no pending command are dropped. `device-master.ts` `takeOnePicture` (line 1670) wraps it and returns `{ imgBlob, needCameraCableAlert }`.
- The open-lid loop `captureOpenLid` (`autoFullAreaPreview.ts:249`) connects the camera, selects the wide-angle camera, sends the v4 parameters with the full-area grid (`hx2FullAreaPerspectiveGrid` x 0–740, y 0–410; `bb2FullAreaPerspectiveGrid` x 0–600, y 0–375, `app/constants/fisheyeCameraConstants.ts`) and height 0, then calls `takeOnePicture` back to back until the door reads closed. `pickPhoto` (line 42) chooses the photo to draw.
- Measured cadence on fhx2rf (2026-11-06): one frame every 3 to 4 s at full resolution (3264×2448), so a cycle yields 2 to 5 photos; a pick by time alone would in practice be the second-to-last one (parent §2.7).

### 2.2 Calibration pose

The wide-angle calibration (`components/dialogs/camera/WideAngleCamera/index.tsx`) is v4: `k`, `d`, nine per-region `rvec_polyfits` / `tvec_polyfits`, evaluated at a height by `set_fisheye_height` (`fisheye_camera_mixin.py:191`, the v4 branch at 227–236 builds `rvecs` / `tvecs` per region). The calibration is shot with the lid at its fully open stop, and the manual preview tells the user to open the lid, so the stop is the only pose the remap is valid for. `project_points` (`fluxghost/utils/camera/calibration.py:232`) projects bed coordinates (mm, z = 0) into raw-frame pixels through the fisheye model.

### 2.3 What the frames show (fhx2rf, 2026-11-06)

Raw frames were dumped over 14 door cycles (normal, fast and slow closes, a hand placing material, a lid held half open, a lid held at three small tilts, a long open with a dark sheet) and measured with `tools/lid_angle.py` (Canny + probabilistic Hough at 1280 px wide, longest near-vertical segment in each outer band, angle from vertical).

| Lid pose (held still) | left rim | right rim | convergence (right − left) | bed front edge, fraction of height |
|---|---|---|---|---|
| fully open, every cycle | +1 to +2° | −2 to −3° | −3 to −5° | 0.74 |
| very small tilt | −1.0° | −0.9° | 0.0° | 0.78 |
| small tilt | −4.0° | +3.0° | +7° | 0.85 |
| mid tilt | −10° | +7° | +17° | 0.92 |
| closing, blurred | ±1° or ±20° | | | not found |
| nearly shut | not found | not found | | not found |

- The open pose is the same across every cycle, with a hand in view, with and without a sheet on the bed, and in a dark session: spread under 1° per rim.
- Convergence is monotonic with tilt. The hinge-parallel edges shift first (front edge 0.74 → 0.78 at the very small tilt, about 100 px at full resolution), convergence follows.
- A very small tilt already stretches the bed about 7% of its depth toward the front, zero at the back: up to about 3 cm at the front of a 410 mm bed after the remap. It is rejected: the calibration never saw that pose and the manual preview never produces it.
- Frames taken while the lid moves are motion-blurred with rolling-shutter warp. Their rims sometimes still measure within ±1° of the open pose (half-2 frame 3, tilt-very-small frame 5), so the angle alone does not reject them. Whole-frame sharpness (Laplacian variance) and the Hough line count both fail as absolute gates: the dark session reads 300–500 on valid frames where a lit session reads 2000–2900, and blurred frames read 500–1300.
- The front edge of the bed is a poor second signal: a hand or a sheet hides it in most hand frames.

## 3. Goals & non-goals

Goals

- Every photo of the open-lid loop carries a pose-OK verdict measured on the raw frame against the machine's own calibration, no new calibration step.
- The pick draws the newest pose-OK photo and nothing otherwise: a rejected photo is never drawn as a best effort.
- Nothing changes for any camera session that does not ask for the check: same messages, same frame bytes, same timing.

Non-goals

- fbm2: it captures after the close in raw mode (parent §2.2); no lid pose to check.
- Correcting a tilted photo instead of rejecting it.
- Changing the frame cadence or resolution of the loop.
- A pose check for the manual preview (it relies on the user; parent §3).

## 4. Scenarios

- **S1 Normal close.** Lid open at its stop, material placed, lid closed at a normal speed. The photo drawn is the newest one shot at the stop; the frame in flight at the close, blurred or tilted, is never drawn.
- **S2 Slow close.** The lid is lowered over several seconds. The frames shot on the way down fail the check; the photo drawn is the last one shot at the stop, however long ago, as long as it is within the photos kept (`KEEP_PHOTOS`).
- **S3 Lid not at the stop.** The user opens the lid only part way, places material, closes. No frame passes; nothing is drawn, no toast. The console log says why.
- **S4 Hand at the rim.** A hand or sheet covers one ruler in a frame. That frame fails (rim not found) and an older frame at the stop is drawn.
- **S5 No pose in the calibration.** Parameters are not v4 or the check cannot be enabled: fluxghost replies with an error, Beam Studio logs it and ends the loop without a photo, as it does without a wide-angle calibration.
- **S6 Manual preview, calibration dialogs, Promark.** Unchanged: they never enable the check and see no new message.

## 5. Acceptance criteria

| # | Steps | Expected | Edge |
|---|---|---|---|
| L1 | fhx2rf, auto preview on. Open the lid to its stop, wait 6 s, close normally. | Console log lists each photo with `pose ok` / `pose no` and the measured and expected angles; the drawn photo is the newest `pose ok`; the photo in flight at the close is `pose no` or absent. | Fast close: same; the last photo may be the only `pose no`. |
| L2 | Same, close over about 4 s. | The photos shot while the lid moved are `pose no`; the drawn photo is the last one at the stop. | Hold the lid still at a small tilt for 5 s before closing: those photos are `pose no`. |
| L3 | Open the lid half way only, place material, close. | All photos `pose no`; log says `no pose-ok photo`; background unchanged, no toast. | — |
| L4 | Keep a hand on the left ruler while a photo is taken. | That photo is `pose no` (left rim not found); an earlier photo is drawn. | Hand over the honeycomb only: `pose ok`. |
| L5 | Manual preview (full area) on the same machine. | No `frame` JSON in the websocket trace; frames identical in size and timing to a build without this change. | Camera calibration dialog: same. |
| L6 | fluxghost `set_pose_check` without v4 parameters set. | `{"status": "error", "error": ["No fisheye params"]}`; a following `require_frame` still returns the frame. | Beam Studio side: log `pose check unavailable`, loop ends, no photo. |

## 6. Must not change

fluxghost

- `fluxghost/api/camera.py` `on_image` — every existing caller path (manual preview, calibration, Promark, streaming on legacy firmware): frame bytes, order and the absence of any JSON before a frame stay as they are unless `set_pose_check` enabled the check on that connection.
- `fluxghost/api/fisheye_camera_mixin.py` `set_fisheye_height` — recomputes the expected rims only when the check is enabled; perspective points and timing unchanged otherwise.
- `cmd_mapping` strings — `set_pose_check` is new; nothing renamed.

Beam Studio

- `helpers/api/camera.ts` `sendOneShot` / `oneShot` — all callers (preview managers, calibration dialogs, `takeOnePicture`) get the same `{ imgBlob, needCameraCableAlert }`; the extra `pose` field is optional and absent unless the check is on.
- `sendCommandWithNonBinaryResult` — the `frame` message is sent only between a `require_frame` and its frame, and `oneShot` runs on the same command queue as the other commands, so no command reply can be mistaken for it.
- `helpers/device-master.ts` `takeOnePicture` — return shape widened by an optional field only.
- `autoFullAreaPreview.ts` `captureOpenLid` — the open-lid loop's camera setup and teardown stay as they are; enabling failure takes the same exit as a missing calibration.

## 7. Design

### 7.1 Expected rims from the calibration (fluxghost)

New `fluxghost/utils/camera/pose_check.py`:

- `expected_rims(k, d, rvecs, tvecs, bed_w, bed_h, is_fisheye)` projects the bed's side edges, x = 0 and x = bed_w, as points (x, y, 0) for y from 0 to bed_h in 10 mm steps, through `project_points` with the `left` and `right` region extrinsics respectively (`rvecs['left']` / `rvecs['right']` from `set_fisheye_height`). A least-squares line through each projected set gives the expected angle from vertical and the expected image x at mid-height, in raw-frame pixels. The rulers sit a little outside the workarea edge; at the open pose the side edges are within a few degrees of parallel, so a 20 mm offset moves the expected angle by about 0.1°, below the tolerance. Record the measured offset when it is known (open decision 3).
- `measure_rims(gray, expected, tolerance_deg)` downsamples to 1280 px wide (same `preview_downsample` policy as the remap), Gaussian blur 5, Canny 50/150, `HoughLinesP` (1 px, 1°, threshold 80, min length 8% of the width, gap 10 px). For each side it keeps the segments whose midpoint lies within 5% of the width of the expected x and whose angle is within 10° of the expected angle, takes the longest, and reports its angle. Result `{ok, left, right, expected_left, expected_right}` with `ok` true when both rims are found and each is within `tolerance_deg` of its expected angle.

Thresholds (`CANNY`, Hough, bands) are module constants, named and commented; they are the same values the study tool used on the fhx2rf data, so the tool and the module can be checked against each other.

### 7.2 Command and message (fluxghost)

- `set_pose_check <json>`: `{"enabled": true, "tolerance_deg": 1.5}` or `{"enabled": false}`. Enabling needs v4 `fisheye_param` with `rvecs` / `tvecs` computed (`set_fisheye_height` already called) and the `grids` for the bed size; otherwise `{"status": "error", "error": ["No fisheye params"]}`. Expected rims are computed on enable and recomputed inside `set_fisheye_height` while enabled. Reply `{"status": "ok"}`.
- `on_image`: when enabled and the frame decoded, run `measure_rims` on the raw frame before `handle_fisheye_image`, then `send_json(status='frame', pose={...})` immediately before the binary frame. On any exception the frame is sent without the message and the error logged once per connection.
- `docs/api/camera.md` gains the command and the message; `tools/ws_smoke.py` gains a case that enables the check on a fake connection and sees the `frame` message before the binary.

### 7.3 Client (Beam Studio)

- `Camera` (`helpers/api/camera.ts`): `setPoseCheck(enabled)` through `sendCommandWithNonBinaryResult`. `sendOneShot` subscribes to the non-binary stream for the first `{status: 'frame'}` after it sends `require_frame` and attaches it as `pose` on the result; absent when none arrived before the frame.
- `device-master.ts` `takeOnePicture` passes `pose` through.
- `autoFullAreaPreview.ts`: after `setFisheyeObjectHeight(0)`, `await deviceMaster.setPoseCheck(true)`; a false result is logged (`pose check unavailable`) and the loop ends before any photo, like a missing calibration. `Photo` gains `poseOk: boolean`. `pickPhoto(photos, lastOpenAt)`: among the photos finished while the door read open, the newest with `poseOk`; none → nothing is drawn (parent decision 7). Each photo is logged with its verdict and angles so a hardware run can be read from the console.

### 7.4 Blur gate

Not in this PRD's first cut. The angle test on its own passes a few blurred closing frames (§2.3). Candidates, to be measured on the existing dump before the fluxghost PR (open decision 2):

- Rim-band difference to the previous frame of the same connection: the rulers do not move when a hand moves over the bed, so a large change in the two rim bands means the lid moved between or during the frames. Costs one extra grayscale band kept per connection.
- Rim-band sharpness relative to the previous frame.

Until one lands, a blurred frame that passes the angle test can be drawn.

## 8. Data contracts

- `→ set_pose_check {"enabled": true, "tolerance_deg": 1.5}` / `{"enabled": false}` → `← {"status": "ok"}` or `← {"status": "error", "error": ["No fisheye params"]}`.
- `← {"status": "frame", "pose": {"ok": true, "left": 1.9, "right": -2.4, "expected_left": 1.6, "expected_right": -2.9}}` then the binary frame. Angles in degrees from vertical, positive when the top leans right, rounded to 0.1; `left` / `right` are `null` when the rim is not found.
- Beam Studio: `takeOnePicture` result gains `pose?: { ok: boolean; left: null | number; right: null | number; expected_left: number; expected_right: number }`.

## 9. Performance

- Study tool: about 0.4 s per 3264×2448 frame in Python including JPEG decode and overlay writing; the decode is already paid by `on_image`, the Canny + Hough part at 1280 px is around 100 ms. Against a 3 to 4 s cadence this adds under 5% to the loop period.
- Memory: one 1280-wide grayscale per frame, released at once; no change to the remap's downsample retry.

## 10. Rollout

1. fluxghost PR: `pose_check.py` + unit test on four 1280-px fixtures (open, small tilt, closing blur, nearly shut) cut from the 2026-11-06 dump; `set_pose_check`; `frame` message; `docs/api/camera.md`; `ws_smoke.py` case; `tools/lid_angle.py` committed as the study tool. Tag 2.5.8.
2. Beam Studio, on the parent feature branch before it merges: `camera.ts`, `device-master.ts`, `autoFullAreaPreview.ts` + specs, CD workflows bumped to `flux3dp/fluxghost@2.5.8`, this PRD's Status row set to implemented. The feature ships with the check from its first release.

## 11. Open decisions

1. **Tolerance.** Proposed 1.5° per rim. fhx2rf data: open spread under 1°, the very small tilt reads 3° off on the left rim and 2° on the right, the small tilt 6° off. Settle after the fbb2 pass (3).
2. **Blur gate** (§7.4): rim-band difference versus rim-band sharpness, or none. Measure both on the existing dump with `tools/lid_angle.py` before the fluxghost PR.
3. **fbb2 pass.** No fbb2 frames yet. Collect the same cycle set on fbb2, confirm the rims are in the field of view at the stop, and record the ruler offset from the workarea edge for both models.
4. **Projection fit.** Straight-line fit to the projected points versus the chord the Hough segment measures on the fisheye arc. Expected difference under 0.5° at the band lengths seen; verify on the fixtures and widen the tolerance if not.

## 12. Risks & follow-ups

- **R1 Cadence.** At 3 to 4 s per frame a fast close can leave one pose-OK photo or none; none means no photo for that cycle. A lower-resolution loop frame would raise the cadence but changes the preview resolution; out of scope.
- **R2 Drifted lid stop.** A machine whose lid no longer rests at the calibrated pose fails every frame and silently never draws. The per-frame log shows it; a support note should say to recalibrate, and parent F3 may add a toast.
- **R3 Calibration without region extrinsics.** Pre-v4 parameters cannot enable the check (S5). All wide-angle calibrations are v4, so this is a defensive path only.
- **F1** Once the blur gate (decision 2) holds on both models, count how often a cycle ends with no pose-OK photo on real machines and decide parent F3 (toast).

## 13. Test plan

- fluxghost: `pose_check` unit test on the four fixtures (expected rims from a stored v4 parameter set; `ok` true / false / false); `ws_smoke.py` camera case with the check enabled (message precedes the frame) and disabled (no message). `uv run python tools/ws_smoke.py` must end `ALL PASS`.
- Beam Studio: `camera.spec.ts` — `sendOneShot` attaches `pose` when a `frame` message precedes the blob and leaves it absent otherwise; `autoFullAreaPreview.spec.ts` — `pickPhoto` returns the newest pose-OK photo and nothing when none, enable failure logged and the loop ends without a photo.
- Hardware: L1–L6 on fhx2rf, then L1–L4 on fbb2; rerun the 14-cycle dump set through the fluxghost module and confirm the verdicts match the study table.
