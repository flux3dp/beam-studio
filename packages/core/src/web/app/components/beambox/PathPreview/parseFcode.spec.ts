// tmpParseGcode.js is untransformed ESM; decodePixelRuns never touches it.
jest.mock('./tmpParseGcode', () => ({ ParsedGcode: class {} }));

import { decodePixelRuns, decodePrinterSwath } from './parseFcode';

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
