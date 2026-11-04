import type { GalvoFieldCorrection } from './galvoConfig';
import {
  CORRECTED_PIECE_MM,
  fieldDisplacement,
  isFieldCorrectionUsable,
  predistort,
  predistortPath,
} from './galvoFieldCorrection';

/** A table sampled from a known field D(x, y), size x size over 110 mm, X fastest. */
const sample = (d: (x: number, y: number) => [number, number], size = 17): GalvoFieldCorrection => {
  const dx: number[] = [];
  const dy: number[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const [vx, vy] = d(-55 + (col * 110) / (size - 1), -55 + (row * 110) / (size - 1));

      dx.push(vx);
      dy.push(vy);
    }
  }

  return { dx, dy, field: 110, size };
};

// the f-theta residual the manual coefficients leave: 0.48 mm of x^3 at 44, and a little shear
const k = 0.48 / 44 ** 3;
const field = (x: number, y: number): [number, number] => [k * x ** 3 + 0.002 * y, k * y ** 3];

describe('galvoFieldCorrection', () => {
  it('reproduces the table at its own points and runs X fastest', () => {
    const table = sample((x, y) => [x / 100, y / 1000], 3);

    expect(fieldDisplacement(table, { x: -55, y: -55 })).toEqual({ x: -0.55, y: -0.055 });
    expect(fieldDisplacement(table, { x: 55, y: -55 }).x).toBeCloseTo(0.55);
    expect(fieldDisplacement(table, { x: -55, y: 0 }).y).toBeCloseTo(0);
  });

  it('aims so that the field lands the beam on target', () => {
    const table = sample(field);
    let worst = 0;

    for (let x = -50; x <= 50; x += 5) {
      for (let y = -50; y <= 50; y += 5) {
        const aim = predistort(table, { x, y });
        const [dx, dy] = field(aim.x, aim.y);

        worst = Math.max(worst, Math.hypot(aim.x + dx - x, aim.y + dy - y));
      }
    }

    // a 17 x 17 table interpolated bilinearly; swiftray's twin measures the same 0.013 mm
    expect(worst).toBeLessThan(0.015);
  });

  it('leaves points alone without a usable table', () => {
    const point = { x: 12.5, y: -3 };

    expect(predistort(null, point)).toBe(point);
    expect(predistort(undefined, point)).toBe(point);
    expect(predistort({ dx: [0], dy: [0], field: 110, size: 9 }, point)).toBe(point);
    expect(isFieldCorrectionUsable({ dx: [0, 0, 0, 0], dy: [0, 0, 0, 0], field: 110, size: 2 })).toBe(true);
  });

  it('cuts a path into pieces short enough for the correction to bend', () => {
    const table = sample(field);
    const path = predistortPath(table, [
      { x: -40, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 1 },
    ]);

    // 80 mm in 4 mm pieces, then a 1 mm segment left whole
    expect(path).toHaveLength(1 + 80 / CORRECTED_PIECE_MM + 1);
    expect(path[0]).toEqual(predistort(table, { x: -40, y: 0 }));
    expect(path.at(-1)).toEqual(predistort(table, { x: 40, y: 1 }));
    expect(predistortPath(null, [{ x: 0, y: 0 }])).toEqual([{ x: 0, y: 0 }]);
  });
});
