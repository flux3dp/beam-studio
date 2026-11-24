# PRD: Automatic solve-PnP for fisheye camera calibration

| | |
|---|---|
| **Status** | Implemented in 2.7.4 with fluxghost 2.5.8 (flux3dp/fluxghost#128; the tag moved to it on 2026-11-23) for `fbm2` (16 marks), the `fbb2` / `fhx2rf` laser-head camera and `ado1` (8 marks). Hardware (2026-11-19 / 20): three `fbm2`, one `fbb2`, one `fhx2rf`, one `ado1`, each with its own `k` / `d` (§11, §12). Not included: Promark (mark size and detector, decision 12) and the `fbb2` / `fhx2rf` wide-angle camera (decision 1). Pending: the old-backend fallback on hardware (§12 T12), the `ado1` exposure rounds through Beam Studio on hardware (§7.3.1), decision 8 |
| **Author** | Beam Studio team |
| **Created** | 2026-11-16 |
| **Target product** | Beam Studio (desktop + web), fluxghost 2.5.8 (the version does not change; the tag moves to the merge of fluxghost #128) |
| **Owner area** | Camera calibration dialogs, fluxghost camera calibration API |
| **Related code** | Dialog: `packages/core/src/web/app/components/dialogs/camera/beamo2Calibration/Beamo2Calibration.tsx`, `beamo2Calibration/autoSolvePnP.ts`, `camera/common/autoLocateMarks.ts`, `camera/common/showHighResidualAlert.ts`, `camera/LaserHeadFisheyeCalibration.tsx`, `camera/AdorCalibration/AdorCalibration.tsx`, `camera/common/SolvePnP.tsx`, `camera/common/useCamera.ts`, `camera/common/ProcessingDialog.tsx`, `camera/common/CheckPnP.tsx`; API client: `packages/core/src/web/helpers/api/camera-calibration.ts`; constants: `packages/core/src/web/app/constants/fisheyeCameraConstants.ts` (`bm2PnPPoints`, `getRegionalPoints`); exposure: `packages/core/src/web/helpers/device/camera/cameraExposure.ts`; engraving task: `packages/core/src/web/helpers/device-master.ts` (`doBeamo2Calibration`, `fcode/bm2-calibration.fc`, source `resources/calibration-tasks/bm2-calibration.beam`) |
| **External repos** | fluxghost: `fluxghost/utils/camera/auto_pnp.py`, `tests/usage/test_auto_pnp.py`, `fluxghost/api/camera_calibration.py`, `fluxghost/utils/camera/corner_detection/find_corners.py`, `corner_detection/match_points.py`, `utils/camera/solve_pnp.py`, `docs/api/camera-calibration.md`, `tests/usage/test_camera_match_points.py`, `tools/ws_smoke.py` |

---

## 1. Summary

Fisheye camera calibration ends with a solve-PnP step: the machine engraves marks at known laser
coordinates, the camera photographs them, and the image position of every mark is paired with its
laser coordinate to compute the camera pose (`rvec`, `tvec`). Today the pairing is
semi-automatic. fluxghost proposes mark positions and the user confirms or drags each one. On
beamo II (`fbm2`) that is four dialogs of four marks each.

This PRD makes the pairing fully automatic on beamo II first: one engraving, two photos at
different exposures (five more only when marks are missing), no user interaction between
"Start Engrave" and the final check. There is
no manual-drag fallback. The outcome is either a solved calibration or a failure with a stated
reason and a retry.

Three design choices drive the rest:

1. **Use the redundancy the engraving already has.** `fcode/bm2-calibration.fc` engraves 16
   marks in a 4×4 grid. The manual flow consumes them four at a time. Matching all 16 against one
   planar model leaves 8 or more spare points, which is what makes outlier rejection possible. No
   new engraving pattern is needed.
2. **Guard in bed coordinates, not in image pixels.** Camera mounting varies per unit, so a
   pixel region of interest cannot be tight and always includes parts of the enclosure. The
   guards are the distance of each blob from a mark position on the bed and the residual
   against the planar model. Both are independent of the mounting angle.
3. **New fluxghost commands, existing ones untouched.** The manual flow of the other machines
   keeps `solve_pnp_find_corners` and `solve_pnp_calculate` exactly as they are.

---

## 2. Background & current state

### 2.1 The beamo II flow

`Beamo2Calibration.tsx` steps: `[advanced]` PRE_CHESSBOARD → CHESSBOARD (ChArUco, intrinsics
`k`, `d`) → PUT_PAPER → SOLVE_PNP_INSTRUCTION → SOLVE_PNP_TL / TR / BL / BR → SOLVE_OTHER_PNP →
CHECK_PNP. Basic mode starts at PUT_PAPER with stored parameters.

- PUT_PAPER runs `deviceMaster.doBeamo2Calibration()` (`device-master.ts:970`), which sends the
  prebuilt task `fcode/bm2-calibration.fc`. It engraves 16 marks at x = 30 / 130 / 230 / 330 mm,
  y = 30 / 90 / 150 / 210 mm (`bm2PnPPoints`, `fisheyeCameraConstants.ts:107`). Power and speed
  are baked into the task file.
- Each SOLVE_PNP_xx step renders `SolvePnP` with a hard-coded exposure, a hard-coded pixel
  `interestArea` and four hard-coded `defaultPoints` (`Beamo2Calibration.tsx:57-83`,
  `:252-290`):

  | Region | Exposure | interestArea (x, y, width, height) |
  |---|---|---|
  | topLeft | 350 | 0, 1000, 2900, 1300 |
  | topRight | 350 | 2700, 1000, 2800, 1300 |
  | bottomLeft | 100 | 1200, 2100, 1600, 1000 |
  | bottomRight | 100 | 2800, 2100, 1600, 1000 |

  The two exposures exist because the lighting sits below the work area: the lower half of the
  image is bright and the upper half is dark.
- SOLVE_OTHER_PNP (`Beamo2Calibration.tsx:327-360`) derives the left / right / top / bottom /
  center regions from the same 16 image points through `getRegionalPoints` and calls
  `solvePnPCalculate` for each. No user input.
- CHECK_PNP overlays a grid for the user to confirm, then the V4 parameters are saved.

### 2.2 What fluxghost does today

`cmd_solve_pnp_find_corners` (`camera_calibration.py:276`):

1. Undistorts the photo with `k`, `d` (`get_remap_img`). It does not apply `rvec` / `tvec`; the
   image is not perspective-rectified.
2. Runs `find_blob_centers` (`find_corners.py:39`, OpenCV `SimpleBlobDetector`, thresholds
   10–200, area 15–1000 px, circularity ≥ 0.64) on the interest-area crop.
3. Projects the reference points with the stored `rvec` / `tvec` and matches blobs to them with
   `match_projected_points` (`match_points.py:23`): every (reference point, blob) pair is a
   translation hypothesis, scored by pattern shape (`REL_SIGMA` 60 px) plus distance from the
   projected position (`ABS_SIGMA` 300 px).
4. When the match fails it silently returns the projected points (`camera_calibration.py:347`)
   for the user to drag.

`cmd_solve_pnp_calculate` (`camera_calibration.py:379`) distorts the confirmed points back,
runs `solve_pnp`, stores the pose and logs `np.mean(projected - imgpoints, axis=0)`
(`:400`). That value is a signed per-axis mean, so opposite errors cancel. It is not a usable
quality measure and it is not returned.

### 2.3 Why the user is still needed

- The match scores (`rel_score`, `score_detail`) never leave fluxghost, so the frontend cannot
  tell a good match from a fallback.
- Four coplanar points fit a pose almost exactly whatever they are, so a wrong pairing cannot be
  detected from four points alone.
- The pose prior after a ChArUco calibration is the pose of the hand-held board. The
  `defaultPoints` exist to replace it (`SolvePnP.tsx:153`), and they are image positions measured
  on one unit.
- The interest areas are wide on purpose and still include enclosure parts. Dark areas of a
  small sensor are noisy. Both produce blobs that are not marks.

---

## 3. Goals & non-goals

**Goals**

- G1. On `fbm2` and on the `fbb2` / `fhx2rf` laser-head camera, the user does nothing between
  starting the engraving and the final check screen. On `ado1`, nothing but raising the
  material between the two heights.
- G2. No manual point dragging anywhere in the automatic flow. Failure is a message plus retry.
  The manual steps remain only for a backend without the new commands (decision 4).
- G3. A wrong calibration is never accepted silently: acceptance needs measured residuals under
  a threshold.
- G4. Works across units without per-unit pixel constants.
- G5. The matching and gating logic is testable offline from saved photos.

**Non-goals**

- Changing the intrinsic calibration (ChArUco) step.
- Changing the engraved pattern or generating the task at run time (decision 3). The mark
  size is a separate question (decision 11).
- Promark and the `fbb2` / `fhx2rf` wide-angle camera in the first release (decisions 1 and
  12).
- Removing the `SolvePnP` component. Other dialogs keep using it.
- Automatic exposure search. Two fixed rounds per model are enough (decision 7).

---

## 4. Scenarios

- S1. Basic calibration, clean bed, white paper covering the marks: solved without interaction.
- S2. Advanced calibration: same as S1 after the ChArUco step, with no dependence on the
  hand-held board pose.
- S3. Marks too faint, paper missing, or paper moved after engraving: the flow fails with a
  reason and offers to engrave again.
- S4. Stray blobs (enclosure parts inside the interest area, dust, sensor noise): rejected, the
  solve still succeeds.
- S5. Door opened during capture: handled like today (`DoorChecker`), then the capture restarts.
- S6. Backend without the new commands: the existing manual steps run (decision 4).
- S7. All marks found but they fit the camera parameters poorly: the user chooses between
  continuing and recalibrating the camera.

---

## 5. Acceptance criteria

Entry point for all: Calibration menu → Calibrate Camera on an `fbm2`, basic mode unless stated.

**A1 (S1) Happy path.** Put white paper on the bed, press Start Engrave, close the door when
asked. Result: a progress dialog runs through capture and solving, then CHECK_PNP opens with the
grid aligned to the engraved marks. No `SolvePnP` screen appears at any point. Saved
`fisheye_params.json` has `rvec_polyfits` / `tvec_polyfits` for all nine `WideAngleRegion` keys.

**A2 (S2) Advanced.** Run Calibrate Camera (Advanced), hold the ChArUco board at an unusual
angle for both captures. Result: same as A1.

**A3 (S3) No marks.** Press Skip on PUT_PAPER with blank paper on the bed. Result: the flow
stops with an alert naming the cause (fewer marks found than required) and returns to PUT_PAPER.
Nothing is saved. Variants: paper removed after engraving; paper shifted by a few centimetres
after engraving (must fail or solve correctly, never save a pose that fails A6).

**A4 (S4) Stray blobs.** Repeat A1 with (a) a sheet carrying printed dots of mark size next to
the engraved paper, (b) the bed light at its normal level and room lights off, (c) room lights
on and the lid window uncovered. Result: A1 passes in all three, and the debug summary (A7)
lists the rejected blobs.

**A5 (S5) Door.** Open the door during capture. Result: the existing door prompt appears; after
closing, capture restarts from the first exposure and A1 completes.

**A6 Accuracy.** After A1, take a full-area preview of the engraved marks. Result: in the
warped preview the marks sit within the tolerance the manual flow achieves on the same unit
(measure the manual flow first, record both in §11). Measured by running fluxghost's
`calculate_regional_perspective_points` + `apply_points` at the `h` the preview sends on a
photo of the marks and locating them in the warped image; a visual check in Beam Studio
confirms it. The marks used for the solve only give a lower bound (each region pose is fitted
to them), so the number that counts comes from check marks engraved afterwards at positions
between the calibration marks, measured the same way.

**A7 Diagnosability.** On success and on failure, the console has one `[auto solve pnp]` line
per matching attempt: number of exposures, marks matched, marks filled from weak blobs, RMS
residual, failure reason. fluxghost logs the same as `[auto_pnp] match: ...`. With fluxghost debug images enabled, the annotated photo is written like today
(`debug_imwrite`).

**A8 Repeatability.** Run A1 five times on one unit without moving the paper. Result: the nine
region poses agree run to run within a tolerance fixed during step 0 (§9).

**A9 (S6) Old backend.** Connect to a fluxghost without `auto_pnp_detect` (built before fluxghost #128) and
run A1. Result: after the engraving, SOLVE_PNP_INSTRUCTION and the four manual SOLVE_PNP_xx
screens appear and behave as on main. With a backend that has the commands, force a match
failure (A3): the drag screen must not appear.

**A10 (S7) High residual.** Force it by lowering `R_MAX_MM` in fluxghost (0.1) and run A1.
Result: a warning says the verification error is large, with two buttons. Continue Anyway goes
on to CHECK_PNP with the 16 points found. Calibrate Camera (Advanced) closes the dialog and
opens the advanced flow at its first step (PRE_CHESSBOARD), with the machine released in
between. In advanced mode the same warning recommends capturing the calibration pattern again
and its second button returns to PRE_CHESSBOARD. Dismissing the warning (Esc) leaves the dialog
on PUT_PAPER.

**A12 Laser-head camera (`fbb2`, `fhx2rf`).** Calibrate Camera in basic mode, white paper,
Start Engrave. Result: no drag screen; CHECK_PNP opens with the grid on the 8 marks. The
console line shows `exposures: [250]` when one photo was enough and `[250, 100, 500]` after a
second round, and `restoredTo` is the exposure the camera had before. With auto exposure on
(`wasAutoExposure: true`) it is on again afterwards. Back from CHECK_PNP returns to PUT_PAPER.
One mark covered: `NOT_ENOUGH_MARKS` with "7 of 8", back to PUT_PAPER.

**A13 Ador.** Calibrate Camera in basic mode. Result: after the first engraving the dialog goes
straight to the Elevate step; after the second engraving the parameters are saved. No drag
screen at either height. Marks missing at the second height: the message, then the Elevate step
again (the first height is kept). Then check the preview at a low and at a raised material
height: Ador has no CHECK_PNP, the preview is the only check.

**A14 Reused paper (8 marks).** Run A12 or A13 on a sheet that already carries marks of another
machine's pattern. Result: the new marks are used, or the run fails by mark count or residual;
it never saves a pose from the old pattern.

**A11 Retry from PUT_PAPER.** Reach CHECK_PNP through the automatic step, press Back, then
Skip (or Start Engrave). Result: no prompt about a machine in use, the automatic step runs
again; in advanced mode the ChArUco result is still used. Same after a `NOT_ENOUGH_MARKS`
failure.

Edge cases and expected behaviour:

| Case | Expected |
|---|---|
| One mark hidden or burnt through | Fails with `NOT_ENOUGH_MARKS`; the message gives the number of marks found (decision 5) |
| Marks missing after the first round | The second round is shot and the match repeated on all photos; fails by mark count if still not enough |
| Camera returns a frame error | Existing `useCamera` retry (2 attempts), then failure alert |
| User closes the dialog during capture | Capture stops, machine released (`releaseMachine`), nothing saved |
| Exposure cannot be set | Failure alert, exposure restored to its previous value |
| Camera auto exposure is on | Turned off before the first photo, turned back on after the exposure value is restored |
| Auto-exposure state cannot be read (old firmware, timeout) | Treated as off; the run continues |
| Anything throws inside the automatic step | `failed_to_calibrate_with_pictures`, back to PUT_PAPER; the step never stays on the spinner |

---

## 6. Must not change

| Touched file | Caller — behaviour that must stay |
|---|---|
| `helpers/api/camera-calibration.ts` (methods added) | `SolvePnP.tsx` — `solvePnPFindCorners` / `solvePnPCalculate` requests and responses unchanged |
| | `Beamo2Calibration.tsx`, `WideAngleCamera/index.tsx` (SOLVE_OTHER_PNP) — `solvePnPCalculate` result shape unchanged (a new `rms` field is additive) |
| `Beamo2Calibration.tsx` (solve steps replaced) | PRE_CHESSBOARD, CHESSBOARD, PUT_PAPER, SOLVE_OTHER_PNP, CHECK_PNP and the saved V4 parameter shape unchanged |
| | `releaseMachine` on unmount and at Finish, and `DoorChecker` usage unchanged. `releaseMachine` now also writes the machine's reported status into `currentDevice.info.st_id` after leaving raw mode (the next discovery broadcast replaces `info` anyway) |
| | PUT_PAPER reached for the first time (machine not in raw mode) — `checkDeviceStatus` gets the same `info` as before |
| `beamo2Calibration/index.tsx` (`key` by mode, `onSwitchToAdvanced`) | `showBeamo2Calibration(false / true)` from the menu and from the missing-parameters alert — same dialog, same resolved value (`completed`) |
| `fisheyeCameraConstants.ts` (read only, or a bracket table added) | `bm2PnPPoints`, `getRegionalPoints` — values and order unchanged, they define the saved region poses |
| fluxghost `find_corners.py` (not touched: `auto_pnp.py` builds its own detector with the same parameters plus the dark-blob filter) | `camera_calibration.py` manual find-corners and `opencv.py` (`detect_blobs`, Print and Cut mark detection) — untouched |
| fluxghost `camera_calibration.py` (commands added, `solve_pnp_calculate` returns `rms`) | `solve_pnp_find_corners`, `solve_pnp_calculate` — command strings, arguments, existing response keys and the silent projected-point fallback unchanged |
| | `tools/ws_smoke.py` — still ends `ALL PASS` |
| `LaserHeadFisheyeCalibration.tsx` (AUTO_SOLVE_PNP step added) | PRE_CHESSBOARD, CHESSBOARD, PUT_PAPER, CHECK_PNP and the saved V3 parameters unchanged. SOLVE_PNP_INSTRUCTION and SOLVE_PNP unchanged, reached only with a backend that lacks the commands |
| `camera/index.tsx` (`key`, `onSwitchToAdvanced`) | `showLaserHeadFisheyeCalibration(device, false / true)` from the menu and the missing-parameters alert — same dialog, same resolved value |
| `AdorCalibration/AdorCalibration.tsx` (two automatic steps; the `onNext` bodies of the two `SolvePnP` steps moved into `handleFirstPose` / `handleSecondPose`) | Manual SOLVE_PNP_1 and SOLVE_PNP_2 — same checkpoint, regression and saved V2 parameters. PREPARE_CALIBRATION, CALIBRATE (ChArUco and factory chessboard) unchanged |
| `AdorCalibration/index.tsx` (`key`, `onSwitchToAdvanced`, `replaceOpenDialog`) | `showAdorCalibration()` from the menu, factory mode — still returns `false` when the dialog is already open |
| `packages/core/src/web/app/lang/*.ts` (keys added) | No existing key renamed or removed. Reused as button labels, text unchanged: `topbar.menu.calibrate_camera_advanced`, `calibration.title_capture_calibration_pattern` |

Not touched: `SolvePnP.tsx`, `WideAngleCamera/`, `PromarkCalibration.tsx`,
`device-master.ts`, `match_points.py`
(`match_projected_points` keeps its signature; the new matcher is a new module).
`fcode/bm2-calibration.fc` changes only if decision 11 is taken; the mark positions stay.

---

## 7. Design

### 7.1 Flow

SOLVE_PNP_INSTRUCTION and the four SOLVE_PNP_xx steps collapse into one AUTO_SOLVE_PNP step
built on `ProcessingDialog`:

1. Door check and `moveLaserHead` as SOLVE_PNP_INSTRUCTION does today.
2. `autoSolvePnP` (`beamo2Calibration/autoSolvePnP.ts`) shoots in rounds, `EXPOSURE_ROUNDS` =
   `[75, 200]` then `[50, 125, 350, 500, 800]`. For each exposure of a round: set exposure,
   take a photo, send it to `auto_pnp_detect`, keep the returned `blobs` and `weak` lists.
3. After each round, send every list collected so far and the 16 reference points to
   `auto_pnp_match`. The second round is shot only when the first one ends with
   `NOT_ENOUGH_MARKS`.
4. On acceptance, write the 16 image points into `imgPoints1` grouped by quadrant exactly as the
   manual steps do, call `solvePnPCalculate` for the four quadrants, then continue to the
   unchanged SOLVE_OTHER_PNP and CHECK_PNP. CHECK_PNP's Back returns to PUT_PAPER when the pose
   came from this step.
5. On rejection, show the reason and return to PUT_PAPER. A residual over the gate with all
   marks found is not a rejection: the four quadrants are solved and the user is asked (§7.4).

Before the first photo the step reads the camera's auto-exposure state and turns it off when it
is on; a fixed exposure would otherwise not be applied. It is turned back on after the exposure
value is restored, in that order.

PUT_PAPER is reached again from CHECK_PNP's Back, from a failed match and from the
high-residual warning, each time with the machine still in raw mode. Its Next and Skip
therefore call `releaseMachine` first, and `releaseMachine` refreshes
`currentDevice.info.st_id` from `getReport`: that field comes from the discovery broadcast and
lags, so `checkDeviceStatus` would otherwise see our own finished raw mode as a machine in use
and offer to kick it, after which the next step fails.

The decision between this step and the manual ones is made inside each dialog from the call's
result. `UNSUPPORTED` is not something the backend sends: a backend that does not know
`auto_pnp_detect` answers `{"status": "Error", "message": "BAD_PARAM_TYPE"}`, and the client
(`autoPnPDetect`, `autoPnPMatch`) turns that reply into the reason `UNSUPPORTED` (§8). The
flow then continues at SOLVE_PNP_INSTRUCTION (decision 4). There is no switch to force the
manual steps. The exposure is restored and the camera disconnected in a `finally` block.

A run that ends with marks missing after seven photos spends 8 to 9 s in the matcher, which
was accepted; a successful match takes no measurable time.

**Gantry invariant.** On `fbm2` the camera rides on the gantry, so a pose is valid only for the
gantry position the photos were taken at. Capture happens with the motors held at the position
`moveLaserHead` set, the same position the preview uses, and the motors are not released between
the first and the last photo. A capture with released motors is invalid: near y < 20 the air
tube pushes the gantry and the whole preview shifts (seen as a uniform 1 mm offset on the first
unit, §11). On the `fbb2` / `fhx2rf` wide-angle camera the camera sits on the lid, so the same
rule applies to the lid: it must be closed at the same position during capture and preview.

**Height convention.** fluxghost's V4 preview evaluates each region pose from the polyfit at the
height `h` Beam Studio sends (`set_fisheye_height`, the focal distance from `getFocalDistance`),
and also places the bed grid at z = -h (`calculate_regional_perspective_points`,
`fluxghost/utils/camera/perspective.py:127`). The automatic flow therefore records the `h` the
preview will send at capture time and solves every pose with the marks at z = -h. With that,
the polyfits are constant (slope rows all zero): the camera does not move with the bed, and a
different object height is handled by z = -h geometrically. Ignoring the convention on the
`fbb2` unit (marks at z = 0 while the preview sent h = -2.5) scaled the whole preview by about
1.6% (§11). On `fbm2` the preview sends `height: 0` (`Beamo2PreviewManager.ts`), so the
implemented flow solves at 0; the convention matters from the `fbb2` wide-angle camera on.

### 7.2 Blob detection (`auto_pnp_detect`)

- Detection runs on the raw frame. No image remap: only the blob centres are undistorted
  (`cv2.fisheye.undistortPoints` with the frame padding applied), which is all the matcher
  needs.
- `SimpleBlobDetector` with the parameters of `find_blob_centers` (thresholds 10 to 200 in
  steps of 10, area 15 to 1000 px, circularity ≥ 0.64, convexity ≥ 0.85), restricted to dark
  blobs. No local contrast normalisation: on the first unit it found the same marks and
  several times more stray blobs (§11). The detector already sweeps thresholds, so the
  brightness gradient inside a photo is not what hides marks; over- and under-exposure are,
  and only another exposure recovers those.
- No interest-area crop. The whole frame is searched; filtering happens in §7.3.
- Returns `blobs`: centres with their size and a contrast figure (brightness of a ring around
  the blob minus the blob).
- Also returns `weak`: the same detection with the minimum area lowered from 15 to 4 px
  (`WEAK_MIN_AREA`), nothing else changed. It holds the marks the normal detector misses
  among hundreds of noise blobs (18 strong against 526 weak on one photo), and is only used
  next to a predicted position (§7.3 step 4). Relaxing circularity and convexity found no
  more faint marks; halving the threshold step found them at more exposures but quadrupled
  the noise. Both were dropped.

Bracketing covers the gradient between photos. Blobs from different exposures within 8 px
(`SAME_MARK_PX`) are the same mark. Keep the one from the exposure where it has the best
contrast, not the first one seen: a mark is detectable over a wide exposure range (16× on the
first unit) but its edge is clean only in the middle of that range.

### 7.3 Matching and gating (`auto_pnp_match`)

The bed is a plane, so undistorted image points and bed coordinates are related by one
homography. That model needs no pose prior and no pixel constants. `match_marks` in
`fluxghost/utils/camera/auto_pnp.py`:

1. **Seeds, prior-free.** A cell is a mark with the next mark to its right, the next one
   below, and the mark closing the rectangle. On a full lattice these are the lattice cells
   (nine on the 4×4 grid); on the 8-mark layouts, two concentric rectangles, they are the two
   rectangles. In the image, a seed is a blob, a blob to its right, a blob below, and the blob
   closest to the fourth corner of the parallelogram they span, taken among the blob's 16
   nearest neighbours on a lattice and among all blobs otherwise (the inner rectangle and any
   stray sit between an outer rectangle's corners). Each seed is tried against each cell: four
   points give a homography. Four points rather than a three-point affine seed, because the
   lid camera's perspective is strong (the top row of the `fbb2` grid is twice as wide as the
   bottom row after undistortion) and an affine seed extrapolates onto wrong blobs and never
   recovers. Seeds whose side ratio is more than 2.5× off every cell's (`SEED_ASPECT`), or
   whose predicted marks have too few blobs nearby (KD-tree check), are skipped.
2. **Grow, then settle.** Map every blob onto the bed through the hypothesis, give each mark
   position its nearest blob within 15 mm (`ASSIGN_TOL_MM`, each blob used once), refit the
   homography on the assigned pairs, repeat until the assignment is stable. Then repeat at
   3 mm (`TIGHT_TOL_MM`), starting from a RANSAC fit of the loose assignment. The loose stage
   is needed because one cell extrapolates badly; the tight stage because a stray swept in on
   the way would otherwise count as a mark (§11, covered-marks test). Keep the hypothesis with
   the most marks, then the lowest residual; return at once when every mark is matched within
   R_MAX.
3. **Upright check**: at the centre of the marks, bed +x must run mostly along image +x and
   bed +y along image +y, on every hypothesis and on the final model. A homography absorbs any
   aspect ratio, so the 90° rotated assignment of a 4×4 lattice or of a square pattern fits as
   well as the true one (it fitted the `fbb2` photos better). The residual cannot tell them
   apart. The only physical assumption is that a model's image is not mirrored or rotated by
   90°; it held on `fbm2`, the `fbb2` and `fhx2rf` laser heads and `ado1`, and is unchecked on
   Promark, whose camera has a rotation setting (decision 12).
4. **Faint marks.** When at least 7 in 8 of the marks are matched (`FILL_MIN_FRACTION`: 14 of
   16, 7 of 8), each missing mark is predicted from the homography of the matched ones and
   takes the median of the `weak` blobs within 2 mm of that position (`FILL_TOL_MM`). Weak
   blobs never take part in the matching itself. A filled centre is a measurement taken where
   a prediction pointed, with about 0.2 mm more uncertainty than a normal one; on paper a
   random position has a weak blob that close in about 2 % of cases.
5. **Gates**, both required:
   - every mark matched (each region pose needs its four marks; decision 5), else
     `NOT_ENOUGH_MARKS`,
   - RMS residual to the homography ≤ R_MAX (`R_MAX_MM`, 1.0 mm; decision 10), else
     `HIGH_RESIDUAL`.
6. **Cross-check.** Each quadrant's `solve_pnp_calculate` returns an RMS reprojection error
   (per-point distance, replacing the cancelling mean in the log and added to the response).

Not implemented, and not needed so far: a filter by work-area bounds (the 3 mm tolerance does
that job) and a physical-sanity check of the solved poses.

The single-homography residual is non-zero even for correct matches on a bed-wide grid (that
inaccuracy is why the V4 format has per-region poses): 0.38 to 0.47 mm on the three `fbm2`
units, against 0.03 to 0.10 mm for the 8-mark layouts, whose marks sit in the middle of the
frame. So R_MAX is a gate against strays and against intrinsics that describe the camera
poorly, not an accuracy figure. In simulation the preview error inside the mark grid is about
equal to the gate value at most (0.6 to 1.5×) and about 0.4× of it on average over the bed; the
border outside the mark grid is not constrained by it. Accuracy is A6, measured through
fluxghost's own preview warp (§12 T6), never a separately written projection: one convention
difference (§7.1 height) made a hand-written check report the opposite of what the preview
showed.

Cost: no measurable time when all marks are there (early return); 1 to 2 s with marks missing
after two exposures; 8 to 9 s after seven (about 95 blobs); up to 5 s for an 8-mark photo with
40 blobs and one mark hidden.

### 7.3.1 The 8-mark machines

`common/autoLocateMarks.ts` holds what the machines share: connect the camera, optionally
select one (`cameraIndex`), handle exposure and auto exposure, shoot the rounds, detect, match,
restore, disconnect. It returns the points and stops there; each dialog solves its own poses.
`beamo2Calibration/autoSolvePnP.ts` is a caller like the others.

| | `fbm2` | `fbb2` / `fhx2rf` laser head | `ado1` |
|---|---|---|---|
| Reference points | 16, `bm2PnPPoints` | 8, `bb2PnPPoints` | 8, `adorPnPPoints` |
| Exposure rounds | `[75, 200]`, `[50, 125, 350, 500, 800]` | `[250]`, `[100, 500]` | `[250]`, `[125, 450]` |
| Residual limit (`rMax`) | backend default, 1.0 mm | 0.2 mm | 0.2 mm |
| Camera | default | `cameraIndex: 0` | default |
| Poses solved | four quadrants at dh 0 | one at dh 0 | one per height (`dh1`, `dh2`), then `extrinsicRegression` |
| Machine during the photos | raw mode, motors held | released after `moveLaserHead()` | released after `prepareToTakePicture()` |
| After the solve | SOLVE_OTHER_PNP, CHECK_PNP | CHECK_PNP | first height: ELEVATED_CUT; second: saved |

- The matcher takes no pose: it never reads the stored `rvec` / `tvec`, only `k`, `d` and the
  mark positions. Its one orientation assumption is that the image is not rotated by 90 or
  180 degrees against the bed (agreed 2026-11-20 as a precondition for these machines).
  Promark, whose camera may be mounted upside down (`rotate180`), needs that handled first.
- 8 marks give a homography little to disagree with, hence the tighter residual limit and the
  proportion check on finished matches (`MAX_ANISOTROPY`). Values, measurements and the cases
  behind them: fluxghost `docs/api/camera-calibration.md`, "auto_pnp constants".
- `ado1` runs two separate passes (engrave, find, raise, engrave, find). A failure at the
  second height returns to ELEVATED_CUT, not PUT_PAPER: the first pose is already saved as a
  checkpoint.
- `fhx2rf` uses the `fbb2` values (decided 2026-11-23: the same laser-head camera module; one
  `fhx2rf` passed with them, no sweep of its own). `ado1` has rounds of its own
  from a sweep (decision 12): the exposure with the best mark contrast first, then one below
  and one above. Its firmware exposes the camera exposure from some version on only, so
  `autoLocateMarks` falls back to one photo at the camera's exposure, untouched, whenever the
  exposure cannot be read; this holds for every machine. Not yet run through Beam Studio on
  an `ado1`.
- On `ado1` the second pose is followed by the regression and the save inside the automatic
  step. If either fails the step returns to ELEVATED_CUT; it used to stay on the drag screen,
  which the automatic step no longer has.
- The laser-head camera rides on the head and the motors are released before the photos, as
  in the manual flow: a head moved by hand between `moveLaserHead()` and the photo gives a
  wrong pose.

### 7.4 Failure handling

No drag screen when the backend has the commands. Results map to:

| Result | What the user sees |
|---|---|
| `NOT_ENOUGH_MARKS` (after both rounds) | `auto_solve_pnp_not_enough_marks` with the number of marks found, then PUT_PAPER |
| `HIGH_RESIDUAL` with all points (`highResidual` on a successful `autoSolvePnP` result) | Warning, dialog on PUT_PAPER behind it. Basic mode: `auto_solve_pnp_high_residual` with Continue Anyway (`auto_solve_pnp_continue_anyway`, on to SOLVE_OTHER_PNP) and Calibrate Camera (Advanced) (`await releaseMachine()`, then `onSwitchToAdvanced`). Advanced mode: `auto_solve_pnp_high_residual_advanced` with Continue Anyway and Capture Calibration Pattern (PRE_CHESSBOARD) |
| A thrown error | `failed_to_calibrate_with_pictures`, then PUT_PAPER |
| `UNSUPPORTED` (backend without the commands) | No message: SOLVE_PNP_INSTRUCTION and the manual steps (decision 4) |
| `NO_IMAGE`, `SOLVE_PNP_FAILED`, anything else | `failed_to_calibrate_with_pictures` with the reason, then PUT_PAPER |

Retrying re-runs the same task file.

The step moves to PUT_PAPER before the warning opens, not in the buttons' callbacks: the
warning can be dismissed with Esc, and `ProcessingDialog` runs `process` again on every
re-render of its parent, so it must not stay mounted while the user decides.

The warning is `common/showHighResidualAlert.ts`, shared by the three dialogs. On `ado1`
Continue Anyway leads to saving with no check screen in between; it is offered all the same,
since a unit whose camera fits its parameters a little worse than the limit would otherwise
have no way to finish in basic mode (the one `fhx2rf` measured sits at half the limit).

The switch to advanced mode goes through `showBeamo2Calibration(true)` with the same dialog id.
The element carries `key={isAdvanced ? 'advanced' : 'basic'}`; without it React keeps the
mounted instance with its step and its stored `k` / `d`. `showLaserHeadFisheyeCalibration`
does the same. `showAdorCalibration` refuses to open while its dialog id exists, and the id
still exists in the tick the old dialog is popped, so its switch passes `replaceOpenDialog`.

### 7.5 i18n

`calibration.auto_solve_pnp_locating` (progress text), `auto_solve_pnp_not_enough_marks`
(`%(total)d` and `%(found)d`, so the 8-mark machines can share it),
`auto_solve_pnp_high_residual`, `auto_solve_pnp_high_residual_advanced` and
`auto_solve_pnp_continue_anyway`, in all 23 languages (machine-drafted outside `en` and
`zh-tw`, no native review). The messages avoid internal terms: "verification error", not
residual or camera parameters; "calibration pattern", not ChArUco. `solve_pnp_step1..3` stay;
other dialogs use them.

---

## 8. Data contracts

Both commands live on the existing `camera-calibration` websocket and need `k` / `d` loaded
(`update_data`), else the existing `NO_DATA` failure.

```
→ auto_pnp_detect <file_length>
← {"status": "continue"}            → binary upload
← {"status": "ok",
   "blobs": [[x, y, size, contrast], ...],       // undistorted px
   "weak":  [[x, y, size, contrast], ...]}       // same, minimum area 4 px

→ auto_pnp_match <args_json>
   args: { "ref_points": [[x, y], ...],          // mm, a full lattice or nested rectangles
           "blobs": [[[x, y, size, contrast], ...], ...],  // one list per exposure
           "weak":  [[[x, y, size, contrast], ...], ...],  // optional, one list per exposure
           "r_max": number }                               // optional, mm; default R_MAX_MM
← {"status": "ok",
   "points": [[x, y], ...],                      // per ref point, undistorted px
   "matched": number, "filled": number, "rms": number}
← {"status": "fail", "reason": "NOT_ENOUGH_MARKS" | "HIGH_RESIDUAL",
   "points": [[x, y] | null, ...],               // null for a missing mark; complete after HIGH_RESIDUAL
   "matched": number, "filled": number, "rms": number | null}

→ solve_pnp_calculate ...            // unchanged request
← {"status": "ok", "rvec": ..., "tvec": ..., "rms": number}   // rms is new
```

`filled` counts the marks taken from `weak`. The first draft also had `workarea`,
`prior_points`, per-point `residuals`, a `rejected` count and an `AMBIGUOUS` reason; none was
needed and none exists. The client (`autoPnPDetect`, `autoPnPMatch` in
`helpers/api/camera-calibration.ts`) turns the reply to an unknown command into `UNSUPPORTED`.
fluxghost sends `{"status": "Error", "message": "BAD_PARAM_TYPE"}` for it, with a capital E: the
websocket wrapper routes only the lowercase `error` to `onError`, so this reply arrives through
`onMessage` and is recognised there (`isUnknownCommand`). Before that was handled the promise
never settled and the step hung (found in review, 2026-11-23).

Both new commands are stateless apart from `k` / `d`, so they run offline against saved photos.
Command names are final once fluxghost's `cmd_mapping` has them; do not rename afterwards.

---

## 9. Rollout (PR plan)

0. **Data collection, before any matcher code.** A dev-only capture after the standard
   engraving, on every `fbm2` unit available. Per unit, without moving the paper:
   - motors held at the calibration position for the whole capture (gantry invariant, §7.1);
     photos taken with released motors cannot be used to judge accuracy;
   - an exposure sweep: 8 to 10 values from 50 to 500, densest between 50 and 300, one
     uncropped raw photo each (the first unit showed nothing usable above 500). The sweep is
     wider than any bracket on purpose: the bracket is chosen from it, and the manual flow's
     exposure slider shows the fixed 350 / 100 do not suit every unit;
   - ground truth: one run of the manual flow, saving the 16 confirmed points and the exposure
     the operator ended on in each region;
   - the same sweep under each A4 disturbance.

   Stored as fluxghost fixtures (`tests/usage/fixtures/auto_pnp/`) with the unit and capture
   conditions: blob lists rather than photos where possible (one photo is kept for the
   detector test); the raw photos stay outside the repo. Decisions 2, 5 and 7 are made from this set. Report, per mark position and per
   exposure, the detection rate; the bracket is the smallest
   set of exposures that covers every mark on every unit. Units available: several `fbm2`; one
   each of `fbb2`, `fhx2rf` and `ado1`.
1. fluxghost #128 (merged 2026-11-23): `auto_pnp_detect`, `auto_pnp_match`, `rms` in
   `solve_pnp_calculate`, fixture tests, `docs/api/camera-calibration.md`, `ws_smoke.py`
   entries. No version change: tag 2.5.8 moved to the merge, so the CD workflows need no edit.
2. beam-studio (`feat/auto-solve-pnp`): API client methods, `common/autoLocateMarks.ts`, the
   automatic step in the three dialogs, strings in all languages, specs, the
   `camera-calibration` skill.
3. Hardware pass (§12), thresholds recorded in §11. Done for the happy path and missing marks
   on three `fbm2`; the old-backend path is not tested yet, the rest is listed in §12.
4. Follow-up PRs: the `fbb2` / `fhx2rf` wide-angle camera (decision 1), then Promark, which
   needs detector work first (decision 12).

---

## 10. Open decisions

1. ~~**Machine order after `fbm2`.**~~ **Settled 2026-11-16:** wide-angle camera on `fbb2` /
   `fhx2rf` next (same 4×4 quadrant layout, `bb2WideAngleCameraPnpPoints` /
   `hx2WideAngleCameraPnpPoints`, two heights), then laser-head fisheye and Ador (8 marks,
   single region), Promark last. **Changed 2026-11-20:** the laser-head camera and Ador went
   first and ship with `fbm2`; the wide-angle camera and Promark follow.
2. ~~**Coarse association method.**~~ **Settled 2026-11-17: prior-free** (§7.3). It assigned
   every visible mark correctly on both step 0 units without default points.
3. ~~**Stronger re-engrave on failure.** The task file has fixed power and speed, so a retry
   cannot engrave darker.~~ **Settled 2026-11-16: accept.** No unit has failed to mark the paper
   so far. If step 0 or the field shows faint marks, switch the engraving to a scene file the
   way Promark does (`loadCameraCalibrationTask` in `helpers/device/promark/calibration.ts`
   loads a `.bvg` and sets power per source), which makes power adjustable at run time at the
   cost of a larger change.
4. ~~**Backend without the new commands** (web with an older helper).~~ **Settled 2026-11-16:**
   when the backend does not know `auto_pnp_detect`, run the existing manual steps unchanged.
   This is the only path to the drag screen; a backend that has the commands never falls back
   to it, whatever the failure.
5. ~~**A mark that is not found.**~~ **Settled 2026-11-19: every mark is required.** A mark
   the normal detector misses may be taken from the weak blobs next to its predicted position
   when at least 7 in 8 of the marks are matched (§7.3 step 4). Preferred over filling in the
   predicted position itself, over a stronger engraving, and over failing; ranked in that
   order. A third `fbm2` needed it for two marks until the marks were enlarged (decision 11).
   Original text: Every region pose is solved from exactly four marks
   (`bm2PnPPoints` quadrants, then `getRegionalPoints`), so one missing mark breaks up to four
   regions. The redundancy of 16 marks serves outlier rejection, not missing marks. Working
   rule until step 0: all 16 must be matched, otherwise fail. Decide from the per-mark detection
   rate of the step 0 set:
   - misses are rare: keep the rule;
   - misses are common and tied to exposure or position: fix capture first (bracket values);
   - misses remain: fill the missing image point from a homography fitted on the neighbouring
     marks only, limit it to one mark per run, and report it in the summary line. A filled
     point is a prediction, not a measurement, so this is the last resort.
6. ~~**CHECK_PNP.**~~ **Settled 2026-11-16:** keep the visual confirmation.
7. ~~**Exposure bracket values.**~~ **Settled 2026-11-19 for `fbm2`: two rounds**, 75 + 200,
   then 50 / 125 / 350 / 500 / 800 only when marks are missing (§7.1). All three office units
   pass in the first round. A camera module with another exposure scale (§11, third `fbm2`)
   has not needed its own values. Step 0 data: `fbm2` first unit: 75 + 200 covers all 16 marks, today's
   350 / 100 do not. `fbm2` second unit: 75 alone covers all 16, 200 finds 8, 350 finds 7, so
   the pair differs between units and the low value carries most of it. `fbb2` wide-angle
   first unit: any single exposure from 75 to 125 covers all 16. Final values from the
   remaining units of step 0.
8. **Shared `k` / `d`, and refining the intrinsics from the marks.** **Deferred 2026-11-19:
   the first version uses each unit's own ChArUco `k` / `d`** and does not refine. The office
   does not have enough cameras to show that shared values hold on every unit, and an outlier
   camera with shared values and no refine would be worse off than today. What is known so
   far follows; shared values, if they come, are keyed by camera module, not by machine model
   (§11, third `fbm2`). Proposed: after matching, refine the intrinsics
   (`cv2.fisheye.calibrate`, one view) on the 16 marks, then solve the region poses with the
   refined values. On the `fbb2` unit this beat the stored manual calibration (§11) and the
   preview looked better than the ChArUco result.
   - **What that result does and does not show.** The run started from this unit's own ChArUco
     `k` / `d` and kept the principal point fixed (`CALIB_USE_INTRINSIC_GUESS |
     CALIB_FIX_PRINCIPAL_POINT | CALIB_FIX_SKEW`), so only `fx`, `fy` and the four distortion
     coefficients moved. It is "ChArUco intrinsics tuned to the work plane", not a calibration
     without ChArUco. The tuned values fit the work plane; off the plane (thick material) they
     are not known to be better than the ChArUco ones.
   - **Target: a per-model `k` / `d` as the start, ChArUco only as the advanced path.** The
     three groups transfer differently between units with the same lens: distortion comes
     from the lens design and should transfer; focal length differs by a percent or two and is
     what the refine already corrects; the principal point depends on how the lens sits over
     the sensor and may differ by tens of pixels. The principal point is the open part. A
     fisheye's distortion is symmetric about it, so it is partly observable from one plane
     (unlike a pinhole model), and what is left is mostly absorbed by the pose on the work
     plane. It is not absorbed across heights, which matters more on `fbb2` where the preview
     `h` changes with focus (§7.1).
   - **Experiments**, each run with the principal point fixed and free, accuracy measured as in
     A6:
     1. Cross-unit on `fbm2` (several units exist): unit A's ChArUco `k` / `d` plus unit B's
        16 marks, against unit B's own ChArUco calibration.
     2. Perturbed start on one unit (`fbb2` has only one): shift the principal point by
        ±30 px and the focal length by ±2 %, refine, compare with the unperturbed result.
        Shows convergence only, not the real spread between units.
   - **If it holds**: the default flow is model `k` / `d` + marks with the reprojection rms as
     the gate, and ChArUco is asked for only when the gate fails. The threshold comes from
     experiment 2 (rms of a start that cannot be recovered vs a normal one).
   - Still open besides the above: the refine leaves the area outside the mark grid
     unconstrained (the `fbb2` top corners), see decision 9.
   - **Result on `fbm2` (2026-11-18, experiment 1, one direction, §11).** Two findings that
     change the proposal for this model:
     - Borrowing works without any refine. Unit B's marks with unit A's `k` / `d` and poses
       only: 0.71 mm fit / 0.87 mm leave-one-out on a single pose, against 0.65 / 0.83 with
       unit B's own ChArUco values. The principal points of the two units differ by 37 and
       64 px, and the pose absorbs it. Through fluxghost's warp with the nine region poses the
       marks land within 0.13 mm mean, 0.42 mm max, and the Beam Studio preview was judged at
       least as good as the unit's manual calibration.
     - Refining is not reliable here. Every variant that frees the focal length moves it by
       6 to 30 % (1339 → 1430 to 1760) while the fit improves by tenths of a millimetre, and
       the leave-one-out maximum grows to 5 to 9 mm when distortion is free as well. One view
       of a plane seen at about 22° cannot separate focal length from camera distance.
       `CALIB_FIX_K1` on or off makes no difference to this. (The flag exists in the ChArUco
       step because without it the calibration error jumps to tens or hundreds with the few
       photos a user takes.)
     - Both directions hold over the whole bed in a no-photo test (§11): one unit's stored
       camera taken as the truth, its 16 mark positions synthesised, the nine region poses
       solved from them with the other unit's `k` / `d`, error sampled every 10 mm. Mean 0.38
       and 0.18 mm, 0.80 and 0.35 mm at most inside the mark grid, 1.11 mm at most on the
       border in both directions.
     - The same lens is on other models, and their intrinsics work just as well: on the
       second `fbm2`'s marks, the `fbb2` and `fhx2rf` laser-head values fit to 0.64 and
       0.72 mm, the other `fbm2`'s to 0.71 mm, the unit's own to 0.54 mm (§11). One shared
       `k` / `d` for every camera with this lens is the working assumption, not one per model.
     Proposal for `fbm2`: ship a shared `k` / `d` (skew 0, see §11), solve poses only, no
     refine, ChArUco stays as the advanced path. Before settling: a third unit, check marks
     that are not used for the solve (A6), and how the shared values are derived (candidates
     are scored by solving other units' marks with them, as in §11). `fbb2` wide-angle: the 2026-11-17 result needs a second reading. The
     stored calibration it beat is an outlier (`fy` 6 % above `fx`, distortion unlike the
     other four cameras, 3.25 mm on the `fbm2` marks where the others give 0.5 to 0.7 mm), so
     the refine probably repaired a poor ChArUco result rather than improved a good one. Next
     on that unit: poses only with the shared `k` / `d`, before any refine.
9. **Marks near the corners.** Proposed experiment on `fbb2`: engrave one row of marks at
   y ≈ 10 to 20 mm to find the camera's real top field of view (the model puts the top corners
   outside the frame), and larger marks at the bottom corners (2.3 to 2.7 px per mm there
   against 5.8 in the centre, so a centre-size mark falls under the detector's 15 px area).
   Corner marks also bring back the exposure bracket (bottom-left needs about 200, the rest
   75 to 125).
10. **R_MAX.** 1.0 mm since 2026-11-20 (0.75 before): the preview error inside the mark grid
    is about the gate value at most, so 1.0 aims at a preview within about 1 mm, and a
    calibration that keeps failing costs the user more than a preview that is slightly off.
    The three office units give 0.38 to 0.47 mm. Revisit with field data. Since 2026-11-20
    the gate no longer blocks: over it, the user is warned and may continue to CHECK_PNP
    (§7.4), because the alternative was engraving again with the same outcome. For the 8-mark
    layouts this value gates almost nothing: correct matches give 0.03 to 0.10 mm, and one
    mark displaced by 1 / 2 / 3 mm gives 0.15 to 0.31 / 0.31 to 0.62 / 0.47 to 0.93 mm
    (simulated on the `fbb2` photo), so a stray up to 3 mm from a missing mark would pass.
    They need their own value before their dialogs are wired, and it has to be per machine:
    about 0.2 mm suits the laser-head cameras, but a correct Promark match already gives
    0.265 mm (0.6 px at 2.4 px per mm). Not added yet: nothing calls the matcher with 8
    marks today.
11. **Mark size.** The `fbm2` marks have a 0.3 mm radius and show as about 1.0 mm (burn
    spread plus blur): 5 to 6 px across in the bottom two rows, an area of about 20 px against
    the detector's minimum of 15. At a 0.5 mm radius every mark of the third unit is found by
    the normal detector (no weak fill). Proposed: 0.5 mm in `bm2-calibration.beam` / `.fc`,
    all 16 marks, since the flare position is not fixed per unit. In the repo since 2026-11-24,
    engraved at 30 % and 100 mm/s instead of 20 % and 70 mm/s: about the same energy per mm and
    the same look on paper, estimated task time 79 s instead of 102 s.
    Larger marks do not replace the second round: on the third unit under a strong reflection
    along the bottom rows, 0.5 mm marks still needed all seven exposures and one weak fill
    (results below); what is missing there depends on the light, not on the mark size. `ado1`
    marks are as small (4.7 to 6.5 px) and should follow.
12. **8-mark layouts** (`fbb2` / `fhx2rf` laser head, `ado1`, Promark). The layout stays: two
    concentric rectangles carry a fixed 1 : 2 ratio that a row of old marks cannot imitate,
    and a 4×4 grid would only add room for filling. `fbb2`, `fhx2rf` and `ado1` are wired
    (§7.3.1); what remains open:
    - Another machine's 8-mark pattern on a reused sheet does imitate it: the layouts differ
      only in proportions (120 × 80 against 120 × 120), which a homography absorbs. Seen on
      `ado1` (wrong preview at the lower height), closed by the proportion check.
    - ~~On `ado1`, whether exposure can be set from Beam Studio.~~ Settled 2026-11-24: it
      can, from some firmware version on; older firmware gets one photo at the camera's
      exposure (§7.3.1). `fhx2rf` shares the `fbb2` rounds (settled 2026-11-23).
    - Promark: the marks are bright dots on a dark sheet, 2.3 to 3.2 px across, below the
      15 px minimum area of both the automatic (dark only) and the manual (any colour)
      detector (§11). Needs a larger mark first, about 2.5 mm across to reach 6 px at 2.4 px
      per mm; then a bright-blob option on `auto_pnp_detect`, the red pointer off during the
      capture, and a check of the upright assumption against the camera rotation setting.
    - Matching cost without a full lattice grows with the cube of the blob count when a mark
      is missing: it was 5 s at 40 blobs and 41 s at 54, because the seed's own four blobs
      satisfied the nearby-blob check. The check now asks for half of the other marks too:
      1.5 s and 2 s. Still unbounded for several merged exposures.
    - `ado1` solves at two heights. Agreed 2026-11-20: two separate passes, engrave, find,
      ask the user to raise the material, engrave, find.
    - Exposure. The manual 8-mark dialogs set none; only `fbm2` passes `initExposure`. Each
      machine needs its own rounds from a sweep. `fbb2` laser head, one unit, one lighting
      (2026-11-20, 16 single photos from 50 to 3000, no weak list): 8 of 8 at every value
      from 100 to 800 (rms 0.042 to 0.050 mm, mark positions within 0.64 px of each other,
      best contrast at 200 to 300); 7 of 8 at 50 and from 900 up. Over-exposure is the
      expensive side: 89 to 97 blobs at 2000 / 3000 and 22 to 38 s in the matcher, ending in
      a failure. Proposed for `fbb2`: one photo at about 250, then `[100, 500]`, never above
      800. `fhx2rf` and Promark are not swept. `ado1`, one unit, lid closed (2026-11-24, 17
      single photos from 50 to 1500 of a fresh engraving): 8 of 8 from 100 to 450, best mark
      contrast at 250 to 300; 7 of 8 at 75; 5 to 6 of 8 from 500 up, where the small marks
      (5 to 6 px) wash out. The unit was on 440, where one mark already needs the weak list.
      A reused sheet with two patterns on it gave 8 of 8 from 100 to 500. Matching stays
      under 1 s up to 800 even with about 2000 weak candidates (the honeycomb bed). Rounds:
      `[250]`, then `[125, 450]`.
    - Auto exposure. `fbm2`, `fbb2` and `fhx2rf` have an auto-exposure switch
      (`supportCameraAutoExposureModels`), and a fixed exposure presumably has no effect
      while it is on. The automatic step must turn it off before the first photo and restore
      it with the exposure value. Done for `fbm2` in `autoSolvePnP.ts` and passed on one unit
      with auto exposure on (2026-11-20). `fbb2` needs the firmware check `useCamera` makes
      (`BB2_AUTO_EXPOSURE`).

---

## 11. Risks & follow-ups

- **Faint marks on paper** are the weak point shared by every approach. Bracketing helps; if
  step 0 shows misses, decision 3 names the way out (scene-file engraving
  with adjustable power).
- **Lattice ambiguity**: a 4×4 grid shifted by one pitch still looks like a grid when the outer
  row is hidden and stray blobs line up. Seen on hardware (below); the tight stage and the
  every-mark rule guard it.
- **A stray within 3 mm of a missing mark** is still taken as that mark. With every other mark
  present the residual barely moves, so nothing catches it; CHECK_PNP is the last guard.
- **Projective self-similarity of the 8-mark pattern**: with two marks missing, a homography
  that squeezes the pattern along a diagonal fits six real marks to wrong positions with no
  residual. Harmless while every mark is required; it is why the weak fill needs 7 of 8.
- **Border of the bed**: the gate constrains the area inside the mark grid; outside it the
  preview is extrapolated.
- **Homography residual too large on some units** for one R_MAX to separate marks from strays.
  Fallback: gate per quadrant instead of globally.
- **Height convention**: the `h` recorded at capture must be the one the preview sends later. If
  the focal distance probe changes its zero (refocus, firmware), every saved pose shifts by the
  difference. Record `h` in the parameters (decision for the data contract once implemented).
- **One unit each of `fbb2`, `fhx2rf` and `ado1`.** Unit-to-unit mounting variance, the reason
  for guarding in bed coordinates, can only be measured on `fbm2`. For the later machines the
  thresholds come from a single unit, so their follow-up PRs must keep margins wide and say so.
- **Capture time**: each extra exposure is one more photo. Target total under the time the four
  manual dialogs take today; measure in step 3.
- Follow-up: attach the photos to an error report on failure (existing consent flow).
- `DEFAULT_POINTS_*` and the pixel `interestArea` table in `Beamo2Calibration.tsx` stay, since
  the manual steps remain for old backends (decision 4). Remove them when the minimum supported
  fluxghost has the new commands.

**First-unit findings (one `fbm2`, 2026-11-17, exploratory).** Raw photos at exposures 50 to
2000, one ChArUco capture per side, clean white paper, lid closed. Mark identities were
assigned by eye, so this checks the guards given a correct association, not the association
itself (decision 2). Not yet fixtures.

| Finding | Value |
|---|---|
| Marks found per exposure (of 16), raw detector | 50: 9 · 75: 13 · 100: 13 · 150: 14 · 200: 13 · 320: 10 · 500: 9 · 800: 5 · 1200: 3 · 2000: 1 |
| Smallest covering bracket | 75 + 200 (union 16 of 16) |
| Stray blobs per exposure | 2 to 4 up to exposure 150, 8 to 15 above |
| Local normalisation | Same marks, 13 to 59 strays per photo. Dropped (§7.2) |
| Homography residual of the 16 marks | RMS 0.46 mm, max 0.92 mm (3.5 / 6.0 px) |
| Nearest stray to any grid position | 35.9 mm; 11 of 12 strays fall outside the work area |
| Centroid drift of one mark across exposures | ≤ 0.4 px |
| Region pose reprojection (4 marks each) | ≤ 2.0 px; all 16 on one pose: RMS 4.3 px |
| Preview with the resulting parameters | Uniform offset of about 1 mm, removed by aligning one mark. Cause: photos taken with released motors (gantry invariant, §7.1), not the calibration |

Consequences: the stray gate has a margin of roughly 40× on this unit, so R_MAX can sit anywhere
in the low millimetres; today's fixed 350 / 100 are not the best pair (350 loses the bottom
row); sweeps on further units can stop at 500 and sample 50–300 more densely.

**Second-unit findings (one `fbb2` wide-angle camera, `/dev/video2`, 2026-11-17,
exploratory).** Raw photos at exposures 50 to 800, lid closed, clean paper; the unit's stored
`wide-angle.json` (ChArUco + two-height manual calibration) as the reference.

| Finding | Value |
|---|---|
| Marks found per exposure (of 16) | 50: 12 · 75 to 125: 16 · 150: 14 · 200: 12 · 250 to 400: 10 · 500: 8 · 800: 5 |
| Stray blobs in the usable range | 1 to 5, nearest to a grid position 64.7 mm |
| Prior-free matcher (§7.3) | All visible marks correct at every exposure up to 400 |
| Preview error of the stored calibration at h = -2.5 (sent by Beam Studio) | mean 1.08 mm top half, 0.53 mm bottom half, max 2.79 mm at the top sides |
| Preview error after refining focal + distortion from the marks (decision 8), poses at z = -h | mean 0.17 mm top half, 0.39 mm bottom half, max 0.51 mm |
| Same refined values with the marks at z = 0 instead of z = -h | mean 2.60 / 4.61 mm (1.6% scale error, §7.1) |
| Region camera positions | stored: heights 120 to 150 mm across the nine regions; refined: 110 to 114 mm |
| Visual check in Beam Studio | refined preview judged better than the stored ChArUco calibration |

All preview errors above were measured with fluxghost's own warp on the capture photo, at the
16 mark positions only. Mark identities in the parameter file came from the hand assignment;
the matcher reproduces it exactly on this photo. The top corners of the work area are outside
the mark grid and unconstrained (decision 9).

**Third-unit findings (second `fbm2`, 2026-11-18, exploratory).** Raw photos at exposures 50
to 500, locked motors, lid closed; the unit's own manual calibration from the same day as the
reference; `k` / `d` borrowed from the first `fbm2`.

| Finding | Value |
|---|---|
| Marks found per exposure (of 16) | 50: 14 · 75: 16 · 100: 14 · 150: 11 · 200: 8 · 350: 7 · 500: 7 |
| Matcher with own vs borrowed `k` / `d` for undistortion | Same assignment at every exposure that shows all 16 |
| Principal point, own vs borrowed | (2799, 2076) vs (2837, 2140) |
| Single pose, no refine, fit / leave-one-out mean / max | own 0.65 / 0.83 / 1.92 mm · borrowed 0.71 / 0.87 / 1.54 mm |
| Refine focal + distortion from the borrowed values | fit 0.50 mm, leave-one-out 1.36 mm mean, 9.02 mm max, focal 1339 → 1593 |
| Preview error at the 16 marks, fluxghost warp, manual calibration | mean 0.42 mm, max 1.39 mm (bottom left; bottom two rows carry the error) |
| Preview error at the 16 marks, borrowed `k` / `d` + automatic marks | mean 0.13 mm, max 0.42 mm |
| Visual check in Beam Studio | borrowed version at least as good; bottom-left quadrant better than the hand-dragged one |

Both parameter sets were solved from the same 16 marks, so the last three rows compare hand
placement plus own intrinsics against automatic centroids plus borrowed intrinsics, at the
solve points only. Not explained: refining the principal point alone with focal length and
distortion fixed gave a 5 to 8 mm fit, which looks like a flag interaction rather than data.

**Cross-unit test without photos (two `fbm2`, 2026-11-18).** Truth = one unit's stored `k`,
`d` and global pose; marks synthesised from it; region poses solved with the other unit's
`k` / `d` and fluxghost's region pick; error over the bed on a 10 mm grid (925 points).

| Truth unit | Whole bed mean / max | Inside the mark grid mean / max | Border mean / max |
|---|---|---|---|
| first `fbm2` | 0.38 / 1.11 mm | 0.32 / 0.80 mm | 0.48 / 1.11 mm |
| second `fbm2` | 0.18 / 1.11 mm | 0.14 / 0.35 mm | 0.25 / 1.11 mm |

This measures the difference between two stored parameter sets, each with its own error, not
absolute accuracy. It assumes one physical camera pose per unit.

**Candidate `k` / `d` scored on the second `fbm2`'s marks (2026-11-18).** Poses only, one
pose for all 16 marks, no refine.

| `k` / `d` from | Fit | Leave-one-out mean / max |
|---|---|---|
| the unit itself, ChArUco with `CALIB_FIX_SKEW` | 0.54 mm | 0.67 / 1.34 mm |
| the unit itself, ChArUco before the flag (skew -7.13) | 0.65 mm | 0.83 / 1.92 mm |
| `fbb2` laser head | 0.64 mm | 0.78 / 1.95 mm |
| first `fbm2` | 0.71 mm | 0.87 / 1.54 mm |
| `fhx2rf` laser head | 0.72 mm | 0.88 / 1.66 mm |
| `fbb2` wide-angle (stored calibration) | 3.25 mm | 4.35 / 10.71 mm |

One unit's marks, one sample per candidate. The marks took no part in any of the ChArUco
runs, so the first two rows are an independent check of the flag. End to end on the same
unit and the same engraved marks, the hand-placed calibration went from 0.42 mm mean /
1.39 mm max (morning, skew -7.13) to 0.21 / 0.47 mm (new `k` / `d`, points placed again);
automatic marks with the first `fbm2`'s `k` / `d` gave 0.13 / 0.42 mm on the same photo.

**Stored intrinsics of the office units (2026-11-18).** Read from
`/var/static_data/fisheye/` on each machine. The fisheye cameras are meant to share one lens.

| Unit and camera | `fx` / `fy` | `cx` / `cy` | Skew `k[0][1]` |
|---|---|---|---|
| first `fbm2` | 1339 / 1362 | 2837 / 2140 | +0.06 |
| second `fbm2` | 1357 / 1382 | 2799 / 2076 | -7.13 |
| `fbb2` laser head (another unit) | 1339 / 1338 | 2820 / 2124 | -0.38 |
| `fbb2` wide-angle | 1349 / 1434 | 2831 / 2099 | -3.67 |
| `fhx2rf` laser head | 1308 / 1321 | 2840 / 2147 | +4.41 |
| `fhx2rf` wide-angle (pinhole model, for contrast) | 1178 / 1175 | 1620 / 1190 | 0 |

- The five fisheye cameras agree within 4 % on focal length and within 41 / 71 px on the
  principal point, across three models. One `k` / `d` for all of them, not one per model, is
  worth testing (decision 8).
- **Skew.** The ChArUco step fits a skew term that nothing downstream uses. It ranges from
  -7.1 to +4.4 with no pattern, and it is large where `fx` and `fy` also disagree, which reads
  as a calibration that did not settle rather than a lens property. The pinhole path never
  fits one. With a non-zero skew fluxghost's `solve_pnp` was not the inverse of
  `project_points` (about 0.3 mm mean, 0.9 mm max over the bed on the second `fbm2`, with the
  unit's own parameters). Fixed in fluxghost 2.5.8 (#127: solve in normalised coordinates,
  `CALIB_FIX_SKEW` in the ChArUco step), verified on the second `fbm2` with a new ChArUco run
  (table above). A shared
  `k` ships with skew 0, and "`fx` close to `fy`, skew close to 0" is a usable filter when
  picking which calibrations to derive it from.

**Implementation results on hardware (three `fbm2`, 2026-11-19).** The shipped flow, each
unit's own `k` / `d`, clean paper, lid closed.

| Unit | Camera module | Exposures | Matched (filled) | RMS |
|---|---|---|---|---|
| first `fbm2` | `GP_Flip_Mirror` | 2 | 16 (0) | 0.449 mm |
| second `fbm2` | `GP_Flip_Mirror` | 2 | 16 (0) | 0.468 mm |
| third `fbm2`, 0.3 mm marks | `USB 2.0 Camera` | 2 | 16 (2) | 0.382 mm |
| third `fbm2`, 0.5 mm marks | `USB 2.0 Camera` | 2 | 16 (0) | not recorded |
| third `fbm2`, 0.5 mm marks, strong reflection on the bottom rows (2026-11-24) | `USB 2.0 Camera` | 7 | 16 (1) | 0.344 mm |

**The first photo after an exposure change (found 2026-11-24).** In the rows above the camera
did not shoot the exposures it was set to. On `fbm2`, the first photo after `setExposure`
still has the previous exposure whenever the camera sat idle before the change (the detection
of the previous photo, 1.5 to 2 s): seen on 7 of 7 changes, with the old brightness arriving
up to 1.0 s after the change; the second photo has the new one. Photos taken back to back
with no pause do not show it, so a fixed wait is not a known cure. The first round therefore
shot the camera's own exposure and 75 instead of `[75, 200]`, and 800 was never shot.
`autoLocateMarks` now drops one photo after every change (0.4 to 0.7 s each). Same unit, same
sheet, before and after: 13 then 14 of 16 after the first round, 2 then 1 weak fills after all
seven. That unit under that light is bright: 50 and 75 carry the bottom rows (one mark shows
only at 50, the camera's minimum, as a weak candidate), 200 loses half of them, 350 and up
add nothing. The rounds are kept: they come from v4l2 sweeps, which set the real exposure, on
three units. Not measured on the `fbb2` / `fhx2rf` / `ado1` cameras; the dropped photo is
harmless there. The laser-head results in T16 were shot at the cameras' own exposure (252 on
`fbb2`), not at 250.

- **Covered marks (second unit, a board over two marks).** First implementation: 15 of 16
  with RMS 3.5 mm, a blob on the board 7 mm from a covered mark taken as that mark; with
  seven exposures merged, 11 of 16 at 4.2 mm, a lattice shifted by one row. Both are
  rejected anyway, but the count shown to the user was wrong. Fixed by the tight stage and 16
  neighbours per seed: 14 of 16, RMS 0.37 mm, `NOT_ENOUGH_MARKS`, in both rounds.
- **Third unit.** Another camera module (exposure range 1 to 5000 instead of 50 to 10000,
  focal length 1394 against 1331 to 1357). Lens flare from the light panel leaves the two
  bottom-left marks at about a tenth of the usual contrast at every exposure from 5 to 1200,
  so no exposure recovers them; covering the panel helps partly. They are 3.6 and 5.2 px
  across. Found by the weak fill, and aligned on CHECK_PNP. This unit's photos with the other
  two units' `k` / `d` fit to 0.57 to 0.64 mm against 0.37 to 0.38 mm with its own: the first
  real cross-module number, and the reason shared values would be keyed by module.

**8-mark layouts, offline (2026-11-19).** One photo per unit from the manual flow, the unit's
own `k` / `d`, matched by the committed code. The sheets were reused `fbm2` calibration sheets,
so every photo carries old marks of the same look.

| Unit | Blobs | Matched | RMS | Mark size | Notes |
|---|---|---|---|---|---|
| `fbb2` laser head | 16 | 8 of 8 | 0.031 mm | 7.5 to 12.3 px | 8 old marks in a row through the pattern; half the sheet in shadow |
| `fhx2rf` laser head | 12 | 8 of 8 | 0.10 mm | 8.5 to 12.5 px | oblique view; stored `k` still has skew 4.41 |
| `ado1`, first height | 40 | 8 of 8 | 0.042 mm | 4.7 to 6.5 px | whole chassis in view |
| `ado1`, second height | 39 | 8 of 8 | 0.050 mm | 4.7 to 6.5 px | one mark on the stroke of an engraved letter, still found |
| Promark, 220 mm lens, used sheet | 54 | 0 of 8 | n/a | 2.3 to 2.5 px, bright | dark detector finds no mark |
| Promark, same unit, plain black sheet | 48 | 0 of 8 | n/a | 2.5 to 3.2 px, bright | dark detector finds no mark |

- With any one mark hidden, every case returns 7 marks and `NOT_ENOUGH_MARKS`; no old mark is
  ever taken for a missing one. Two faults found on the way and fixed: an old mark 14 mm from
  a missing one dragged the loose fit until a real mark lost its place (now a RANSAC start for
  the tight stage), and the self-similar six-mark fit above.
- The points confirmed by hand in the manual flow are within 0.5 px of the automatic ones,
  but they are snapped to the same detector, so they confirm the choice of blobs, not the
  position accuracy.
- The upright assumption holds on all four machines, including this Promark.
- Promark, bright-blob detector (not in the code): at the normal minimum area of 15 px it
  finds no mark on either sheet. At 4 px it finds 7 of 8 on the used sheet (85 blobs); on
  the plain sheet 8 of 8 in one photo (90 blobs, matched 8 of 8, RMS 0.265 mm, within 1.7 px
  of the hand-placed points) and 7 of 8 in a second photo of the same engraving 30 s later.
  The image has 2.4 px per mm, so the residual is about 0.6 px: the size of the marks, not a
  wrong match. A cleaner sheet removes strays but not the cause; the marks are too small.

Still to measure: A6 manual vs automatic accuracy on check marks, A8 spread, capture time, the
number of field units R_MAX blocks.

---

## 12. Test plan

| Item | Covers | How |
|---|---|---|
| T1 | A1, A7 | Hardware, `fbm2`, basic mode. Passed on three units (§11) |
| T2 | A2 | Hardware, advanced mode, tilted ChArUco captures |
| T3 | A3 | Hardware: Skip on blank paper; paper removed; paper shifted. Covered-marks variant passed on one unit (§11) |
| T4 | A4 | Hardware: printed dots, lights off, lights on |
| T5 | A5 | Hardware: open the door during capture |
| T6 | A6 | Hardware: photo of the marks, warped with fluxghost's preview code at the sent `h`, manual vs automatic on the same unit; plus a visual check in Beam Studio |
| T7 | A8 | Hardware: five runs, compare poses |
| T8 | §7.2, §7.3 | fluxghost `tests/usage/test_auto_pnp.py` (22 tests): `fbm2` exposures, covered marks, faint marks, the 8-mark photos, the websocket commands. Passing |
| T9 | §6 | `ws_smoke.py` ends `ALL PASS`; `test_camera_match_points.py` unchanged and passing; manual calibration on `fbb2` or `fhx2rf` still works |
| T10 | §6 | Print and Cut mark detection (`detect_blobs`) unchanged on one alignment run |
| T11 | Edge cases table | `common/autoLocateMarks.spec.ts`: rounds, failure reasons, high residual with and without points, exposure and auto exposure restored in order, a thrown error. Passing. The dialog branches are covered by `Beamo2Calibration.spec.tsx`, `LaserHeadFisheyeCalibration.spec.tsx` and `AdorCalibration/AdorCalibration.spec.tsx` (9 + 9 + 8 tests): fallback to the manual steps on `UNSUPPORTED`, missing marks, both sides of the high-residual warning in basic and advanced mode, a thrown error, Back from the next step, and for `fbm2` the release and status refresh before PUT_PAPER runs again. Not covered: closing the dialog during capture, the launchers (`key`, `replaceOpenDialog`) |
| T13 | A10 | Hardware, `fbm2`, `R_MAX_MM` lowered: the warning in basic mode. The switch to advanced mode passed on one unit (2026-11-20, after the remount fix); Continue Anyway and the advanced-mode variant have no recorded result |
| T14 | A11 | Hardware, `fbm2`: Back from CHECK_PNP then Skip, basic and advanced. The stuck spinner and the lost ChArUco result are fixed; the last change (status refresh in `releaseMachine`) not confirmed yet |
| T16 | A12 | Hardware, laser-head camera. `fbb2`: 8 of 8 from one photo at 250, rms 0.046 mm. `fhx2rf`: 8 of 8 at 250 with auto exposure on, rms 0.105 mm; the two lower inner marks sit about 0.2 mm (3 px) off in CHECK_PNP, which matches the per-mark residual and was accepted. Covered mark and Back not recorded |
| T17 | A13, A14 | Hardware, `ado1`, on a sheet carrying an old `fbb2` pattern: first run saved a wrong pose for the lower height (the old pattern, rms 0.05 mm); after the proportion check both heights match the new marks (0.071 and 0.055 mm offline on the same photos) and the preview is right |
| T18 | §7.3.1 | `common/autoLocateMarks.spec.ts` (12 tests) and `beamo2Calibration/autoSolvePnP.spec.ts` (4 tests). Passing. fluxghost `test_auto_pnp.py` now 22 tests, including the `ado1` photo of T17 |
| T15 | Edge cases table | Hardware, `fbm2`, auto exposure on: 16 marks found, auto exposure on again afterwards. Passed on one unit (2026-11-20) |
| T12 | A9 | Beam Studio against a fluxghost built before #128: manual steps appear; against the new one with a forced failure: they do not. Not run on hardware. `helpers/api/camera-calibration.spec.ts` (6 tests) covers the reply an old backend really sends |
