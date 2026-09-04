import type { ParsedFcode } from './parseFcode';
import { RASTER_T, Reader, walkContentEntries } from './parseFcode';

// Builds a "start from here" fcode by byte-splicing the original task at the
// simulation-time cut point, so no gcode regeneration or fluxghost round-trip
// is needed. See .agents/skills/fcode/SKILL.md for the container format.
//
// v2 layout of the sliced CONT content:
//   [pre-task entries] [cut layer's TASK..MAIN header] [block prologue: the layer's
//   record-less arming/power commands, copied verbatim] [state-restore commands]
//   [original bytes from cut offset to end of content]
// Prior layers are dropped; the containing MAIN block's length, the CONT length,
// and the CONT crc32 are patched. v1 splices the flat script the same way. The
// FILE metadata (time_cost) and PREV thumbnail are rebuilt when extras are given,
// since the machine displays them while running.
//
// ponytail: a cut inside a raster sweep restarts at the next raster line (the
// remainder of the current line is skipped, ≤0.2mm). Pixel-exact restart would
// mask leading pixels of the current line's fill words, like the gcode flow does.

export interface FcodeTask extends Omit<ParsedFcode, 'metadata'> {
  buffer: ArrayBuffer;
}

const TRAVEL_FEEDRATE = 7500; // mm/min, matches the gcode start-here preparation

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;

  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;

  return c;
});

const crc32 = (bytes: Uint8Array): number => {
  let c = 0xffffffff;

  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);

  return (c ^ 0xffffffff) >>> 0;
};

class ByteWriter {
  bytes: number[] = [];

  private scratch = new DataView(new ArrayBuffer(4));

  u8 = (value: number): void => {
    this.bytes.push(value);
  };

  u32 = (value: number): void => {
    this.scratch.setUint32(0, value, true);

    for (let i = 0; i < 4; i += 1) this.bytes.push(this.scratch.getUint8(i));
  };

  f32 = (value: number): void => {
    this.scratch.setFloat32(0, value, true);

    for (let i = 0; i < 4; i += 1) this.bytes.push(this.scratch.getUint8(i));
  };

  toArray = (): Uint8Array<ArrayBuffer> => Uint8Array.from(this.bytes);
}

/** Commands re-establishing modal machine state at the cut point. */
const buildRestoreCommands = (opts: {
  feedrate: number;
  gradientChar: null | number;
  isV1: boolean;
  laserModule: null | number;
  pwm: number;
  x: number;
  y: number;
  z: number;
}): Uint8Array<ArrayBuffer> => {
  const w = new ByteWriter();

  // v1 has no pre-task block to keep; its homing lived at the dropped script start
  if (opts.isV1) w.u8(1);

  if (opts.laserModule !== null) {
    w.u8(7);
    w.u32(opts.laserModule);
  }

  // laser off while traveling to the cut position
  w.u8(32);
  w.f32(0);
  w.u8(128 | 64 | 32 | 16);
  w.f32(TRAVEL_FEEDRATE);
  w.f32(opts.x);
  w.f32(opts.y);

  if (opts.z > 0) {
    w.u8(128 | 8);
    w.f32(opts.z);
  }

  // restore modal feedrate for remainder movetos that omit F
  w.u8(128 | 64);
  w.f32(opts.feedrate);

  if (opts.gradientChar !== null) {
    // re-enter fast gradient mode; the remainder starts at a raster line prologue
    w.u8(16);
    w.u8(1);
    w.u8(opts.gradientChar);
  } else if (opts.pwm > 0) {
    // remainder was mid-cut relying on modal pwm
    w.u8(32);
    w.f32(opts.pwm);
  }

  return w.toArray();
};

const lastEventAt = <T>(events: Array<[number, T]>, recordIndex: number): null | T => {
  let value: null | T = null;

  for (const [index, eventValue] of events) {
    if (index > recordIndex) break;

    value = eventValue;
  }

  return value;
};

const concatBytes = (parts: Array<Uint8Array<ArrayBuffer>>): Uint8Array<ArrayBuffer> => {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;

  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }

  return out;
};

const u32Bytes = (value: number): Uint8Array<ArrayBuffer> => {
  const w = new ByteWriter();

  w.u32(value);

  return w.toArray();
};

export interface SliceExtras {
  /** Replacement task thumbnail (png bytes) for the FILE/PREV chunks the machine displays */
  previewPng?: Uint8Array<ArrayBuffer>;
  /** Remaining task time in seconds, patched into the metadata time_cost */
  timeCost?: number;
}

const asciiBytes = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(s, (c) => c.charCodeAt(0));

const patchTimeCostJson = (jsonBytes: Uint8Array, timeCost: number): Uint8Array<ArrayBuffer> => {
  const obj = JSON.parse(new TextDecoder().decode(jsonBytes)) as Record<string, unknown>;

  obj.time_cost = Math.round(timeCost * 100) / 100;

  return new TextEncoder().encode(JSON.stringify(obj)) as Uint8Array<ArrayBuffer>;
};

/**
 * Slices the fcode task at the simulation-time cut point.
 *
 * @param task the parsed task from updateFcode
 * @param simTimeInfo from GcodePreview.getSimTimeInfo: index = record index of the
 *   current segment's start, position = interpolated [x, y] in machine coords
 * @param extras optional replacement thumbnail / remaining-time metadata
 * @returns a machine-ready fcode Blob, or null if slicing is not possible
 */
export const sliceFcode = (
  task: FcodeTask,
  simTimeInfo: { index: number; position: number[] },
  extras: SliceExtras = {},
): Blob | null => {
  try {
    const {
      accelEvents,
      blockPrologues,
      buffer,
      gradientEvents,
      moduleEvents,
      parsedGcode,
      recordOffsets,
      sCurveEvents,
    } = task;
    const { previewPng, timeCost } = extras;
    const recordCount = recordOffsets.length;
    const cutAfter = simTimeInfo.index;

    if (cutAfter < 0 || cutAfter + 1 >= recordCount) return null;

    const arrival = cutAfter + 1;
    const cutOffset = recordOffsets[cutAfter];
    const record = (field: number) => parsedGcode.getItem(arrival * 9 + field);
    const isRaster = record(8) === RASTER_T;
    const bytes = new Uint8Array(buffer);
    const reader = new Reader(buffer);
    const magic = reader.utf8(8);
    const version = Number.parseInt(magic.slice(3, 7), 10);
    // Record-less arming commands at the containing block's start (grbl syncs,
    // miscellaneous enable, layer power) must be replayed or the laser stays off.
    const prologueEndFor = (bodyStart: number): number => {
      const entry = blockPrologues.find(([b]) => b === bodyStart);

      return Math.min(entry ? entry[1] : bodyStart, cutOffset);
    };
    // Latest M137 acceleration override before the cut (can occur mid-layer, per item);
    // re-emitted verbatim so acc overrides survive the slice.
    const accelSpan = lastEventAt(accelEvents, arrival);
    const accelBytes = accelSpan ? bytes.subarray(accelSpan[0], accelSpan[1]) : new Uint8Array(0);
    // Live s-curve params (P154/155/157) at the cut; an off event (P156) clears them,
    // and a fresh job defaults to off, so nothing is emitted in that case.
    const sCurveSpans = new Map<number, [number, number]>();

    for (const [recordIndex, pCmd, span] of sCurveEvents) {
      if (recordIndex > arrival) break;

      if (span === null) sCurveSpans.clear();
      else sCurveSpans.set(pCmd, span);
    }

    const sCurveBytes = concatBytes([...sCurveSpans.values()].map(([start, end]) => bytes.subarray(start, end)));
    const buildRestore = (hasPrologue: boolean) =>
      buildRestoreCommands({
        feedrate: record(5),
        gradientChar: lastEventAt(gradientEvents, arrival),
        isV1: version === 1 && !hasPrologue,
        laserModule: lastEventAt(moduleEvents, arrival),
        pwm: isRaster ? 0 : record(7),
        x: simTimeInfo.position[0],
        y: simTimeInfo.position[1],
        z: record(3),
      });

    if (version === 1) {
      const scriptStart = reader.pos + 4;
      const scriptLength = new DataView(buffer).getUint32(reader.pos, true);
      const scriptEnd = scriptStart + scriptLength;

      if (cutOffset <= scriptStart || cutOffset >= scriptEnd) return null;

      const prologueEnd = prologueEndFor(scriptStart);
      const restore = buildRestore(prologueEnd > scriptStart);
      const newScript = concatBytes([
        bytes.subarray(scriptStart, prologueEnd),
        accelBytes,
        sCurveBytes,
        restore,
        bytes.subarray(cutOffset, scriptEnd),
      ]);
      const parts: Array<Uint8Array<ArrayBuffer>> = [
        bytes.subarray(0, 8),
        u32Bytes(newScript.length),
        newScript,
        u32Bytes(crc32(newScript)),
      ];
      const metadataStart = scriptEnd + 4;
      const metadataLength = new DataView(buffer).getUint32(metadataStart, true);
      const metadataEnd = metadataStart + 4 + metadataLength;

      if (timeCost !== undefined) {
        const pairs = new TextDecoder().decode(bytes.subarray(metadataStart + 4, metadataEnd)).split('\x00');
        const patched = pairs
          .map((pair) =>
            pair.startsWith('TIME_COST=') ? `TIME_COST=${(Math.round(timeCost * 100) / 100).toFixed(2)}` : pair,
          )
          .join('\x00');
        const metaBytes = new TextEncoder().encode(patched) as Uint8Array<ArrayBuffer>;

        parts.push(u32Bytes(metaBytes.length), metaBytes, u32Bytes(crc32(metaBytes)));
      } else {
        parts.push(bytes.subarray(metadataStart, metadataEnd + 4));
      }

      if (previewPng) {
        parts.push(u32Bytes(previewPng.length), previewPng, u32Bytes(0));
      } else {
        parts.push(bytes.subarray(metadataEnd + 4));
      }

      return new Blob(parts);
    }

    // v2+: find the CONT chunk, remembering the FILE json span for metadata patching
    let fileJsonStart = -1;
    let fileJsonLength = 0;
    let fileChunkEnd = -1;

    while (reader.pos < bytes.length - 8) {
      const chunkTag = reader.tag();

      if (chunkTag === 'FILE') {
        fileJsonLength = reader.u32();
        fileJsonStart = reader.pos;
        fileChunkEnd = reader.pos + fileJsonLength + 4; // json + crc32
        reader.pos = fileChunkEnd;
      } else if (chunkTag === 'PREV') {
        while (reader.tag() !== 'CONT') {
          reader.pos -= 4;

          const previewLength = reader.u32();

          reader.pos += previewLength;
        }

        reader.pos -= 4;
      } else if (chunkTag === 'CONT') {
        const contTagStart = reader.pos - 4;
        const contentLength = reader.u32();
        const contentStart = reader.pos;
        const contentEnd = contentStart + contentLength;

        if (cutOffset <= contentStart || cutOffset >= contentEnd) return null;

        const entries = walkContentEntries(buffer, contentStart, contentEnd);
        const containing = entries.find((e) => e.isBlock && e.bodyStart <= cutOffset && cutOffset < e.end);

        if (!containing) return null;

        const prologueEnd = prologueEndFor(containing.bodyStart);
        const restore = buildRestore(false);
        const firstTask = entries.find((e) => e.tag === 'TASK');
        const parts: Array<Uint8Array<ArrayBuffer>> = [];

        if (!firstTask || containing.start <= firstTask.start) {
          // cut inside the pre-task block: keep everything up to its body
          parts.push(bytes.subarray(contentStart, containing.bodyStart));
        } else {
          // keep pre-task entries, drop finished layers, keep the cut layer's
          // TASK/TRAN entries and the containing block's header
          const layerTask = entries.filter((e) => e.tag === 'TASK' && e.start <= containing.start).at(-1)!;

          parts.push(bytes.subarray(contentStart, firstTask.start));
          parts.push(bytes.subarray(layerTask.start, containing.bodyStart));
        }

        const prefixLength = parts.reduce((sum, p) => sum + p.length, 0);
        const prologue = bytes.subarray(containing.bodyStart, prologueEnd);

        parts.push(prologue, accelBytes, sCurveBytes, restore, bytes.subarray(cutOffset, contentEnd));

        const newContent = concatBytes(parts);

        // patch the containing block's length (its u32 sits right before bodyStart)
        new DataView(newContent.buffer).setUint32(
          prefixLength - 4,
          prologue.length + accelBytes.length + sCurveBytes.length + restore.length + (containing.end - cutOffset),
          true,
        );

        // rebuild the head: FILE metadata (patched time_cost) + PREV thumbnail
        const headParts: Array<Uint8Array<ArrayBuffer>> = [];

        if (timeCost !== undefined && fileJsonStart >= 0) {
          const newJson = patchTimeCostJson(bytes.subarray(fileJsonStart, fileJsonStart + fileJsonLength), timeCost);

          headParts.push(
            bytes.subarray(0, fileJsonStart - 8),
            asciiBytes('FILE'),
            u32Bytes(newJson.length),
            newJson,
            u32Bytes(crc32(newJson)),
          );
        } else {
          headParts.push(bytes.subarray(0, fileChunkEnd >= 0 ? fileChunkEnd : contTagStart));
        }

        if (previewPng && fileChunkEnd >= 0) {
          headParts.push(asciiBytes('PREV'), u32Bytes(previewPng.length), previewPng);
        } else if (fileChunkEnd >= 0) {
          headParts.push(bytes.subarray(fileChunkEnd, contTagStart));
        }

        return new Blob([
          ...headParts,
          asciiBytes('CONT'),
          u32Bytes(newContent.length),
          newContent,
          u32Bytes(crc32(newContent)),
          bytes.subarray(contentEnd + 4), // POST chunk, if any
        ]);
      } else {
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('sliceFcode failed:', error);

    return null;
  }
};

export default sliceFcode;
