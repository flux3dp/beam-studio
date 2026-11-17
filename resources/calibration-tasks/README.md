# Camera calibration task sources

Source `.beam` files of the camera calibration tasks in
`packages/core/src/web/assets/fcode/`. Each file is named after the `.fc` it exports to. They are
kept here as the version-controlled source of truth and are **not** bundled into the app; the app
only ships the exported `.fc`.

| Source | Exports to | Used by |
|---|---|---|
| `bm2-calibration.beam` | `bm2-calibration.fc` | Beamo II (`fbm2`) camera calibration, `doBeamo2Calibration` |
| `bb2-calibration-wide-angle.beam` | `bb2-calibration-wide-angle.fc` | Beambox II wide-angle camera, `doBB2Calibration('wide-angle')` |
| `hx2-calibration-wide-angle.beam` | `hx2-calibration-wide-angle.fc` | HEXA RF wide-angle camera, `doHexa2Calibration('wide-angle')` |

## Notes

- The A–D labels are single-line strokes (not filled font outlines) so that a weak engraving
  stays readable on paper. The closed parts carry small tabs (0.5 mm) so each letter is not
  traced as a closed shape.
- Air assist is 0% on purpose: the tasks engrave on paper, which air assist would lift. Do not add
  `IGNORE_AIR_ASSIST_WARNING` to the exported `.fc`; `deviceMaster.doCalibration` adds it to the
  FILE metadata when the task is sent (`helpers/fcode/addFcodeMetadata.ts`).
- After exporting, copy the `.fc` to `packages/core/src/web/assets/fcode/` and check its FILE json
  (e.g. `FORBIDDEN_HEADTYPE`) against the previous version.
