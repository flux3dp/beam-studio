import { ParsedGcode } from './tmpParseGcode';

// FCode binary parser for Path Preview.
// Emits the same stride-9 records as parseGcode ([g, x, y, z, e, f, a, s, t]),
// so GcodePreview.setParsedGcode consumes it unchanged.
// Format reference: fluxclient src/toolpath/fcode_v1_writer.cpp, fcode_v2_writer.cpp,
// _toolpath.pyx (fg_iterate_x_c / fg_iterate_x_pwm_c for fast gradient).

// Resolution chars of turn_on_gradient_print_mode that mean 8-bit PWM pixels
// (their binary 1-bit counterparts are L/M/H/B/U/A at the same dpi).
const PWM_MODE_CHARS = new Set(['P', 'Q', 'R', 'C', 'S', 'T'].map((c) => c.charCodeAt(0)));

/**
 * Record `t` value marking a raster pixel run. `t` is Promark dotting time in gcode records and unused for fcode,
 * so the preview shader uses it to shade raster segments by `s` (0-255 pixel power) instead of solid black.
 */
export const RASTER_T = 6;

/**
 * Record `t` base value for 4C printer channel runs: t = PRINTER_CHANNEL_T + channel
 * (0=C, 1=M, 2=Y, 3=K, 4=white). Also used for single-color layers whose ink comes
 * from the layer INFO metadata. The preview shader draws these runs in a dedicated
 * pass with subtractive ink blending, using `s`/255 as coverage.
 */
export const PRINTER_CHANNEL_T = 7;

// bm2 4C physical nozzle-column x offsets in pixels at the task's fixed dot pitch
// (fluxclient DEFAULT_COLOR_OFFSETS), indexed C, M, Y, K. Payload channels are
// aligned with each other (verified by cross-correlation on a real export), so the
// printed position of channel c is payload x + offset * dot pitch (machine +x).
const CHANNEL_X_OFFSETS_4C = [0, 42, 84, 126];

// x gap between the 4C left and right nozzle columns in mm (printer_4c
// pixel_to_actual_position); right-nozzle swaths bake it into the motion.
const RIGHT_NOZZLE_X_GAP = 0.55035;

export class Reader {
  view: DataView;

  bytes: Uint8Array;

  pos: number;

  constructor(buffer: ArrayBuffer, pos = 0) {
    this.view = new DataView(buffer);
    this.bytes = new Uint8Array(buffer);
    this.pos = pos;
  }

  u8 = (): number => {
    const v = this.bytes[this.pos];

    this.pos += 1;

    return v;
  };

  u16 = (): number => {
    const v = this.view.getUint16(this.pos, true);

    this.pos += 2;

    return v;
  };

  u32 = (): number => {
    const v = this.view.getUint32(this.pos, true);

    this.pos += 4;

    return v;
  };

  f32 = (): number => {
    const v = this.view.getFloat32(this.pos, true);

    this.pos += 4;

    return v;
  };

  tag = (): string => {
    const s = String.fromCharCode(...this.bytes.subarray(this.pos, this.pos + 4));

    this.pos += 4;

    return s;
  };

  utf8 = (length: number): string => {
    const s = new TextDecoder().decode(this.bytes.subarray(this.pos, this.pos + length));

    this.pos += length;

    return s;
  };
}

interface RasterState {
  armed: boolean;
  pixelCount: number;
  pixels: number[];
  pwmMode: boolean;
}

/**
 * Splits one raster line's pixel buffer into laser-on runs of constant power.
 * @param pixels power per pixel along the sweep direction, 0 = laser off, 1-255 = laser on
 * @returns runs as [startIndex, endIndexExclusive, power], in increasing index order
 */
export function decodePixelRuns(pixels: ArrayLike<number>): Array<[number, number, number]> {
  const runs: Array<[number, number, number]> = [];
  let start = -1;
  let power = 0;

  for (let i = 0; i < pixels.length; i += 1) {
    const p = pixels[i];

    if (p === power) continue;

    if (start >= 0) runs.push([start, i, power]);

    start = p > 0 ? i : -1;
    power = p;
  }

  if (start >= 0) runs.push([start, pixels.length, power]);

  return runs;
}

export interface PrinterSwath {
  /** 1 for single-color, 4 for 4C (C, M, Y, K) */
  channels: 1 | 4;
  /**
   * Ink bitmask of pixel (column, row): 0|1 for single-color, a CMYK nibble
   * (bit 3 = C .. bit 0 = K) for 4C; channels are aligned in payload space
   */
  pixelAt: (col: number, row: number) => number;
  rows: number;
  w: number;
}

/**
 * Decodes a printer image packet payload (printer.py create_image_packet_data /
 * printer_4c generate_payload) into a 2D swath accessor.
 *
 * Layout: u32 w | u32 h | u32 x | u32 y | [4 reserved bytes, single-color only]
 * then w columns of pixel bits in sweep order, MSB first: single-color packs
 * 1 bit per pixel, 4C packs 4 bits per pixel (one per CMYK channel; channels are
 * aligned with each other in payload space — verified against a real fbm2 export —
 * while the physical print applies CHANNEL_X_OFFSETS_4C per channel). The header
 * length comes from the packet sub-command family (subs 0-5 single, 10-15 4C).
 * Payloads failing the size checks (nozzle-settings packets) return null.
 */
export function decodePrinterSwath(payload: Uint8Array, headerLength: 16 | 20): null | PrinterSwath {
  if (payload.length <= headerLength) return null;

  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
  const w = view.getUint32(0, true);
  const h = view.getUint32(4, true);
  const dataLength = payload.length - headerLength;

  if (w < 1 || w > 100000 || h < 1 || h > 8192 || dataLength % w !== 0) return null;

  const bytesPerColumn = dataLength / w;

  if (bytesPerColumn < 1 || bytesPerColumn > 2048) return null;

  const channels = headerLength === 16 ? 4 : 1;
  const rows = Math.floor((bytesPerColumn * 8) / channels);
  const pixelAt =
    channels === 1
      ? (col: number, row: number): number => {
          // single-color packets store rows bottom-up (create_image_packet_data
          // reverse_y=True; 4C passes False), so flip to match 4C's top-down order
          const r = rows - 1 - row;

          return (payload[headerLength + col * bytesPerColumn + (r >> 3)] >> (7 - (r & 7))) & 1;
        }
      : (col: number, row: number): number => {
          // 4 bits per pixel, nibble bit 3 = C .. bit 0 = K
          const byte = payload[headerLength + col * bytesPerColumn + (row >> 1)];

          return (row & 1) === 0 ? byte >> 4 : byte & 0x0f;
        };

  return { channels, pixelAt, rows, w };
}

export interface ContentEntry {
  bodyStart: number;
  end: number;
  isBlock: boolean;
  start: number;
  tag: string;
}

/**
 * Structure-only walk of a v2 CONT chunk's entries — task script blocks
 * (4-char tag [+ 4-char all-digit proc id] + u32 length), bare TASK markers,
 * and length-prefixed INFO/PREV items. Shared by parsing and start-here slicing.
 */
export function walkContentEntries(buffer: ArrayBuffer, start: number, end: number): ContentEntry[] {
  const r = new Reader(buffer, start);
  const entries: ContentEntry[] = [];

  while (r.pos < end) {
    const entryStart = r.pos;
    const tag = r.tag();

    if (tag === 'TASK') {
      entries.push({ bodyStart: r.pos, end: r.pos, isBlock: false, start: entryStart, tag });
      continue;
    }

    if (tag === 'INFO' || tag === 'PREV') {
      const length = r.u32();

      entries.push({ bodyStart: r.pos, end: r.pos + length, isBlock: false, start: entryStart, tag });
      r.pos += length;
      continue;
    }

    // task script block; the proc id is omitted when empty (TRAN/MAIN), and present
    // ones are ASCII digits ('0001'..'0008') — never a valid length (would be >800MB)
    const peek = r.bytes.subarray(r.pos, r.pos + 4);

    if (peek.every((b) => b >= 0x30 && b <= 0x39)) r.pos += 4;

    const length = r.u32();

    entries.push({ bodyStart: r.pos, end: r.pos + length, isBlock: true, start: entryStart, tag });
    r.pos += length;
  }

  return entries;
}

export interface ParsedFcode {
  /**
   * [recordIndex, [startOffset, endOffset]]: M137 type-1 acceleration-override commands
   * (set_acceleration_override, incl. s-curve's derived acc), sparse. Start-here slicing
   * re-emits the latest one's bytes verbatim, since they can occur mid-layer (per item).
   */
  accelEvents: Array<[number, [number, number]]>;
  /**
   * [bodyStartOffset, prologueEndOffset] per script block: the record-less commands at the
   * start of a block (grbl syncs, miscellaneous arming, layer power pwm) that "start here"
   * slicing must replay verbatim, ending at the first record-producing command.
   */
  blockPrologues: Array<[number, number]>;
  /** [recordIndex, resolutionChar | null]: gradient print mode changes, sparse */
  gradientEvents: Array<[number, null | number]>;
  metadata: Record<string, number | string>;
  /** [recordIndex, laserModule]: cmd-7 laser module changes, sparse */
  moduleEvents: Array<[number, number]>;
  parsedGcode: ParsedGcode;
  /**
   * [recordIndex, cmd]: pause commands, sparse. On laser firmware cmd 6 (pause in
   * place) doubles as rotary-mode-on and cmd 5 (pause to standby) as gcode boost;
   * both can trail the first movetos (v1 rotary preamble, v2 rotary_wait_move), so
   * start-here slicing re-emits them after restoring the y/axis position.
   */
  pauseEvents: Array<[number, number]>;
  /** Per record: byte offset of the END of the command that produced it (for start-here slicing) */
  recordOffsets: number[];
  /**
   * [recordIndex, pCmd, [startOffset, endOffset] | null]: s-curve device commands, sparse.
   * pCmd 154/155/157 set jerk/a_max/a0 (set_s_curve_params, M137 type-2); pCmd 156 with a
   * null span turns s-curve off (sync_grbl_motion(156)). Start-here slicing re-emits the
   * live triplet, or nothing when the last event is off (fresh jobs default to off).
   */
  sCurveEvents: Array<[number, number, [number, number] | null]>;
}

export const parseFcode = (buffer: ArrayBuffer): ParsedFcode => {
  const parsedGcode = new ParsedGcode();
  const metadata: Record<string, number | string> = {};
  const recordOffsets: number[] = [];
  const moduleEvents: Array<[number, number]> = [];
  const gradientEvents: Array<[number, null | number]> = [];
  const blockPrologues: Array<[number, number]> = [];
  const accelEvents: Array<[number, [number, number]]> = [];
  const sCurveEvents: Array<[number, number, [number, number] | null]> = [];
  const pauseEvents: Array<[number, number]> = [];
  let pendingBlock: null | { bodyStart: number; recordCount: number } = null;
  const reader = new Reader(buffer);

  // Machine coords, y kept in preview space (negated, matching parseGcode)
  // a: NaN until the task moves the A axis (fcode v2 rotary), like fluxclient's NAN=absent
  // printS: the moveto S axis — printer swath sweeps carry s=1, travels s=0
  const state = { a: Number.NaN, f: 7500, printS: 0, pwm: 0, x: 0, y: 0, z: 0 };
  let raster: null | RasterState = null;
  // Payload length announced by the printer packet-length sub-command; the
  // payload marker is followed by that many raw unframed bytes.
  let printerPayloadLength = 0;
  // Payload byte spans (+ header length by packet family) buffered since the last
  // positioning move; decoded into per-column ink runs when the swath sweep
  // (moveto with s > 0) arrives.
  let printerPayloads: Array<[number, number, 16 | 20, number]> = [];
  // Packet type from start_printer_packet: NozzleMode LEFT=1 / RIGHT=2 / BOTH=3 for
  // image packets (17 = nozzle settings, 5 = white ink, 6 = varnish)
  let printerPacketType = 0;

  const push = (g: number, s = state.pwm, t = 0) => {
    parsedGcode.push(g);
    parsedGcode.push(state.x);
    parsedGcode.push(state.y);
    parsedGcode.push(state.z);
    parsedGcode.push(0); // e
    parsedGcode.push(state.f);
    parsedGcode.push(state.a);
    parsedGcode.push(s);
    parsedGcode.push(t);
    recordOffsets.push(reader.pos);
  };

  const emitRasterSweep = (targetX: number) => {
    const { pixelCount, pixels } = raster!;
    const x1 = state.x;
    const pixelWidth = (targetX - x1) / pixelCount;
    const runs = decodePixelRuns(pixels.length > pixelCount ? pixels.slice(0, pixelCount) : pixels);

    // The preview shades segment i by record i's `t` and record i+1's `s`, so tag both ends of each run.
    for (const [start, end, power] of runs) {
      state.x = x1 + start * pixelWidth;
      push(0, state.pwm, RASTER_T);
      state.x = x1 + end * pixelWidth;
      push(1, power, RASTER_T);
    }

    if (state.x !== targetX) {
      state.x = targetX;
      push(0);
    }

    raster!.armed = false;
    raster!.pixels = [];
  };

  // Emits a printer swath as 2D content: the real sweep as a travel record (it
  // carries the motion time), then the packet's pixel rows as zero-sim-time run
  // records (f = NaN adds no time in GcodePreview), downsampled to ~0.2mm cells.
  const emitPrinterSweep = (targetX: number): boolean => {
    let swath: null | PrinterSwath = null;
    let packetType = 0;

    for (const [start, end, headerLength, type] of printerPayloads) {
      swath = decodePrinterSwath(reader.bytes.subarray(start, end), headerLength);

      if (swath) {
        packetType = type;
        break;
      }
    }

    printerPayloads = [];

    if (!swath) return false;

    const x1 = state.x;
    const sweepY = state.y;
    const savedF = state.f;
    const pixelWidth = (targetX - x1) / swath.w;
    // dot interval is a fixed pixel-per-mm in both axes, so row pitch = column pitch
    const rowPitch = Math.abs(pixelWidth);
    // 4C right-nozzle swaths compensate the nozzle x gap in the MOTION
    // (printer_4c pixel_to_actual_position adds +-0.55035mm to the movetos, sign by
    // task direction); undo it so content draws at the true deposit position
    const nozzleAdjust =
      swath.channels === 4 && packetType === 2 ? (targetX > x1 ? -RIGHT_NOZZLE_X_GAP : RIGHT_NOZZLE_X_GAP) : 0;

    state.x = targetX;
    push(0);

    state.f = Number.NaN;

    // A NaN-position record makes the segments touching it non-rasterizable,
    // hiding the synthetic jumps between runs/rows from the traversal display
    // (they are not actual head motion; the real sweep travel above remains).
    const pushBreak = () => {
      const { x: sx, y: sy } = state;

      state.x = Number.NaN;
      state.y = Number.NaN;
      push(0, 0);
      state.x = sx;
      state.y = sy;
    };
    const colStep = Math.max(1, Math.round(0.2 / rowPitch));
    const rowStep = Math.max(1, Math.round(0.2 / rowPitch));
    const cellCount = Math.ceil(swath.w / colStep);
    const cells = new Uint8Array(cellCount);

    // single-color layers carry their ink in the layer INFO metadata (Ador)
    const taskInk = taskInkChannels[taskIndex] ?? null;
    const { channels } = swath;
    // per-cell ink sums for every channel, filled in one pass per row block so
    // each pixel is decoded once (a 4C nibble carries all four channel bits)
    const sums = new Uint16Array(cellCount * channels);

    for (let row = 0; row < swath.rows; row += rowStep) {
      const rowEnd = Math.min(row + rowStep, swath.rows);

      sums.fill(0);

      for (let col = 0; col < swath.w; col += 1) {
        const base = Math.floor(col / colStep) * channels;

        for (let r = row; r < rowEnd; r += 1) {
          const mask = swath.pixelAt(col, r);

          if (!mask) continue;

          if (channels === 4) {
            sums[base] += (mask >> 3) & 1;
            sums[base + 1] += (mask >> 2) & 1;
            sums[base + 2] += (mask >> 1) & 1;
            sums[base + 3] += mask & 1;
          } else {
            sums[base] += 1;
          }
        }
      }

      // swath rows extend from the sweep line toward larger machine y (preview -y);
      // verified against a real fbm2 export
      state.y = sweepY - (row + (rowEnd - row) / 2) * rowPitch;

      for (let channel = 0; channel < channels; channel += 1) {
        // physical nozzle-column offset, always machine +x regardless of sweep direction
        const channelOffset = channels === 4 ? CHANNEL_X_OFFSETS_4C[channel] * rowPitch : 0;
        const runT =
          channels === 4 ? PRINTER_CHANNEL_T + channel : taskInk === null ? RASTER_T : PRINTER_CHANNEL_T + taskInk;

        for (let ci = 0; ci < cellCount; ci += 1) {
          const colEnd = Math.min((ci + 1) * colStep, swath.w);
          const area = (colEnd - ci * colStep) * (rowEnd - row);

          // quantize to 16 levels so smooth regions merge into long runs
          cells[ci] = Math.round((sums[ci * channels + channel] / area) * 15) * 17;
        }

        const runs = decodePixelRuns(cells);

        for (const [start, end, power] of runs) {
          pushBreak();
          state.x = x1 + start * colStep * pixelWidth + channelOffset + nozzleAdjust;
          push(0, 0, runT);
          state.x = x1 + Math.min(end * colStep, swath.w) * pixelWidth + channelOffset + nozzleAdjust;
          push(1, power, runT);
        }
      }
    }

    // zero-time return to the sweep end so subsequent motion connects correctly
    pushBreak();
    state.x = targetX;
    state.y = sweepY;
    push(0);
    state.f = savedF;

    return true;
  };

  const handleMoveto = (cmd: number) => {
    let targetX = state.x;

    if (cmd & 64) state.f = reader.f32();

    if (cmd & 32) targetX = reader.f32();

    if (cmd & 16) state.y = -reader.f32();

    if (cmd & 8) state.z = reader.f32();

    if (cmd & 4) state.a = reader.f32();

    if (cmd & 2) reader.f32();

    if (cmd & 1) {
      state.printS = reader.f32();

      // a positioning move (s=0) discards buffered non-image packets (nozzle settings)
      if (state.printS === 0) printerPayloads = [];
    }

    if (raster?.armed && targetX !== state.x) {
      emitRasterSweep(targetX);
    } else if (state.printS > 0 && printerPayloads.length > 0 && targetX !== state.x && emitPrinterSweep(targetX)) {
      // handled as per-column ink runs
    } else {
      state.x = targetX;
      push(state.pwm > 0 || state.printS > 0 ? 1 : 0);
    }
  };

  const handleRasterCmd = () => {
    const sub = reader.u8();

    switch (sub) {
      case 1: {
        const modeChar = reader.u8();

        raster = { armed: false, pixelCount: 0, pixels: [], pwmMode: PWM_MODE_CHARS.has(modeChar) };
        gradientEvents.push([recordOffsets.length, modeChar]);
        break;
      }
      case 2:
        if (!raster) raster = { armed: false, pixelCount: 0, pixels: [], pwmMode: false };

        raster.pixelCount = reader.u32();
        raster.pixels = [];
        break;
      case 3: {
        const word = reader.u32();

        if (!raster) break;

        if (raster.pwmMode) {
          raster.pixels.push((word >>> 24) & 0xff, (word >>> 16) & 0xff, (word >>> 8) & 0xff, word & 0xff);
        } else {
          for (let bit = 31; bit >= 0; bit -= 1) {
            raster.pixels.push(word & (1 << bit) ? 255 : 0);
          }
        }

        break;
      }
      case 4:
        break;
      case 5:
        if (raster) raster.armed = true;

        break;
      case 6:
        raster = null;
        gradientEvents.push([recordOffsets.length, null]);
        break;
      default:
        throw new Error(`Unknown fcode raster sub-command ${sub}`);
    }
  };

  const parseCommands = (end: number) => {
    while (reader.pos < end) {
      const cmdStart = reader.pos;
      const cmd = reader.u8();

      if (cmd & 128) {
        handleMoveto(cmd);
      } else {
        parseSimpleCommand(cmd, cmdStart);
      }

      if (pendingBlock && recordOffsets.length > pendingBlock.recordCount) {
        blockPrologues.push([pendingBlock.bodyStart, cmdStart]);
        pendingBlock = null;
      }
    }
  };

  const parseSimpleCommand = (cmd: number, cmdStart: number) => {
    switch (cmd) {
      case 48: // fan speed
      case 32: // toolhead pwm
      case 24: // heater (blocking)
        if (cmd === 32) state.pwm = reader.f32();
        else reader.f32();

        break;
      case 16: // fast gradient sub-commands
        handleRasterCmd();
        break;
      case 17: {
        // printer (inkjet) packets, single-color subs 0-5 / 4C subs 10-15 (fcode_printer.cpp)
        const sub = reader.u8();

        switch (sub) {
          case 0: // packet length
          case 11:
            printerPayloadLength = reader.u32();
            break;
          case 1: // payload marker, followed by raw unframed bytes
          case 12:
            printerPayloads.push([
              reader.pos,
              reader.pos + printerPayloadLength,
              sub === 12 ? 16 : 20,
              printerPacketType,
            ]);
            reader.pos += printerPayloadLength;
            printerPayloadLength = 0;
            break;
          case 2: // packet crc16
          case 13:
            reader.u16();
            break;
          case 3: // start packet (u8 type = NozzleMode for image packets)
          case 10:
            printerPacketType = reader.u8();
            break;
          case 4: // end packet
          case 14:
            break;
          case 5: // pixel count
            reader.u32();
            break;
          case 15: // burst refresh
            reader.u16();
            break;
          default:
            throw new Error(`Unknown fcode printer sub-command ${sub}`);
        }

        break;
      }
      case 18: {
        // grbl sync / M137 sync motion
        const sub = reader.u8();

        if (sub === 0) {
          const value = reader.u32();

          // sync_grbl_motion(156) turns s-curve off on the device
          if (value === 156) sCurveEvents.push([recordOffsets.length, value, null]);
        } else if (sub === 2) {
          const pCmd = reader.u32();
          const flags = reader.u8();

          if (flags & 128) reader.f32();

          // set_s_curve_params: P154 Q=jerk, P155 Q=a_max, P157 Q=a0
          if (pCmd === 154 || pCmd === 155 || pCmd === 157) {
            sCurveEvents.push([recordOffsets.length, pCmd, [cmdStart, reader.pos]]);
          }
        } else {
          // sub 1: M137 type1, uint32 cmd + flags byte + one float per flag.
          // Used for acceleration overrides (P150); tracked for start-here slicing.
          reader.u32();

          const flags = reader.u8();

          for (const bit of [64, 32, 16, 8, 4, 1]) {
            if (flags & bit) reader.f32();
          }

          accelEvents.push([recordOffsets.length, [cmdStart, reader.pos]]);
        }

        break;
      }
      case 19: // flux custom cmd
        reader.u8();
        reader.u32();
        break;
      case 20: // user selection cmd
      case 21: // miscellaneous cmd
      case 22: // grbl system cmd ($H resets position, but a moveto always follows)
        reader.u8();
        break;
      case 7: // set laser module
        moduleEvents.push([recordOffsets.length, reader.u32()]);
        break;
      case 8: // calibrate
      case 4: // sleep (uint32 ms)
        reader.u32();
        break;
      case 5: // pause to standby (doubles as gcode-boost-on for laser firmware)
      case 6: // pause in place (doubles as rotary-mode-on for laser firmware)
        pauseEvents.push([recordOffsets.length, cmd]);
        break;
      case 1: // home
        state.x = 0;
        state.y = 0;
        state.z = 0;
        push(0);
        break;
      default:
        throw new Error(`Unknown fcode command ${cmd} at offset ${reader.pos - 1}`);
    }
  };

  // Ink channel per ink name (single-color layers, Ador): C=0, M=1, Y=2, K=3
  // map to PRINTER_CHANNEL_T + channel; white gets its own t (11).
  const INK_CHANNELS: Record<string, number> = { black: 3, cyan: 0, magenta: 1, white: 4, yellow: 2 };
  // Per-task ink channel from the INFO jsons (submodule.color), in TASK order;
  // INFO trails its layer's MAIN block, so a structure-only pre-scan collects them.
  let taskInkChannels: Array<null | number> = [];
  let taskIndex = -1;

  const parseV2Content = (start: number, end: number) => {
    const entries = walkContentEntries(buffer, start, end);

    // INFO trails its layer's MAIN block, so collect the per-task ink first
    for (const entry of entries) {
      if (entry.tag !== 'INFO') continue;

      try {
        const json = new TextDecoder().decode(reader.bytes.subarray(entry.bodyStart, entry.end));
        const info = JSON.parse(json) as { submodule?: { color?: string } };

        taskInkChannels.push(INK_CHANNELS[info.submodule?.color ?? ''] ?? null);
      } catch {
        taskInkChannels.push(null);
      }
    }

    for (const entry of entries) {
      if (entry.tag === 'TASK') {
        taskIndex += 1;
        continue;
      }

      // xMIN blocks are machine scripts (homing, prespray, lid/table moves, post-task),
      // not design content: skip them so their moves and prespray swaths stay out of the preview
      if (!entry.isBlock || entry.tag === 'xMIN') continue;

      reader.pos = entry.bodyStart;
      pendingBlock = { bodyStart: entry.bodyStart, recordCount: recordOffsets.length };
      parseCommands(entry.end);
      pendingBlock = null;
    }
  };

  try {
    const magic = reader.utf8(8); // "FCx000N\n"

    if (!magic.startsWith('FCx')) throw new Error(`Bad fcode header: ${magic}`);

    const version = Number.parseInt(magic.slice(3, 7), 10);

    if (version === 1) {
      const scriptLength = reader.u32();

      pendingBlock = { bodyStart: reader.pos, recordCount: 0 };
      parseCommands(reader.pos + scriptLength);
      pendingBlock = null;
      reader.u32(); // script crc32

      const metadataLength = reader.u32();

      for (const pair of reader.utf8(metadataLength).split('\x00')) {
        const eq = pair.indexOf('=');

        if (eq > 0) metadata[pair.slice(0, eq)] = pair.slice(eq + 1);
      }
    } else {
      // v2+: tagged chunks FILE (json metadata), PREV (previews), CONT (script blocks)
      while (reader.pos < reader.bytes.length - 8) {
        const chunkTag = reader.tag();

        if (chunkTag === 'FILE') {
          Object.assign(metadata, JSON.parse(reader.utf8(reader.u32())));
          reader.u32(); // crc32
        } else if (chunkTag === 'PREV') {
          // previews have no count: entries of uint32 length + data until the next chunk tag
          while (reader.tag() !== 'CONT') {
            reader.pos -= 4;

            const previewLength = reader.u32();

            reader.pos += previewLength;
          }

          reader.pos -= 4;
        } else if (chunkTag === 'CONT') {
          const length = reader.u32();

          parseV2Content(reader.pos, reader.pos + length);
          break; // ignore trailing crc32 / POST chunk
        } else {
          throw new Error(`Unknown fcode chunk: ${chunkTag}`);
        }
      }
    }
  } catch (error) {
    // Return what was parsed so far; a truncated preview beats no preview.
    console.error('parseFcode failed:', error);
  }

  console.log('Parsed FCode', parsedGcode);

  return {
    accelEvents,
    blockPrologues,
    gradientEvents,
    metadata,
    moduleEvents,
    parsedGcode,
    pauseEvents,
    recordOffsets,
    sCurveEvents,
  };
};

export default parseFcode;
