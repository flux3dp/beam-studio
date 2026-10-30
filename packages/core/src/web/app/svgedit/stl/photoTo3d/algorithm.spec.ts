import { cleanDepthEdges, getDepthStats, liftDots, makeDepthSampler } from './depthField';
import { decodeDepthSource, depthSourceFromApi, encodeDepthSource } from './depthSource';
import { ditherPhoto } from './dither';
import { generatePhotoTo3dPoints, MAX_PHOTO_TO_3D_CELLS, PhotoTo3dError } from './generate';

/** RGBA pixels of one grey level and alpha. */
const solid = (width: number, height: number, grey: number, alpha = 255) => {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < width * height; i += 1) data.set([grey, grey, grey, alpha], i * 4);

  return { data, height, width };
};

/** A depth that falls from left to right: the left edge is far, the right edge near. */
const ramp = (width: number, height: number) => {
  const depth = new Float32Array(width * height);

  for (let i = 0; i < depth.length; i += 1) depth[i] = width - (i % width);

  return { depth, height, mask: new Uint8Array(width * height).fill(1), width };
};

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

describe('depth source', () => {
  test('round-trips through the BSDM binary', () => {
    const source = { ...ramp(3, 2), mask: Uint8Array.from([1, 0, 1, 1, 0, 1]) };
    const decoded = decodeDepthSource(encodeDepthSource(source));

    expect(decoded.width).toBe(3);
    expect(decoded.height).toBe(2);
    expect(Array.from(decoded.depth)).toEqual(Array.from(source.depth));
    expect(Array.from(decoded.mask)).toEqual([1, 0, 1, 1, 0, 1]);
  });

  test('rejects a binary that is not BSDM or does not match its size', () => {
    const buffer = encodeDepthSource(ramp(2, 2));

    expect(() => decodeDepthSource(buffer.slice(0, buffer.byteLength - 1))).toThrow('does not match');
    new Uint8Array(buffer)[0] = 0;
    expect(() => decodeDepthSource(buffer)).toThrow('magic');
  });

  test('reads the flux-id response: base64 float32 LE depth and uint8 mask', () => {
    const depth = new Uint8Array(Float32Array.from([1.5, -2]).buffer);
    const source = depthSourceFromApi({
      depth: toBase64(depth),
      height: 1,
      mask: toBase64(Uint8Array.from([1, 0])),
      width: 2,
    });

    expect(Array.from(source.depth)).toEqual([1.5, -2]);
    expect(Array.from(source.mask)).toEqual([1, 0]);
    expect(() => depthSourceFromApi({ depth: toBase64(depth), height: 2, mask: 'AA==', width: 2 })).toThrow();
  });
});

describe('dither', () => {
  test('bright areas get dots, dark ones none: a dot shows white in the crystal', () => {
    expect(ditherPhoto(solid(4, 4, 255), 4, 4, { amount: 0, radius: 1 }).dots.every((dot) => dot === 1)).toBe(true);
    expect(ditherPhoto(solid(4, 4, 0), 4, 4, { amount: 0, radius: 1 }).dots.every((dot) => dot === 0)).toBe(true);
  });

  test('mid grey dithers to about half the cells, on a grid finer than the photo too', () => {
    const { dots, height, width } = ditherPhoto(solid(10, 10, 128), 40, 20, { amount: 0, radius: 1 });
    const share = dots.reduce((sum, dot) => sum + dot, 0) / dots.length;

    expect([width, height]).toEqual([40, 20]);
    expect(share).toBeGreaterThan(0.4);
    expect(share).toBeLessThan(0.6);
  });

  test('the removed background gets no dots', () => {
    expect(ditherPhoto(solid(4, 4, 255, 0), 4, 4, { amount: 1, radius: 2 }).dots.every((dot) => dot === 0)).toBe(true);
  });
});

describe('depth field', () => {
  test('stats are the 1st and 99th percentile of the subject only', () => {
    const depth = Float32Array.from({ length: 101 }, (_, i) => i);
    const mask = new Uint8Array(101).fill(1);

    mask[100] = 0;

    expect(getDepthStats({ depth, mask })).toEqual({ lower: 1, upper: 98, valid: 100 });
  });

  test('the sampler is bicubic inside, bilinear next to the mask, NaN outside', () => {
    const field = ramp(6, 6);

    expect(makeDepthSampler(field)(2.5, 2.5)).toBeCloseTo(3.5);
    field.mask[0] = 0;
    // (0.5, 0.5) touches the masked pixel: the other three corners only
    expect(makeDepthSampler(field)(0.5, 0.5)).toBeCloseTo((6 + 5 + 5) / 3);
    expect(makeDepthSampler({ ...field, mask: new Uint8Array(36) })(1, 1)).toBeNaN();
  });

  test('the near side is raised: depth is inverted on the way to Z', () => {
    const source = ramp(20, 4);
    const stats = getDepthStats(source);
    const dither = { dots: new Uint8Array(4).fill(1), height: 1, width: 4 };
    const points = liftDots(source, stats, dither, { depthMm: 10, heightMm: 5, widthMm: 40 });
    const base = Array.from({ length: 4 }, (_, i) => points.slice(i * 3, i * 3 + 3));

    // the four dots are centred on the photo, in order across it
    expect(base.map(([x]) => x)).toEqual([-15, -5, 5, 15]);
    expect(base[0][2]).toBeLessThan(base[3][2]);
    base.forEach(([, , z]) => {
      expect(z).toBeGreaterThanOrEqual(0);
      expect(z).toBeLessThanOrEqual(10);
    });
  });

  test('transparent pixels of the photo leave the cleaned depth', () => {
    const source = ramp(8, 8);
    const pixels = solid(8, 8, 200);

    // the left half is cut out
    for (let i = 0; i < 64; i += 1) if (i % 8 < 4) pixels.data[i * 4 + 3] = 0;

    const field = cleanDepthEdges(source, getDepthStats(source), pixels, {
      depthMm: 5,
      levelMm: 0,
      roundMm: 0,
      widthMm: 8,
    });

    expect(Array.from(field.mask.slice(0, 8))).toEqual([0, 0, 0, 0, 1, 1, 1, 1]);
  });

  // 100 × 8, the left 10 columns cut out: a rim 4 px wide (levelMm 4 at 1 mm per px), background told
  // by the nearest surface within 8 px. depth 1 is near (Z 10), 2 is far (Z 0)
  const rimPhoto = () => {
    const pixels = solid(100, 8, 200);

    for (let i = 0; i < 800; i += 1) if (i % 100 < 10) pixels.data[i * 4 + 3] = 0;

    return pixels;
  };
  const rimStats = { lower: 1, upper: 2, valid: 720 };
  const z = (field: { depth: Float32Array }, x: number, y: number) => (1 - (field.depth[y * 100 + x] - 1)) * 10;

  test('background the cut-out kept, at the far end of the depth, is removed from the rim', () => {
    const source = { ...ramp(100, 8), depth: new Float32Array(800).fill(1) };

    // a strip of background depth along the whole cut-out
    for (let i = 0; i < 800; i += 1) if (i % 100 >= 10 && i % 100 < 14) source.depth[i] = 2;

    const field = cleanDepthEdges(source, rimStats, rimPhoto(), { depthMm: 10, levelMm: 4, roundMm: 0, widthMm: 100 });

    expect(field.mask[3 * 100 + 10]).toBe(0);
    expect(field.mask[3 * 100 + 14]).toBe(1);
    expect(z(field, 50, 3)).toBeCloseTo(10);
  });

  test('a stretch of rim behind the rest of the rim is lifted toward its mean, fully on the cut-out and fading inward', () => {
    const source = { ...ramp(100, 8), depth: new Float32Array(800).fill(1) };

    // the lower half of the rim sits 3 mm behind the rest
    for (let i = 0; i < 800; i += 1) if (i >= 400 && i % 100 >= 10 && i % 100 < 14) source.depth[i] = 1.3;

    const field = cleanDepthEdges(source, rimStats, rimPhoto(), { depthMm: 10, levelMm: 4, roundMm: 0, widthMm: 100 });

    expect(field.mask[6 * 100 + 10]).toBe(1);
    expect(z(field, 10, 6)).toBeGreaterThan(7.5);
    expect(z(field, 10, 6)).toBeLessThan(10);
    expect(z(field, 12, 6)).toBeGreaterThan(7);
    expect(z(field, 12, 6)).toBeLessThan(z(field, 10, 6));
    expect(z(field, 40, 6)).toBeCloseTo(10);
    // the rim that already is at the level, and the inside, do not move
    expect(z(field, 10, 1)).toBeCloseTo(10);
  });

  test('a rim that recedes evenly stays behind the surface inside it', () => {
    const source = { ...ramp(100, 8), depth: new Float32Array(800).fill(1) };

    for (let i = 0; i < 800; i += 1) if (i % 100 >= 10 && i % 100 < 14) source.depth[i] = 1.3;

    const field = cleanDepthEdges(source, rimStats, rimPhoto(), { depthMm: 10, levelMm: 4, roundMm: 0, widthMm: 100 });

    // the fringe step alone bends the rim's last pixels up toward the inside
    expect(z(field, 10, 4)).toBeLessThan(7.6);
    expect(z(field, 11, 4)).toBeLessThan(7.6);
    expect(z(field, 40, 4)).toBeCloseTo(10);
  });

  test('the roll-off lowers the surface next to the cut-out only', () => {
    const source = { ...ramp(20, 1), depth: new Float32Array(20).fill(1) };

    source.depth[19] = 2;

    const pixels = solid(20, 1, 200);

    pixels.data[3] = 0;

    const stats = { lower: 1, upper: 2, valid: 20 };
    const plain = cleanDepthEdges(source, stats, pixels, { depthMm: 10, levelMm: 0, roundMm: 0, widthMm: 20 });
    const rounded = cleanDepthEdges(source, stats, pixels, { depthMm: 10, levelMm: 0, roundMm: 4, widthMm: 20 });

    // farther depth = lower Z: the pixel next to the cut-out moves away, the far end does not
    expect(rounded.depth[1]).toBeGreaterThan(plain.depth[1]);
    expect(rounded.depth[15]).toBeCloseTo(plain.depth[15]);
  });
});

describe('generatePhotoTo3dPoints', () => {
  const params = { edgeRoundMm: 0, pointSpacing: 1, sharpenAmount: 0, sharpenRadius: 1 };

  test('dots the photo at the point spacing, within the world size', () => {
    const points = generatePhotoTo3dPoints(solid(10, 5, 255), ramp(10, 5), { depth: 3, height: 5, width: 10 }, params);

    // a white photo dots every cell of the 10 × 5 grid, plus a few extra on the slope
    expect(points.length / 3).toBeGreaterThanOrEqual(50);

    for (let i = 0; i < points.length; i += 3) {
      expect(Math.abs(points[i])).toBeLessThanOrEqual(5);
      expect(Math.abs(points[i + 1])).toBeLessThanOrEqual(2.5);
      expect(points[i + 2]).toBeGreaterThanOrEqual(0);
      expect(points[i + 2]).toBeLessThanOrEqual(3);
    }
  });

  test('a flat depth, a dark photo or a huge grid cannot be converted', () => {
    const flat = { ...ramp(4, 4), depth: new Float32Array(16).fill(1) };
    const size = { depth: 1, height: 4, width: 4 };
    const reason = (run: () => unknown) => {
      try {
        run();
      } catch (error) {
        return error instanceof PhotoTo3dError ? error.reason : 'other';
      }

      return null;
    };

    expect(reason(() => generatePhotoTo3dPoints(solid(4, 4, 255), flat, size, params))).toBe('flat');
    expect(reason(() => generatePhotoTo3dPoints(solid(4, 4, 0), ramp(4, 4), size, params))).toBe('no-points');
    expect(
      reason(() =>
        generatePhotoTo3dPoints(solid(4, 4, 255), ramp(4, 4), { ...size, width: MAX_PHOTO_TO_3D_CELLS }, params),
      ),
    ).toBe('too-many-points');
  });
});
