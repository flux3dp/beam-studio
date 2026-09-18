// tmpParseGcode.js is untransformed ESM, so stand in a flat array with the same
// push/getItem surface the parser uses.
jest.mock('./tmpParseGcode', () => ({
  ParsedGcode: class {
    items: number[] = [];

    push = (value: number): void => {
      this.items.push(value);
    };

    getItem = (index: number): number => this.items[index];
  },
}));

import parseFcode, { decodePixelRuns, decodePrinterSwath, RASTER_T } from './parseFcode';

describe('decodePixelRuns', () => {
  test('splits on laser off and on power changes, keeping each run power', () => {
    expect(decodePixelRuns([0, 255, 255, 128, 128, 0, 16])).toEqual([
      [1, 3, 255],
      [3, 5, 128],
      [6, 7, 16],
    ]);
  });

  test('returns no runs for a blank line', () => {
    expect(decodePixelRuns([0, 0, 0])).toEqual([]);
  });
});

describe('decodePrinterSwath', () => {
  // single-color header: w=4, h=16, x, y, 4 reserved bytes; 4 columns x 2 bytes
  const payload = Uint8Array.from([
    ...[4, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ...[0x00, 0x00, 0xff, 0xff, 0x0f, 0x00, 0x00, 0x01],
  ]);

  test('decodes single-color pixels (1 bit each)', () => {
    const swath = decodePrinterSwath(payload, 20)!;

    expect(swath.w).toBe(4);
    expect(swath.rows).toBe(16);
    expect(swath.channels).toBe(1);
    // single-color rows are stored bottom-up and flipped to top-down by the decoder
    expect(swath.pixelAt(0, 0)).toBe(0);
    expect(swath.pixelAt(1, 0)).toBe(1);
    expect(swath.pixelAt(1, 15)).toBe(1);
    expect(swath.pixelAt(2, 12)).toBe(0); // 0x0f00: bits 4-7 set -> rows 8-11
    expect(swath.pixelAt(2, 11)).toBe(1);
    expect(swath.pixelAt(2, 8)).toBe(1);
    expect(swath.pixelAt(3, 0)).toBe(1); // 0x0001: last bit -> top row
  });

  test('decodes 4C pixels (4 CMYK channel bits each, aligned in payload space)', () => {
    const payload4c = Uint8Array.from([...payload.subarray(0, 16), ...payload.subarray(20)]);
    const swath = decodePrinterSwath(payload4c, 16)!;

    expect(swath.rows).toBe(4); // 2 bytes per column / 4 bits per pixel
    expect(swath.channels).toBe(4);
    expect(swath.w).toBe(4);
    expect(swath.pixelAt(1, 0)).toBe(0xf); // all 4 channels
    expect(swath.pixelAt(2, 0)).toBe(0); // 0x0f00: high nibble of first byte is 0
    expect(swath.pixelAt(2, 1)).toBe(0xf); // low nibble
    expect(swath.pixelAt(3, 3)).toBe(0x1); // K only (nibble bit 0)
  });

  test('rejects non-image packets', () => {
    expect(decodePrinterSwath(Uint8Array.from([1, 2, 3, 4, 5]), 20)).toBeNull();
  });
});

// --- galvo lists (fcode byte 23) ---------------------------------------------

const f32 = (value: number): number[] => [...new Uint8Array(Float32Array.of(value).buffer)];
const f64 = (value: number): number[] => [...new Uint8Array(Float64Array.of(value).buffer)];
const u32 = (value: number): number[] => [...new Uint8Array(Uint32Array.of(value).buffer)];

/** One galvo record: byte 23, uint16 opcode, uint8 param count, float64 params. */
const galvo = (opcode: number, ...params: number[]): number[] => [
  23,
  opcode & 0xff,
  opcode >> 8,
  params.length,
  ...params.flatMap(f64),
];

/** A self-sufficient list prologue (HX2_GALVO_PROTOCOL §19.3), power 40%. */
const prologue = (markSpeedMmS: number): number[] => [
  ...galvo(13, 100, 1), // SET_STANDBY
  ...galvo(7, 4000), // SET_JUMP_SPEED mm/s
  ...galvo(8, markSpeedMmS), // SET_MARK_SPEED mm/s
  ...galvo(9, -100, 100), // SET_LASER_DELAYS
  ...galvo(10, 100, 50), // SET_SCANNER_DELAYS
  ...galvo(11, 40), // SET_LASER_POWER
  ...galvo(12, 31.25, 12.5, 1), // SET_LASER_PULSES
  ...galvo(14, 0), // ENABLE_LASER
];

/** Wraps a command script in a minimal v2 container (FILE + CONT, no previews). */
const buildTask = (script: number[]): ArrayBuffer => {
  const meta = [...new TextEncoder().encode('{"version":"2"}')];
  const content = [...new TextEncoder().encode('TASKMAIN'), ...u32(script.length), ...script];

  return Uint8Array.from([
    ...new TextEncoder().encode('FCx0003\n'),
    ...new TextEncoder().encode('FILE'),
    ...u32(meta.length),
    ...meta,
    ...u32(0), // crc32, unchecked by the parser
    ...new TextEncoder().encode('CONT'),
    ...u32(content.length),
    ...content,
    ...u32(0),
  ]).buffer;
};

/** Park the gantry at (115, 115) mm, then wait for the move (§10 step 2). */
const park = [128 | 64 | 32 | 16, ...f32(7500), ...f32(115), ...f32(115), 18, 0, ...u32(0)];

const records = (buffer: ArrayBuffer) => {
  const parsed = parseFcode(buffer);
  const get = (i: number, field: number) => parsed.parsedGcode.getItem(i * 9 + field);

  return {
    galvoLists: parsed.galvoLists,
    rows: parsed.recordOffsets.map((_, i) => ({
      f: get(i, 5),
      g: get(i, 0),
      s: get(i, 7),
      t: get(i, 8),
      x: get(i, 1),
      y: get(i, 2),
    })),
  };
};

describe('parseFcode galvo lists', () => {
  test('places marks at park + field-local offset, in preview space', () => {
    const { galvoLists, rows } = records(
      buildTask([
        ...park,
        ...prologue(800),
        ...galvo(1, -15, -15), // JUMP_ABS
        ...galvo(3, 15, -15), // MARK_ABS
        ...galvo(15, 0), // DISABLE_LASER
        ...galvo(19, 12.3), // SET_END_OF_LIST
      ]),
    );

    // park, jump, mark, then the break that ends the run
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ x: 115, y: -115 });
    // beam = park + local; preview y is negated, so local y subtracts
    expect(rows[1]).toMatchObject({ f: 4000 * 60, g: 0, x: 100, y: -100 });
    expect(rows[2]).toMatchObject({ f: 800 * 60, g: 1, s: 40, x: 130, y: -100 });
    expect(rows[3].x).toBeNaN();
    expect(galvoLists).toEqual([[1, 2]]);
  });

  test('marks are travels while the laser is disabled', () => {
    const { rows } = records(
      buildTask([
        ...park,
        ...galvo(11, 40), // power, but no ENABLE_LASER
        ...galvo(1, 0, 0),
        ...galvo(3, 10, 0),
        ...galvo(19, 1),
      ]),
    );

    expect(rows[2]).toMatchObject({ g: 0, x: 125 });
  });

  test('splits a run into one entry per list', () => {
    const list = (x: number) => [...prologue(800), ...galvo(1, x, 0), ...galvo(3, x + 5, 0), ...galvo(19, 1)];
    const { galvoLists } = records(buildTask([...park, ...list(-20), ...list(10)]));

    expect(galvoLists).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  test('leaves the gantry parked after the run', () => {
    const { rows } = records(
      buildTask([
        ...park,
        ...prologue(800),
        ...galvo(1, -15, -15),
        ...galvo(19, 1),
        // a second gantry move, after the block
        128 | 32 | 16,
        ...f32(200),
        ...f32(50),
      ]),
    );

    // the break hides the jump back, and the next move starts from the park
    expect(rows[2].x).toBeNaN();
    expect(rows[2].f).toBeNaN();
    expect(rows[3]).toMatchObject({ x: 200, y: -50 });
  });

  test('draws dots as pixel-wide marks at the spacing of their grid', () => {
    const dot = (x: number) => [...galvo(1, x, 0), ...galvo(5, 300)];
    const { rows } = records(buildTask([...park, ...prologue(800), ...dot(0), ...dot(0.2), ...galvo(19, 1)]));

    // per dot: the jump that carries the motion, break, mark start, mark end, break
    const marks = rows.filter((r) => r.t === RASTER_T && r.g === 1);

    expect(marks).toHaveLength(2);
    // s is 0-255 pixel power, so 40% reads as 102
    expect(marks[0].s).toBeCloseTo(102);
    // the first dot has no neighbour yet and falls back to the default 0.1mm
    expect(rows[3].x).toBeCloseTo(114.95);
    expect(marks[0].x).toBeCloseTo(115.05);
    // the second dot takes its width from the 0.2mm spacing
    expect(marks[1].x).toBeCloseTo(115.3);
    // dot marks add no simulated time; the jump before them carries it
    expect(marks.every((r) => Number.isNaN(r.f))).toBe(true);
  });

  test('keeps a break record time-neutral so the timeline cannot go NaN', () => {
    const { rows } = records(
      buildTask([...park, ...prologue(800), ...galvo(1, 0, 0), ...galvo(3, 5, 0), ...galvo(19, 1)]),
    );

    for (const row of rows) {
      if (Number.isNaN(row.x)) expect(row.f).toBeNaN();
    }
  });
});
