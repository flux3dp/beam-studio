# PRD: Automatic solve-PnP for fisheye camera calibration

| | |
|---|---|
| **Status** | Draft. No product code yet. Step 0 done on two `fbm2` units and one `fbb2` wide-angle camera (§11); prior-free matcher prototyped (§7.3, decision 2 settled); on `fbm2` another unit's `k` / `d` works without ChArUco (decision 8); more units pending |
| **Author** | Beam Studio team |
| **Created** | 2026-11-16 |
| **Target product** | Beam Studio (desktop + web), fluxghost (next tag after 2.5.8) |
| **Owner area** | Camera calibration dialogs, fluxghost camera calibration API |
| **Related code** | Dialog: `packages/core/src/web/app/components/dialogs/camera/beamo2Calibration/Beamo2Calibration.tsx`, `camera/common/SolvePnP.tsx`, `camera/common/useCamera.ts`, `camera/common/ProcessingDialog.tsx`, `camera/common/CheckPnP.tsx`; API client: `packages/core/src/web/helpers/api/camera-calibration.ts`; constants: `packages/core/src/web/app/constants/fisheyeCameraConstants.ts` (`bm2PnPPoints`, `getRegionalPoints`); exposure: `packages/core/src/web/helpers/device/camera/cameraExposure.ts`; engraving task: `packages/core/src/web/helpers/device-master.ts` (`doBeamo2Calibration`, `fcode/bm2-calibration.fc`) |
| **External repos** | fluxghost: `fluxghost/api/camera_calibration.py`, `fluxghost/utils/camera/corner_detection/find_corners.py`, `corner_detection/match_points.py`, `utils/camera/solve_pnp.py`, `docs/api/camera-calibration.md`, `tests/usage/test_camera_match_points.py`, `tools/ws_smoke.py` |

---

## 1. Summary

Fisheye camera calibration ends with a solve-PnP step: the machine engraves marks at known laser
coordinates, the camera photographs them, and the image position of every mark is paired with its
laser coordinate to compute the camera pose (`rvec`, `tvec`). Today the pairing is
semi-automatic. fluxghost proposes mark positions and the user confirms or drags each one. On
beamo II (`fbm2`) that is four dialogs of four marks each.

This PRD makes the pairing fully automatic on beamo II first: one engraving, a few photos at
different exposures, no user interaction between "Start Engrave" and the final check. There is
no manual-drag fallback. The outcome is either a solved calibration or a failure with a stated
reason and a retry.

Three design choices drive the rest:

1. **Use the redundancy the engraving already has.** `fcode/bm2-calibration.fc` engraves 16
   marks in a 4×4 grid. The manual flow consumes them four at a time. Matching all 16 against one
   planar model leaves 8 or more spare points, which is what makes outlier rejection possible. No
   new engraving pattern is needed.
2. **Guard in bed coordinates, not in image pixels.** Camera mounting varies per unit, so a
   pixel region of interest cannot be tight and always includes parts of the enclosure. The
   guards are the reprojection residual against the planar model and the bed position of each
   blob. Both are independent of the mounting angle.
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

- G1. On `fbm2`, the user does nothing between starting the engraving and the final check
  screen.
- G2. No manual point dragging anywhere in the automatic flow. Failure is a message plus retry.
  The manual steps remain only for a backend without the new commands (decision 4).
- G3. A wrong calibration is never accepted silently: acceptance needs measured residuals under
  a threshold.
- G4. Works across units without per-unit pixel constants.
- G5. The matching and gating logic is testable offline from saved photos.

**Non-goals**

- Changing the intrinsic calibration (ChArUco) step.
- Changing the engraved pattern or generating the task at run time (decision 3).
- Other machines in the first release (see §9 and open decision 1).
- Removing the `SolvePnP` component. Other dialogs keep using it.
- Automatic exposure search. A fixed bracket per model is enough.

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

**A7 Diagnosability.** On success and on failure, the console has one summary line per run:
exposures used, blobs found per exposure, marks matched, rejected count, RMS residual per
region. With fluxghost debug images enabled, the annotated photo is written like today
(`debug_imwrite`).

**A8 Repeatability.** Run A1 five times on one unit without moving the paper. Result: the nine
region poses agree run to run within a tolerance fixed during step 0 (§9).

**A9 (S6) Old backend.** Connect to a fluxghost without `auto_pnp_detect` (2.5.8 or older) and
run A1. Result: after the engraving, SOLVE_PNP_INSTRUCTION and the four manual SOLVE_PNP_xx
screens appear and behave as on main. With a backend that has the commands, force a match
failure (A3): the drag screen must not appear.

Edge cases and expected behaviour:

| Case | Expected |
|---|---|
| One mark hidden or burnt through | Fails with `NOT_ENOUGH_MARKS`, the missing mark is listed (open decision 5) |
| Marks found at only one exposure | Solve proceeds on the union; fails by mark count if not enough |
| Camera returns a frame error | Existing `useCamera` retry (2 attempts), then failure alert |
| User closes the dialog during capture | Capture stops, machine released (`releaseMachine`), nothing saved |
| Exposure cannot be set | Failure alert, exposure restored to its previous value |

---

## 6. Must not change

| Touched file | Caller — behaviour that must stay |
|---|---|
| `helpers/api/camera-calibration.ts` (methods added) | `SolvePnP.tsx` — `solvePnPFindCorners` / `solvePnPCalculate` requests and responses unchanged |
| | `Beamo2Calibration.tsx`, `WideAngleCamera/index.tsx` (SOLVE_OTHER_PNP) — `solvePnPCalculate` result shape unchanged (a new `rms` field is additive) |
| `Beamo2Calibration.tsx` (solve steps replaced) | PRE_CHESSBOARD, CHESSBOARD, PUT_PAPER, SOLVE_OTHER_PNP, CHECK_PNP and the saved V4 parameter shape unchanged |
| | `releaseMachine` on unmount and `DoorChecker` usage unchanged |
| `fisheyeCameraConstants.ts` (read only, or a bracket table added) | `bm2PnPPoints`, `getRegionalPoints` — values and order unchanged, they define the saved region poses |
| fluxghost `find_corners.py` (read only: the dark-blob filter is the existing `filterByColor` / `blobColor` arguments) | `camera_calibration.py:306,310` (manual find-corners) and `opencv.py:78` (`detect_blobs`, Print and Cut mark detection) — untouched |
| fluxghost `camera_calibration.py` (commands added, `solve_pnp_calculate` returns `rms`) | `solve_pnp_find_corners`, `solve_pnp_calculate` — command strings, arguments, existing response keys and the silent projected-point fallback unchanged |
| | `tools/ws_smoke.py` — still ends `ALL PASS` |
| `packages/core/src/web/app/lang/*.ts` (keys added) | No existing key renamed or removed |

Not touched: `SolvePnP.tsx`, `LaserHeadFisheyeCalibration.tsx`, `WideAngleCamera/`,
`AdorCalibration/`, `PromarkCalibration.tsx`, `device-master.ts`, `fcode/bm2-calibration.fc`,
`match_points.py` (`match_projected_points` keeps its signature; the new matcher is a new
function).

---

## 7. Design

### 7.1 Flow

SOLVE_PNP_INSTRUCTION and the four SOLVE_PNP_xx steps collapse into one AUTO_SOLVE_PNP step
built on `ProcessingDialog`:

1. Door check and `moveLaserHead` as SOLVE_PNP_INSTRUCTION does today.
2. For each exposure in the model's bracket: set exposure, take a photo, send it to
   `auto_pnp_detect`, keep the returned blob list.
3. Send all blob lists and the 16 reference points to `auto_pnp_match`.
4. On acceptance, write the 16 image points into `imgPoints1` grouped by quadrant exactly as the
   manual steps do, call `solvePnPCalculate` for the four quadrants, then continue to the
   unchanged SOLVE_OTHER_PNP and CHECK_PNP.
5. On rejection, show the reason and return to PUT_PAPER.

The exposure is restored in a `finally` block.

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
1.6% (§11).

### 7.2 Blob detection (`auto_pnp_detect`)

- Detection runs on the raw frame. No image remap: only the blob centres are undistorted
  (`cv2.fisheye.undistortPoints` with the frame padding applied), which is all the matcher
  needs.
- `find_blob_centers` with today's parameters, restricted to dark blobs. No local contrast
  normalisation: on the first unit it found the same marks and several times more stray blobs
  (§11). `SimpleBlobDetector` already sweeps thresholds 10–200, so the brightness gradient
  inside a photo is not what hides marks; over- and under-exposure are, and only another
  exposure recovers those.
- No interest-area crop. The whole frame is searched; filtering happens in §7.3.
- Returns blob centres with their size and a contrast figure (background minus blob
  brightness, with the background not saturated).

Bracketing covers the gradient between photos. Blobs from different exposures closer than a few
pixels are the same mark. Keep the one from the exposure where it has the best contrast, not
the first one seen: a mark is detectable over a wide exposure range (16× on the first unit) but
its edge is clean only in the middle of that range.

### 7.3 Matching and gating (`auto_pnp_match`)

The bed is a plane, so undistorted image points and bed coordinates are related by one
homography. That model needs no pose prior and no pixel constants.

1. **Coarse association, prior-free.** Undistort the blob centres with `k`, `d`. Every
   hypothesis is one grid cell: a blob, its right and lower neighbours among its nearest eight,
   and the blob closest to the fourth corner of the parallelogram they span. Four points give a
   homography from that cell's bed corners, for each cell position of the grid. Four points
   rather than a three-point affine seed, because the lid camera's perspective is strong (the
   top row of the `fbb2` grid is twice as wide as the bottom row after undistortion) and an
   affine seed extrapolates onto wrong blobs and never recovers. No per-model pixel constants,
   no pose prior.
2. **Fit and re-associate.** Map every blob onto the bed through the hypothesis, give each
   grid position its nearest blob within 15 mm (each blob used once), refit the homography on
   the assigned pairs, repeat until the assignment is stable. Keep the hypothesis with the most
   marks, then the lowest residual. **Upright check**: at the grid centre, bed +x must run
   mostly along image +x and bed +y along image +y, on every hypothesis and on the final
   model. A grid can be similar to its own transpose (`fbb2` wide-angle spacings 120 / 180 /
   120 and 80 / 120 / 80 mm), and without the check the 90° rotated assignment fit the
   `fbb2` photos better than the true one. The only physical assumption is that a model's
   image is not mirrored or rotated by 90°, a per-model constant if that ever changes.
3. **Bed-coordinate filter.** Map every blob back to the bed through the fitted homography.
   Blobs outside the work area, or further than a tolerance from every reference point, are
   rejected. This is the per-unit, non-rectangular region of interest, derived instead of
   hard-coded.
4. **Gates**, all required:
   - all 16 marks matched (each region pose needs its four marks; open decision 5),
   - RMS residual to the homography ≤ R_MAX,
   - the pose of each quadrant from `solve_pnp_calculate` is physically sane: camera above the
     bed, height within a wide per-model range. This range is loose on purpose because mounting
     varies; it only catches gross failures.
5. **Cross-check.** Each quadrant's `solve_pnp_calculate` returns an RMS reprojection error
   (per-point distance, replacing the cancelling mean at `camera_calibration.py:400` in the log
   and added to the response).

Prototype result (`fbm2` and `fbb2` units, every exposure): every mark visible in a photo was
assigned correctly, 0.1 to 1.4 s per run in Python. It only went wrong on photos with 9 or fewer
visible marks, which the all-16 gate rejects anyway.

R_MAX, tolerances and the pose range are tuned on the step 0 photo set and recorded in
§11. The single-homography residual is expected to be non-zero even for correct matches (that
inaccuracy is why the V4 format has per-region poses), so R_MAX is a stray-blob gate, not an
accuracy gate. Accuracy is A6, measured through fluxghost's own preview warp (§12 T6), never a
separately written projection: one convention difference (§7.1 height) made a hand-written
check report the opposite of what the preview showed.

### 7.4 Failure handling

No drag screen. Reasons returned by `auto_pnp_match` map to messages:

| Reason | Message points the user to |
|---|---|
| `NOT_ENOUGH_MARKS` | Check the paper covers the area and the marks are visible, engrave again |
| `AMBIGUOUS` / `HIGH_RESIDUAL` | Remove other objects from the bed, close the lid, engrave again on fresh paper |
| `BAD_POSE` | Restart calibration (advanced) |

Every failure returns to PUT_PAPER. Retrying re-runs the same task file.

### 7.5 i18n

New keys under `calibration.*` for the progress text and the three failure messages, in `en.ts`
and `zh-tw.ts` first, the other languages before the PR. `solve_pnp_step1..3` stay; other
dialogs use them.

---

## 8. Data contracts

Both commands live on the existing `camera-calibration` websocket and need `k` / `d` loaded
(`update_data`), else the existing `NO_DATA` failure.

```
→ auto_pnp_detect <file_length>
← {"status": "continue"}            → binary upload
← {"status": "ok", "blobs": [[x, y, size, contrast], ...]}   // undistorted px

→ auto_pnp_match <args_json>
   args: { "ref_points": [[x, y], ...],          // mm, bed coordinates
           "blobs": [[[x, y, size, contrast], ...], ...],  // one list per exposure
           "workarea": [width, height],          // mm
           "prior_points": [[x, y], ...] | null } // undistorted px, optional seed
← {"status": "ok",
   "points": [[x, y] | null, ...],               // per ref point, undistorted px
   "residuals": [number | null, ...],
   "rms": number, "matched": number, "rejected": number}
← {"status": "fail", "reason": "NOT_ENOUGH_MARKS" | "AMBIGUOUS" | "HIGH_RESIDUAL",
   "matched": number, "rms": number | null}

→ solve_pnp_calculate ...            // unchanged request
← {"status": "ok", "rvec": ..., "tvec": ..., "rms": number}   // rms is new
```

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
   conditions. Decisions 2, 5 and 7 are made from this set. Report, per mark position and per
   exposure, the detection rate; the bracket is the smallest
   set of exposures that covers every mark on every unit. Units available: several `fbm2`; one
   each of `fbb2`, `fhx2rf` and `ado1`.
1. fluxghost: `auto_pnp_detect`, `auto_pnp_match`, `rms` in `solve_pnp_calculate`, fixture
   tests, `docs/api/camera-calibration.md`, `ws_smoke.py` entries. Tag.
2. beam-studio: API client methods, AUTO_SOLVE_PNP step in `Beamo2Calibration.tsx`, bracket
   table, i18n, CD bump, `camera-calibration` skill update.
3. Hardware pass (§12), thresholds recorded in §11.
4. Follow-up PRs per machine (open decision 1).

---

## 10. Open decisions

1. ~~**Machine order after `fbm2`.**~~ **Settled 2026-11-16:** wide-angle camera on `fbb2` /
   `fhx2rf` next (same 4×4 quadrant layout, `bb2WideAngleCameraPnpPoints` /
   `hx2WideAngleCameraPnpPoints`, two heights), then laser-head fisheye and Ador (8 marks,
   single region), Promark last.
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
5. **A mark that is not found.** Every region pose is solved from exactly four marks
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
7. **Exposure bracket values.** `fbm2` first unit: 75 + 200 covers all 16 marks, today's
   350 / 100 do not. `fbm2` second unit: 75 alone covers all 16, 200 finds 8, 350 finds 7, so
   the pair differs between units and the low value carries most of it. `fbb2` wide-angle
   first unit: any single exposure from 75 to 125 covers all 16. Final values from the
   remaining units of step 0.
8. **Refine the intrinsics from the marks.** Proposed: after matching, refine the intrinsics
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
     Proposal for `fbm2`: ship a per-model `k` / `d` (skew 0, see §11), solve poses only, no
     refine, ChArUco stays as the advanced path. Before settling: a third unit, and check
     marks that are not used for the solve (A6). `fbb2` keeps the refine as an open option until photos at a second
     height show whether its result holds off the plane.
9. **Marks near the corners.** Proposed experiment on `fbb2`: engrave one row of marks at
   y ≈ 10 to 20 mm to find the camera's real top field of view (the model puts the top corners
   outside the frame), and larger marks at the bottom corners (2.3 to 2.7 px per mm there
   against 5.8 in the centre, so a centre-size mark falls under the detector's 15 px area).
   Corner marks also bring back the exposure bracket (bottom-left needs about 200, the rest
   75 to 125).

---

## 11. Risks & follow-ups

- **Faint marks on paper** are the weak point shared by every approach. Bracketing helps; if
  step 0 shows misses, decision 3 names the way out (scene-file engraving
  with adjustable power).
- **Lattice ambiguity**: a 4×4 grid shifted by one pitch still looks like a grid when the outer
  row is hidden and stray blobs line up. The bed-coordinate filter and the all-16 rule guard this; step 0
  must include a partially covered case.
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
  unit's own parameters). Fixed in fluxghost (`fix/solve-pnp-skew`: solve in normalised
  coordinates, `CALIB_FIX_SKEW` in the ChArUco step; not yet verified on hardware). A shared
  `k` ships with skew 0, and "`fx` close to `fy`, skew close to 0" is a usable filter when
  picking which calibrations to derive it from.

Measured numbers (fill in as work lands): per-mark detection rate, R_MAX, tolerances, pose range, bracket values,
A6 manual vs automatic accuracy, A8 spread, capture time.

---

## 12. Test plan

| Item | Covers | How |
|---|---|---|
| T1 | A1, A7 | Hardware, `fbm2`, basic mode |
| T2 | A2 | Hardware, advanced mode, tilted ChArUco captures |
| T3 | A3 | Hardware: Skip on blank paper; paper removed; paper shifted |
| T4 | A4 | Hardware: printed dots, lights off, lights on |
| T5 | A5 | Hardware: open the door during capture |
| T6 | A6 | Hardware: photo of the marks, warped with fluxghost's preview code at the sent `h`, manual vs automatic on the same unit; plus a visual check in Beam Studio |
| T7 | A8 | Hardware: five runs, compare poses |
| T8 | §7.2, §7.3 | fluxghost unit tests on the step 0 fixtures: every fixture matches its ground-truth points or fails with the expected reason |
| T9 | §6 | `ws_smoke.py` ends `ALL PASS`; `test_camera_match_points.py` unchanged and passing; manual calibration on `fbb2` or `fhx2rf` still works |
| T10 | §6 | Print and Cut mark detection (`detect_blobs`) unchanged on one alignment run |
| T11 | Edge cases table | Jest spec for the AUTO_SOLVE_PNP step: failure reasons, exposure restored, close during capture |
| T12 | A9 | Beam Studio against fluxghost 2.5.8: manual steps appear; against the new tag with a forced failure: they do not |
