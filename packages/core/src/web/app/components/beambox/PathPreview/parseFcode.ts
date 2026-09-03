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
    const v = this.view.getUint8(this.pos);

    this.pos += 1;

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
  let pendingBlock: null | { bodyStart: number; recordCount: number } = null;
  const reader = new Reader(buffer);

  // Machine coords, y kept in preview space (negated, matching parseGcode)
  const state = { a: 0, f: 7500, pwm: 0, x: 0, y: 0, z: 0 };
  let raster: null | RasterState = null;

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

  const handleMoveto = (cmd: number) => {
    let targetX = state.x;

    if (cmd & 64) state.f = reader.f32();

    if (cmd & 32) targetX = reader.f32();

    if (cmd & 16) state.y = -reader.f32();

    if (cmd & 8) state.z = reader.f32();

    if (cmd & 4) state.a = reader.f32();

    if (cmd & 2) reader.f32();

    if (cmd & 1) reader.f32();

    if (raster?.armed && targetX !== state.x) {
      emitRasterSweep(targetX);
    } else {
      state.x = targetX;
      push(state.pwm > 0 ? 1 : 0);
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
      case 5: // pause to standby
      case 6: // pause in place
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

  const parseV2Blocks = (end: number) => {
    while (reader.pos < end) {
      const blockTag = reader.tag();

      if (blockTag === 'TASK') continue; // bare marker, no payload

      if (blockTag === 'INFO' || blockTag === 'PREV') {
        // length-prefixed per-task info json / preview image
        const length = reader.u32();

        reader.pos += length;
        continue;
      }

      // Task script block: 4-char header [+ 4-char proc id] + uint32 length + commands.
      // The proc id is omitted when empty (TRAN/MAIN); present ones are ASCII digits
      // ('0001'..'0008'), which can never be a real length (would be >800MB).
      const peek = reader.bytes.subarray(reader.pos, reader.pos + 4);

      if (peek.every((b) => b >= 0x30 && b <= 0x39)) reader.pos += 4;

      const length = reader.u32();

      pendingBlock = { bodyStart: reader.pos, recordCount: recordOffsets.length };
      parseCommands(reader.pos + length);
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

          parseV2Blocks(reader.pos + length);
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
    recordOffsets,
    sCurveEvents,
  };
};

export default parseFcode;
