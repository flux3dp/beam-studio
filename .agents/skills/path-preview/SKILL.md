---
name: path-preview
description: Path Preview subsystem — the stride-9 record pipeline, WebGL task rendering, sim-time model, task-code routing (fcode vs gcode), and the "start from here" flows. Use when working on components/beambox/PathPreview/ or helpers/path-preview/.
---

# Path Preview

Location: `packages/core/src/web/app/components/beambox/PathPreview/` (component) and
`packages/core/src/web/helpers/path-preview/` (WebGL draw commands). The renderer core
(`tmpParseGcode.js`, `draw-commands/`) derives from Todd Fleming's LaserWeb (AGPL) —
keep changes to those files minimal; new logic goes in sibling TS files.

For the fcode binary format, `parseFcode.ts`, and `sliceFcode.ts` internals, see the
`fcode` skill. This skill covers how the component consumes them.

## Record pipeline

Task code → parser → stride-9 records → `GcodePreview.setParsedGcode` → interleaved
Float32Array segments → WebGL lines.

Record contract (`ParsedGcode`, a chunked array dodging V8 length limits):

```text
[g, x, y, z, e, f, a, s, t] per waypoint
```

- **Segment i is drawn from record i to record i+1 and takes `g` (0=travel, 1=cut)
  from record i+1** — the arrival record. Emitting "cut to P" means: travel record,
  then record at P with g=1.
- `y` is negated into preview space by both parsers (machine +y down → preview -y).
- `a`: parseFcode leaves it NaN until the task moves the A axis (fluxclient NAN=absent);
  parseGcode leaves it 0. Rotary/auto-feeder tasks carry y in rotary space
  (`y' = axisY + (y - axisY) * ratio`, on A for fcode v2, on Y itself after the cmd-6
  pause on v1). `setParsedGcode` takes `rotary = { axisY, ratio, scaledYFrom }` (built in
  `updateFcode` from `getSpinningAxis`, job-origin relative) and stores in the draw array's
  a slot the offset from the machine y to the design y, so the shader's `y + a` matches the
  canvas while slot 2 keeps machine y for start-here slicing. Promark keeps its own
  `y - a / rotaryRatio` fold.
- `f` is mm/min; feeds the sim-time estimate per segment.
- `s`/`t`: Promark uses `t` as dotting time — **only on the gcode path**; the
  dotting-time branch in `GcodePreview` is inside `if (isPromark)`, so an fcode `t`
  is never read that way. FCode raster runs set `t = RASTER_T` (6) with `s` = pixel
  power 0-255 so PWM engraving previews as grayscale; vector records keep `t = 0`.
- A **NaN position** makes the segments touching a record non-rasterizable, which is
  how synthetic jumps (printer swath content, galvo dots, a galvo block's return to
  the park position) are kept out of the traversal display. Two segments touch such a
  record, and **the dangerous one is the segment leaving it**, whose own feedrate is
  perfectly real: segment time is length over speed, so a NaN length yields a NaN
  time and — far worse — a NaN `lastFeedrate` that poisons every segment after it,
  taking the whole timeline, scrubber and progress bar with it. `GcodePreview` skips
  the estimate whenever the distance is NaN, which covers both sides; `pushBreak`
  additionally clears the feedrate on the break record itself. The printer path
  survived this for a while by accident, because it happened to have `f` already NaN
  on both sides.

Two parsers produce this: `tmpParseGcode.js` (gcode text; Promark wobble, `$H`,
`G1S0/V0`) and `parseFcode.ts` (fcode binary; also returns the slicing extras).

## Galvo content (HEXA II)

A galvo block moves no gantry: the head parks and the beam is deflected around it, so
`parseFcode` adds the field-local coordinate to the park position and restores the
park when the run ends. Marks become cut records, jumps travels, at the list's own
mark/jump speeds converted to mm/min.

**Dots** (`LASER_ON`) are the one shape with no path. They are drawn the way printer
swaths draw deposited pixels: the jump that placed the beam is the record that carries
the motion time, and the dot itself is a zero-sim-time run (`f = NaN`) one pitch wide
with `t = RASTER_T`, bracketed by break records. A dot has no size in the file, so the
width comes from the spacing to the previous dot in the same list — they come off a
grid — falling back to 0.1mm for the first one.

Slicing gets `galvoLists` (record-index spans) from the parser, because a galvo list
cannot be cut into: see the `fcode` skill. `sliceFcode` rewinds a cut that lands
inside one to that list's start, which re-marks at most one list where skipping would
leave a hole.

## Task code routing (`updateTaskCode`)

- **Promark** (`promarkModels`, which is `fpm1` alone) → `updateGcodeText`: Swiftray
  gcode text, variable-text tasks merged by string concat (VT is Promark-only, see
  `isVariableTextSupported`).
- **Everything else** → `updateFcode`: one `exportFuncs.getFcode()` call (single
  fluxghost/Swiftray conversion — no gcode generated), parsed by `parseFcode`, and the
  parse result cached as `this.fcodeTask` for start-here slicing. `gcodeString` stays
  empty on this path and is fetched lazily only if the gcode fallback is ever needed.
- **HEXA II (`fhx2galvo`) is in the second group, not the first.** It has a galvo like
  a Promark, but it is not a Promark model: its tasks are fcode and everything about
  its galvo content lives in `parseFcode`, never in `tmpParseGcode`. None of the
  Promark gcode handling (wobble, dotting time on `t`, the `y - a / rotaryRatio` fold)
  applies to it.

## Sim time model

- `simTimeMax` = sim minutes from `gcodePreview.g0Time + g1Time` (kinematic estimate),
  padded by half a `SIM_TIME_MINUTE`.
- `timeDisplayRatio` = `fileTimeCost / (60 * simTimeMax)` — maps sim time to the
  machine's own estimate; remaining real time = `(simTimeMax - simTime) * 60 * ratio`.
- `GcodePreview.getSimTimeInfo(simTime)` → `{ index, position, next }`: `index` is the
  record index of the current segment's **start**; `position` is the interpolated point
  in machine coords; `next` is the arrival vertex in preview coords.

## Start from here (`handleStartHere`)

- simTime at 0 (or ~max): full `exportFuncs.uploadFcode`.
- Mid-timeline, fcode path: `sliceFcode(this.fcodeTask, simTimeInfo, { previewPng,
  timeCost })` byte-splices the cached task — zero fluxghost calls; the thumbnail
  (remaining-path render) and remaining time are embedded so the machine monitor shows
  the sliced task. Falls back to the gcode flow if slicing returns null. A cut inside
  a galvo list is moved back to that list's start, and the restore position becomes
  the block's park position rather than the interpolated beam position.
- Gcode fallback / Promark: lazy-fetch gcode text, map the record index to a gcode line
  by counting `G1`s, splice preparation lines, `gcodeToFcode` via fluxghost. The
  fast-gradient branch reconstructs `F16` raster words to resume mid-line.
- **Dev export**: with `localStorage.dev = 'true'`, shift-clicking "Start here" saves
  the sliced `.fc` via a file dialog instead of uploading — no machine needed.

## Debugging

Export a real task (`.fc` or shift-click dev export), run the parsers standalone with
`npx tsx`, and validate structure/CRC with a short python script — see the fcode skill.
The preview's console logs `Parsed FCode`/`Parsed GCode` with the record array.

## Maintenance

Update this skill if the record contract, task-code routing, sim-time mapping, or the
start-here flows change. Format-level changes belong in the `fcode` skill.
