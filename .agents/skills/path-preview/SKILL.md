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
- `f` is mm/min; feeds the sim-time estimate per segment.
- `s`/`t`: Promark uses `t` as dotting time. FCode raster runs set `t = RASTER_T` (6)
  with `s` = pixel power 0-255 so PWM engraving previews as grayscale; vector records
  keep `t = 0`.

Two parsers produce this: `tmpParseGcode.js` (gcode text; Promark wobble, `$H`,
`G1S0/V0`) and `parseFcode.ts` (fcode binary; also returns the slicing extras).

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
