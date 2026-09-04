---
name: fcode
description: FCode binary task format — v1/v2 container layouts, command opcodes, the moveto flag byte, the fast-gradient raster line protocol, and printer (inkjet) packets. Use when working on parseFcode.ts, sliceFcode.ts, Path Preview's fcode path, or anything that reads or inspects .fc task files.
---

# FCode Format

Client-side reader: `packages/core/src/web/app/components/beambox/PathPreview/parseFcode.ts`
(feeds Path Preview via the same stride-9 records as `tmpParseGcode.js`). The sibling
`sliceFcode.ts` builds "start from here" tasks by byte-splicing the original fcode at a
record boundary (using `parseFcode`'s recordOffsets/module/gradient/blockPrologues extras),
patching the containing block length, CONT length, and CONT crc32 — no gcode regeneration
involved. Critical: each block's record-less prologue (grbl syncs, `miscellaneous_cmd(1)`
arming, layer power pwm, layer clip M137) must be copied verbatim into the slice or the
laser stays off. The FILE json time_cost and PREV thumbnail are rebuilt too — the machine
displays them while running. A cut inside a raster sweep restarts at the next raster line.

Source of truth (writers, in the fluxclient repo — verify there before changing the parser):

- `../fluxclient-dev/src/toolpath/fcode_v1_writer.cpp` — v1 container + all command opcodes
- `../fluxclient-dev/src/toolpath/fcode_v2_writer.cpp` — v2 chunked container
- `../fluxclient-dev/src/toolpath/_toolpath.pyx` — Python bindings; fast-gradient pixel
  packing (`fg_iterate_x_c`, `fg_iterate_x_pwm_c`), `write_task_info`
- `../fluxclient-dev/fluxclient/toolpath/toolpath.py` — `process_svgeditor` task assembly
  (block order, `magic_number` gating)
- `../swiftray/src/toolpath_exporter/` — Swiftray's C++ port of the same writer
  (`generators/fcode-generator.cpp`, `toolpath-exporter-fcode.cpp`); identical container,
  block tags, arming, P150/P154-157 commands, and F16 opcodes as of 2026-09. TRAN/MAIN
  proc ids are true NULL there (no bytes). Keep both writers in mind for format changes.

All integers/floats are **little-endian**; floats are 4-byte IEEE 754.

## Containers

Magic: 8 bytes ASCII `FCx000N\n`. N = `magic_number`: 1 for legacy models (beamo,
Beambox), ≥2 for newer models (Ador, Beambox II, HEXA…). N 2/3/4 share the v2
container — the digit only gates generator behavior (e.g. N≥4 emits `$H` pre-task).

### v1 (`FCx0001\n`)

```text
magic(8) | u32 scriptLen | script | u32 crc32
| u32 metaLen | "KEY=value\0..." (utf8) | u32 crc32
| { u32 len, previewImage }... | u32 0x00000000 terminator
```

### v2+ (`FCx0002\n`…)

Tagged chunks, metadata first so machines can show job info without reading the script:

```text
magic(8)
FILE u32 len | json metadata | u32 crc32
PREV { u32 len, image }...            ← no count/terminator; ends at next chunk tag
CONT u32 len | task blocks | u32 crc32
POST u32 len | json | u32 crc32       ← optional
```

Inside `CONT`, a sequence of entries:

- **Task script block**: 4-char tag (`xMIN`, `TRAN`, `MAIN`) `[+ 4-char proc id]` +
  u32 length + command stream. **The proc id is written only when non-empty** (the
  pyx binding passes NULL for `''`): `xMIN` blocks have one (`0001`–`0008`, always
  ASCII digits), `TRAN`/`MAIN` do not. Disambiguate by digit-peeking the 4 bytes
  after the tag — a length whose 4 bytes are all `0x30–0x39` would be ≥ 800MB.
- **`TASK`**: bare 4-byte marker, no payload (one per layer, before its blocks).
- **`INFO`**: 4-byte tag + u32 len + per-task json (time_cost, travel_dist…).
- **`PREV`**: 4-byte tag + u32 len + per-task thumbnail. Yes, `PREV` appears both as
  a top-level chunk and inside `CONT` — different framing in each position.

## Command stream

One command byte, dispatched by exact value except moveto:

| byte | meaning | payload |
|---|---|---|
| `128\|flags` | moveto | one float per set bit, in order: 64=feedrate(mm/min), 32=X, 16=Y, 8=Z, 4=A, 2=(unused), 1=S |
| 48 | fan speed | float |
| 32 | toolhead PWM (0–100) | float |
| 24 / 16* | heater temp (printers) | float |
| 16* | fast-gradient sub-commands (lasers) | see below |
| 18 | grbl sync: sub 0 → u32; sub 1 (M137 type1) → u32 + flags u8 + floats per flag; sub 2 → u32 + flags u8 + float if flags&128 (Q) | u8 sub + varies |
| 18 (P-cmds) | sub 1 P150 = acceleration override (per axis); sub 2 P154/P155/P157 Q = s-curve jerk/a_max/a0 (set_s_curve_params); sub 0 val 156 = s-curve off, val 1/2 = enter/exit printer mode; sub 2 P179/P184/P185 = z-motion syncs | see above |
| 17 | printer (inkjet) packets — see "Printer packets" below | u8 sub + varies |
| 19 | flux custom cmd | u8 + u32 |
| 20 / 21 / 22 | user-selection / miscellaneous / grbl system (`$H`=0, `$HZ`=1) | u8 |
| 8 | calibrate | u32 |
| 7 | set laser module | u32 |
| 6 / 5 | pause in place / to standby; on laser firmware 6 = rotary-mode-on, 5 = gcode boost. Rotary tasks: v1 preamble movetos y to the axis then emits 6 and 5; v2 A-mode machines park y at the axis and move content on the A flag, non-A v2 uses rotary_wait_move (moveto y, 6, offset moveto, P185/P179 syncs). **A is in mm with the document rotary ratio already applied** (fluxclient `rotary_y + (y - rotary_y) * ratio`; the FILE min_y/max_y bounds are the A range) — parseFcode keeps `a` NaN until the first A move; the preview inverts the ratio back to design y (path-preview skill, `getSpinningAxis`), NOT LaserWeb's degrees model (a x diameter x pi/360). Start-here slicing re-emits 6/5 and pre-positions A (when set) after the position restore | — |
| 4 | sleep | u32 ms |
| 1 | home | — |

*Byte 16 is overloaded: heater on printer fcode, raster sub-commands on laser fcode.
The parser only handles the laser meaning.

## Fast-gradient raster lines (cmd 16)

Sub-commands: 1 = mode on (u8 resolution char), 2 = `set_line_pixels` (u32 count),
3 = `fill_32_pixels` (u32 word), 4 = fill end, 5 = print line (commit), 6 = mode off.

Resolution char sets DPI **and** pixel depth: binary 1-bit `L/M/H/B/U/A`
(5/10/20/39/40/78 px/mm; 32 px per word, MSB first, bit=1 → fire) vs PWM 8-bit
`P/Q/R/C/S/T` (same dpi order; 4 px per word, MSB first, byte = 255−gray = power).

Per line: `moveto(y)` → `moveto(x=start)` → settle moveto → sub 2 → sub 3… →
sub 4 → sub 5 → **`moveto(x=end, feedrate)` = the engraving sweep**. Pixels are
already in sweep order (bidirectional passes pre-reversed by the generator). The
last fill word pads to a word boundary — trim to the sub-2 count before decoding.

Traps:

- **PWM stays 0 during fast gradient** — the fills drive the laser. A moveto-only
  reader classifies all engraving as travel.
- Pixel width needs no DPI lookup: `(endX − startX) / pixelCount`.
- Each line is padded with blank pixels (~10–20mm) on both sides; the sweep extends
  past the engraved content, so metadata min/max x exceed the fired-pixel bounds.

## Printer packets (cmd 17)

Sub-commands come in two families — single-color (Ador `PRINTER`) 0-5, 4C (fbm2
`PRINTER_4C`) 10-15 (`fcode_printer.cpp`): 0/11 = packet length u32, 1/12 = payload
marker followed by that many RAW unframed bytes, 2/13 = crc u16, 3/10 = start packet
u8 type, 4/14 = end packet, 5 = px count u32, 15 = burst refresh u16. Printer mode
enter/sync/exit ride cmd 18 sub 0 with values 1/0/2.

Per swath: positioning moveto (s=0) → image packet → px count →
**sweep moveto with s=1** (the print stroke; S axis is the ink marker, PWM stays 0)
→ moveto(s=0).

Image payload: `u32 w | u32 h | u32 x | u32 y` (+4 reserved bytes, single-color
only — header size follows the sub family), then w columns of pixel bits in sweep
order, MSB first. Single-color: 1 bit/pixel. 4C: 4 bits/pixel, one per CMYK channel
(nibble bit 3 = C .. bit 0 = K). Dot pitch is the same in both axes, so row pitch =
sweep length / w. Traps (all verified against a real fbm2 export):

- Channels are ALIGNED with each other in payload space (verified by cross-correlation
  on a real export); the physical print applies the fixed per-channel x offsets
  (`DEFAULT_COLOR_OFFSETS`: C 0, M 42, Y 84, K 126 px, machine +x), so the preview adds
  offset x dot pitch per channel at draw time.
- Swath rows extend downward in machine y from the sweep line. Row bit order differs
  by family: 4C packs rows top-down, single-color bottom-up (`create_image_packet_data`
  `reverse_y` — hardware install direction, per-machine; verified on fbm2 and Ador);
  the decoder flips single-color rows so both read top-down.
- parseFcode renders swath content per channel as zero-sim-time records (f = NaN adds
  no time in GcodePreview) after the real sweep travel record, with NaN-position break
  records hiding the synthetic jumps from the traversal display. 4C runs carry
  `t = PRINTER_CHANNEL_T (7) + channel` and `s` = coverage; GcodePreview draws them in
  a second pass with subtractive blending `blendFuncSeparate(ZERO, ONE_MINUS_SRC_COLOR,
  ONE, ONE)` — rgb multiplies like ink on the white-cleared task framebuffer, alpha
  accumulates coverage so the composite shows it (a plain ZERO/ONE_MINUS_SRC_COLOR pass
  is invisible: the framebuffer clears to alpha 0). Single-color runs stay grayscale
  `RASTER_T`. Coverage-to-density exponent (0.5) lives in the shader's print branch.
- The start-packet type byte is the NozzleMode (LEFT=1/RIGHT=2/BOTH=3) for image
  packets. 4C right-nozzle swaths bake the 0.55035mm left/right nozzle x gap into the
  MOTION (printer_4c pixel_to_actual_position, sign by task direction); the preview
  subtracts it from drawn content so it sits at the true deposit position.
- Nozzle-settings packets (type 17, single-color only) share the framing; they fail
  the image-payload size checks and are skipped.

## parseFcode.ts specifics

- Y is negated into preview space (matching `parseGcode`); A is not.
- Record `g` (cut vs travel) = PWM > 0 for vector moves, per pixel run for raster.
- Raster runs split on every power change. Both records of a run carry `t = RASTER_T` (6)
  and the run-end record carries `s` = pixel power 0–255; `GcodePreview` shades segment i
  by record i's `t` and record i+1's `s`, so PWM images preview as grayscale. Vector
  moves keep `t = 0` and stay solid.
- Variable text needs no handling: it is Promark-only (`isVariableTextSupported`),
  and Promark previews stay on the gcode-text path (`updateGcodeText`).
- Debug workflow: export a `.fc` from the app, run the parser standalone with tsx,
  and hexdump-verify against the writers. A real exported file catches
  binding-level behavior the C++ source alone does not show.

## Maintenance

Update this skill and `parseFcode.ts` together if fluxclient's writers change:
new command opcodes, new `CONT` entry tags, new resolution chars, or a new
`magic_number` with container (not just generator) differences.
