---
name: path-preview
description: Path Preview subsystem — the stride-9 record pipeline, WebGL task rendering, sim-time model, task-code routing (fcode vs gcode), and the "start from here" flows. Use when working on components/beambox/PathPreview/ or helpers/path-preview/.
---

# Path Preview

Location: `packages/core/src/web/app/components/beambox/PathPreview/` (component) and
`packages/core/src/web/helpers/path-preview/` (WebGL draw commands). The renderer core
(`tmpParseGcode.ts`, `draw-commands/`) derives from Todd Fleming's LaserWeb (AGPL) —
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
- `e`: the **dwell** in minutes — time the beam spends on this record with nothing moving.
  Only a dot sets it: a Promark inner engraving dot (parseGcode, below) or a galvo dot
  (parseFcode). `GcodePreview` costs such a record `tc = dwell`, counts it even though its
  `f` is NaN, and adds no distance for it. 0 everywhere else. (The feedrate backfill for
  the records before the first `F` writes slot 5, not this slot.)
- `a`: parseFcode leaves it NaN until the task moves the A axis (fluxclient NAN=absent);
  parseGcode leaves it 0. Rotary/auto-feeder tasks carry y in rotary space
  (`y' = axisY + (y - axisY) * ratio`, on A for fcode v2, on Y itself after the cmd-6
  pause on v1). `setParsedGcode` takes `rotary = { axisY, ratio, scaledYFrom }` (built in
  `updateFcode` from `getSpinningAxis`, job-origin relative) and stores in the draw array's
  a slot the offset from the machine y to the design y, so the shader's `y + a` matches the
  canvas while slot 2 keeps machine y for start-here slicing. Promark keeps its own
  `y - a / rotaryRatio` fold.
- `f` is mm/min; feeds the sim-time estimate per segment.
- `s`/`t`: Promark uses `t` as dotting time. FCode raster runs set `t = RASTER_T` (6)
  with `s` = pixel power 0-255 so PWM engraving previews as grayscale; vector records
  keep `t = 0`.

Two parsers produce this: `tmpParseGcode.ts` (gcode text; Promark wobble, `$H`,
`G1S0/V0`) and `parseFcode.ts` (fcode binary; also returns the slicing extras).

**Promark inner engraving dots** (`;CONFIG INNER_ENGRAVING=1` in the gcode header, written by
Swiftray for a 3D document): while the dotting time `T` is set, every laser-on move is one dot
fired on arrival, not a line. Swiftray writes the same gcode for the preview and the job (no
mock dots), so parseGcode draws them: per dot a travel record to half a pitch before the dot
(g=0 on arrival → the jump between dots shows as red traversal) and a feedrate-less mark
(g=1, f=NaN) one pitch wide that carries `T` in µs as its dwell. The pitch is the layer's point
spacing, which the gcode does not carry: it is taken as the smallest gap between consecutive dots
seen so far (within 0.005–0.1 mm), starting from the 0.03 mm default. 2D Promark gcode (no flag) is
parsed as before: a laser-on move with `T` set is a line whose dots are costed along it.

## Task code routing (`updateTaskCode`)

- **Promark** (`promarkModels`) → `updateGcodeText`: Swiftray gcode text, variable-text
  tasks merged by string concat (VT is Promark-only, see `isVariableTextSupported`).
- **Everything else** → `updateFcode`: one `exportFuncs.getFcode()` call (single
  fluxghost/Swiftray conversion — no gcode generated), parsed by `parseFcode`, and the
  parse result cached as `this.fcodeTask` for start-here slicing. `gcodeString` stays
  empty on this path and is fetched lazily only if the gcode fallback is ever needed.

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
  the sliced task. Falls back to the gcode flow if slicing returns null.
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
