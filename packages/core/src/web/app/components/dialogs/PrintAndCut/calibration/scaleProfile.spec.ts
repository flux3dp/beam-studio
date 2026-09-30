jest.mock('@core/app/svgedit/workarea', () => ({ modelHeight: 7000, width: 7000 }));

import { readFileSync } from 'fs';
import { join } from 'path';

import { PNG } from 'pngjs';

import { dpmm } from '@core/app/actions/beambox/constant';

import type { RigidTransform } from '../utils/rigidTransform';
import { applyRigidTransform } from '../utils/rigidTransform';

import type { ScaleAxis } from './layout';
import {
  lengthFactor,
  PRINTED_PITCH_MM,
  READING_MAX,
  SCALE_LINE_COUNT,
  SCALE_SHIFT_MM,
  SCRATCH_LINE_MM,
  SCRATCH_PITCH_MM,
} from './layout';
import type { DarknessSampler, LinePositions } from './scaleProfile';
import {
  createDarknessSampler,
  estimateReading,
  extractProfile,
  findLinePositionsMm,
  getScaleBands,
  measureScratchLengthsMm,
} from './scaleProfile';

const SIZE = 900;
const bbox = { height: 800, width: 800, x: 50, y: 50 };
const center = { x: 450, y: 450 };
// the sheet sits slightly rotated and shifted under the camera
const transform = { angle: 0.03, tx: 12.3, ty: -7.7 } as RigidTransform;
const identity = { angle: 0, tx: 0, ty: 0 } as RigidTransform;
const indices = Array.from({ length: SCALE_LINE_COUNT }, (_, i) => i - READING_MAX);

/** White paper with black lines, drawn in the sheet frame then mapped through the transform */
const makeSheet = (lines: Array<{ from: [number, number]; to: [number, number] }>): ImageData => {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4).fill(255);
  const paint = (x: number, y: number) => {
    const px = Math.round(x);
    const py = Math.round(y);

    if (px < 0 || py < 0 || px >= SIZE || py >= SIZE) return;

    const i = (py * SIZE + px) * 4;

    data[i] = data[i + 1] = data[i + 2] = 0;
  };

  lines.forEach(({ from, to }) => {
    const steps = 400;

    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const p = applyRigidTransform(
        { x: from[0] + (to[0] - from[0]) * t, y: from[1] + (to[1] - from[1]) * t },
        transform,
      );

      // ~2 px wide line, painted symmetrically so the true center stays at p
      paint(p.x - 0.5, p.y);
      paint(p.x + 0.5, p.y);
    }
  });

  return { colorSpace: 'srgb', data, height: SIZE, width: SIZE } as ImageData;
};

/** Vertical lines (the x scale, shifted left of the center) at the given mm offsets, spanning the given band, in sheet px */
const verticalLines = (offsetsMm: number[], fromMm: number, toMm: number) =>
  offsetsMm.map((mm) => ({
    from: [center.x + (mm - SCALE_SHIFT_MM) * 10, center.y + fromMm * 10] as [number, number],
    to: [center.x + (mm - SCALE_SHIFT_MM) * 10, center.y + toMm * 10] as [number, number],
  }));

const readWith = (darkness: DarknessSampler, box: typeof bbox, tf: RigidTransform, axis: ScaleAxis): LinePositions => {
  const { printed, scratch } = getScaleBands(axis);
  const scratchMm = findLinePositionsMm(extractProfile(darkness, box, tf, scratch));

  return {
    printedMm: findLinePositionsMm(extractProfile(darkness, box, tf, printed)),
    scratchLengthsMm: measureScratchLengthsMm(darkness, box, tf, axis, scratchMm),
    scratchMm,
  };
};

describe('scaleProfile (synthetic sheet)', () => {
  const { printed, scratch } = getScaleBands('x');
  const scratchOffsetMm = 0.35;
  /** The x scale's comb at `offsetMm`, with the printed length pattern, restricted to `keep` indices, `extraMm` longer than designed */
  const combLines = (offsetMm: number, keep: (index: number) => boolean, extraMm = 0) =>
    indices
      .filter(keep)
      .flatMap((i) =>
        verticalLines(
          [offsetMm + i * SCRATCH_PITCH_MM],
          scratch.toMm - lengthFactor(i) * SCRATCH_LINE_MM - extraMm,
          scratch.toMm,
        ),
      );
  const printedLines = verticalLines(
    indices.map((k) => k * PRINTED_PITCH_MM),
    printed.fromMm,
    printed.toMm + 4,
  );
  const readSheet = (image: ImageData) => readWith(createDarknessSampler(image, 1), bbox, transform, 'x');
  const image = makeSheet([...printedLines, ...combLines(scratchOffsetMm, () => true)]);
  const darkness = createDarknessSampler(image, 1);

  test('createDarknessSampler reads black as 255, white as 0, outside as 0', () => {
    const onLine = applyRigidTransform(
      { x: center.x - SCALE_SHIFT_MM * 10, y: center.y + (printed.fromMm + 2) * 10 },
      transform,
    );

    expect(darkness(onLine)).toBeGreaterThan(200);
    expect(darkness({ x: 5, y: 5 })).toBe(0);
    expect(darkness({ x: -1, y: 5 })).toBe(0);
  });

  test('recovers the printed scale line positions on a rotated sheet', () => {
    const positions = findLinePositionsMm(extractProfile(darkness, bbox, transform, printed));

    expect(positions).toHaveLength(SCALE_LINE_COUNT);
    positions.forEach((pos, i) => expect(Math.abs(pos - indices[i] * PRINTED_PITCH_MM)).toBeLessThan(0.03));
  });

  test('recovers the scratched comb positions including their offset', () => {
    const positions = findLinePositionsMm(extractProfile(darkness, bbox, transform, scratch));

    expect(positions).toHaveLength(SCALE_LINE_COUNT);
    positions.forEach((pos, i) =>
      expect(Math.abs(pos - (scratchOffsetMm + indices[i] * SCRATCH_PITCH_MM))).toBeLessThan(0.03),
    );
  });

  test('measures the length pattern: middle 1.5×, every 5th 1.25×, the rest 1×', () => {
    const { scratchLengthsMm } = readSheet(image);

    expect(scratchLengthsMm).toHaveLength(SCALE_LINE_COUNT);
    scratchLengthsMm.forEach((length, i) =>
      expect(Math.abs(length - lengthFactor(indices[i]) * SCRATCH_LINE_MM)).toBeLessThan(0.35),
    );
  });

  test('estimateReading recovers the offset from a complete comb', () => {
    const estimate = estimateReading(readSheet(image));

    expect(estimate).not.toBeNull();
    expect(Math.abs(estimate!.offsetMm - scratchOffsetMm)).toBeLessThan(0.02);
    expect(estimate!.reading).toBe(7);
  });

  test('estimateReading tolerates a sparse comb anchored by a long line', () => {
    // faint lower half, as seen on hardware: only indices -20..3 burned visibly, offset past half a pitch
    const sparse = makeSheet([...printedLines, ...combLines(-0.6, (i) => i <= 3)]);
    const estimate = estimateReading(readSheet(sparse));

    expect(estimate?.reading).toBe(-12);
    expect(estimate?.scratchCount).toBe(24);
  });

  test('estimateReading still anchors when every burn is 2.5 mm longer than designed', () => {
    const long = makeSheet([...printedLines, ...combLines(-0.6, (i) => i <= 3, 2.5)]);

    expect(estimateReading(readSheet(long))?.reading).toBe(-12);
  });

  test('estimateReading settles the printed index by the origin prior when an end line is missing', () => {
    const lines = readSheet(image);
    // drop the last printed line: the extent no longer pins the shift, the origin prior must
    const shortened = { ...lines, printedMm: lines.printedMm.slice(0, -1) };

    expect(estimateReading(shortened)?.reading).toBe(7);
  });

  test('estimateReading refuses a sparse comb without an anchor', () => {
    // 8 lines, none on the 5-grid, far from both ends: the index shift cannot be settled
    const unanchored = makeSheet([
      ...printedLines,
      ...combLines(-0.6, (i) => [6, 7, 8, 9, 11, 12, 13, 14].includes(i)),
    ]);

    expect(estimateReading(readSheet(unanchored))).toBeNull();
  });

  test('estimateReading rejects a printed scale too sparse to index and out-of-range offsets', () => {
    const lines = readSheet(image);

    expect(estimateReading({ ...lines, printedMm: lines.printedMm.slice(0, 20) })).toBeNull();
    expect(
      estimateReading({
        ...lines,
        scratchLengthsMm: lines.scratchMm.map(() => 6),
        scratchMm: lines.scratchMm.map((v) => v + 2.5),
      }),
    ).toBeNull();
  });

  test('drops a faint fleck beside a line instead of counting it', () => {
    // a 0.5 mm stub 0.3 mm from scratched line 4, in the base band only
    const fleck = verticalLines([scratchOffsetMm + 4 * SCRATCH_PITCH_MM + 0.3], scratch.toMm - 0.5, scratch.toMm);
    const positions = findLinePositionsMm(
      extractProfile(
        createDarknessSampler(makeSheet([...printedLines, ...combLines(scratchOffsetMm, () => true), ...fleck]), 1),
        bbox,
        transform,
        scratch,
      ),
    );

    expect(positions).toHaveLength(SCALE_LINE_COUNT);
  });

  test('a band with no lines yields no positions', () => {
    const blank = makeSheet([]);

    expect(findLinePositionsMm(extractProfile(createDarknessSampler(blank, 1), bbox, transform, printed))).toEqual([]);
  });
});

describe('scaleProfile (hardware crops)', () => {
  /**
   * Grayscale crops of one scale each from real runs, as written by the dev
   * debug dump (raw camera crop, no overlay). Pixel
   * (0,0) of a crop is sheet point (u0, v0) at `pxPerMm`; rotation is
   * negligible. Any detector change must keep reading every one of them.
   */
  interface HardwareCrop {
    axis: ScaleAxis;
    file: string;
    pxPerMm: number;
    reading: number;
    u0Mm: number;
    v0Mm: number;
  }

  const crops: HardwareCrop[] = [
    { axis: 'x', file: 'read-scales-x-beamo.png', pxPerMm: 10.05, reading: -1, u0Mm: -23, v0Mm: 4 },
    { axis: 'y', file: 'read-scales-y-beamo.png', pxPerMm: 10.05, reading: -1, u0Mm: -23, v0Mm: 4 },
  ];

  /** Decode the crop and place the box so that toSheetPoint lands pixel (0,0) on (u0, v0) at `ratio` image px per canvas px */
  const loadCrop = ({ axis, file, pxPerMm, u0Mm, v0Mm }: HardwareCrop) => {
    const png = PNG.sync.read(readFileSync(join(__dirname, '__fixtures__', file)));
    const image = {
      colorSpace: 'srgb',
      data: new Uint8ClampedArray(png.data),
      height: png.height,
      width: png.width,
    } as ImageData;
    const size = 800;
    const along = (SCALE_SHIFT_MM - u0Mm) * dpmm - size / 2;
    const across = -v0Mm * dpmm - size / 2;
    const box =
      axis === 'x'
        ? { height: size, width: size, x: along, y: across }
        : { height: size, width: size, x: across, y: along };

    return { box, darkness: createDarknessSampler(image, pxPerMm / dpmm) };
  };

  test.each(crops.map((crop) => [crop.file, crop]))('reads %s as expected', (_, crop) => {
    const { box, darkness } = loadCrop(crop);
    const lines = readWith(darkness, box, identity, crop.axis);

    expect(lines.printedMm).toHaveLength(SCALE_LINE_COUNT);
    expect(lines.scratchMm).toHaveLength(SCALE_LINE_COUNT);
    expect(estimateReading(lines)?.reading).toBe(crop.reading);
  });
});
