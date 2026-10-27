import { parseGcode } from './tmpParseGcode';

const STRIDE = 9;
const record = (parsed: ReturnType<typeof parseGcode>, index: number) =>
  Array.from({ length: STRIDE }, (_, k) => parsed.getItem(index * STRIDE + k));

// an inner engraving dot job, as Swiftray writes it: the jump to the first dot with S0, then a
// power-only line that fires the first dot where the beam is, then one line per dot
const innerEngravingDots = [
  ';CONFIG RESET',
  ';CONFIG INNER_ENGRAVING=1',
  'G90',
  'T100',
  'M3S0',
  'G1F240000X10Y20S0',
  'F1200S150',
  'X10.03',
  'X10.06',
  'M2',
].join('\n');

describe('parseGcode', () => {
  test('inner engraving dots become a jump record and a one-pitch mark that carries the dotting time', () => {
    const parsed = parseGcode(innerEngravingDots, true);
    const records = Array.from({ length: parsed.length / STRIDE }, (_, k) => record(parsed, k));
    // the jump to (10, 20) with the laser off
    const jump = records.find((r) => r[0] === 0 && r[1] === 10);

    expect(jump).toBeDefined();

    const dots = records.filter((r) => r[0] === 1);

    expect(dots).toHaveLength(3);

    // the first dot knows no pitch yet and is drawn 0.1 mm wide; the next ones measure 0.03 mm to
    // their neighbour. Each mark starts half a pitch before the dot and ends half a pitch after it
    expect(dots[0][1]).toBeCloseTo(10.05);
    expect(dots[1][1]).toBeCloseTo(10.045);
    expect(dots[2][1]).toBeCloseTo(10.075);
    // y is negated into preview space
    expect(dots[0][2]).toBeCloseTo(-20);

    dots.forEach((dot) => {
      // feedrate-less, so the renderer adds no distance; the e slot is the 100 us dwell in minutes
      expect(dot[5]).toBeNaN();
      expect(dot[4]).toBeCloseTo(100 / 60000000, 12);
      expect(dot[7]).toBe(150);
      expect(dot[8]).toBe(100);
    });

    // every dot is preceded by its own travel record, so the segment between dots is traversal
    const travels = records.filter((r, k) => records[k + 1]?.[0] === 1 && r[0] === 0);

    expect(travels).toHaveLength(3);
    expect(travels[1][1]).toBeCloseTo(10.015);
    expect(travels[1][7]).toBe(0);
  });

  test('the same gcode without the inner engraving flag is drawn as lines, as 2D Promark always was', () => {
    const parsed = parseGcode(innerEngravingDots.replace(';CONFIG INNER_ENGRAVING=1\n', ''), true);
    const records = Array.from({ length: parsed.length / STRIDE }, (_, k) => record(parsed, k));

    expect(records.filter((r) => r[0] === 1)).toHaveLength(3);
    expect(records.every((r) => r[4] === 0 && !Number.isNaN(r[5]))).toBe(true);
  });
});
