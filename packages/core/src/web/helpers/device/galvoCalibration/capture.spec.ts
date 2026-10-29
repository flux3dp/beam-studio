import {
  CAPTURE_HALF_SPAN_MM,
  CAPTURE_PITCH_MM,
  capturePoints,
  PATCH_MM,
  patchSource,
  toCanvasPx,
} from './captureGrid';

describe('galvoCalibration capture', () => {
  it('covers the span with patches on the pitch, rows top to bottom, boustrophedon', () => {
    const points = capturePoints({ x: 100, y: 100 });

    expect(points).toHaveLength(25);
    expect(points[0]).toEqual({ x: 20, y: 20 });
    expect(points[4]).toEqual({ x: 180, y: 20 });
    expect(points[5]).toEqual({ x: 180, y: 60 });
    expect(points[20]).toEqual({ x: 20, y: 180 });
    expect(points[24]).toEqual({ x: 180, y: 180 });

    // the outermost patches reach the edge of the span
    expect(points[0].x - PATCH_MM / 2).toBeLessThanOrEqual(100 - CAPTURE_HALF_SPAN_MM);
    expect(points[4].x + PATCH_MM / 2).toBeGreaterThanOrEqual(100 + CAPTURE_HALF_SPAN_MM);
    // and neighbours overlap
    expect(PATCH_MM).toBeGreaterThan(CAPTURE_PITCH_MM);
  });

  it('maps bed mm to stitched-image px from the origin', () => {
    expect(toCanvasPx({ x: 100, y: 100 }, { x: 10, y: 10 })).toEqual({ x: 1800, y: 1800 });
    expect(toCanvasPx({ x: 15, y: 20 }, { x: 10, y: 10 }, 10)).toEqual({ x: 50, y: 100 });
  });

  describe('patchSource', () => {
    const photo = { height: 3000, width: 4000 }; // 200 × 150 mm at 20 px/mm

    it('cuts the patch from the middle when the camera landed on the tile', () => {
      expect(patchSource({ x: 0, y: 0 }, photo)).toEqual({
        dx: 0,
        dy: 0,
        offCentreMm: 0,
        sh: 1000,
        sw: 1000,
        sx: 1500,
        sy: 1000,
      });
    });

    it('moves the cut the other way when the camera stopped short', () => {
      // the camera landed 30 mm to the right of the tile, so the tile is 30 mm left of the middle
      expect(patchSource({ x: 30, y: -10 }, photo)).toEqual({
        dx: 0,
        dy: 0,
        offCentreMm: Math.hypot(30, 10),
        sh: 1000,
        sw: 1000,
        sx: 900,
        sy: 1200,
      });
    });

    it('clips the patch to the photo and places what is left where it belongs', () => {
      // 90 mm right: the tile sits 10 mm from the photo's left edge, so 15 mm of the patch is lost
      const rect = patchSource({ x: 90, y: 0 }, photo)!;

      expect(rect.sx).toBe(0);
      expect(rect.sw).toBe(700);
      expect(rect.dx).toBe(300);
      expect(rect.sy).toBe(1000);
      expect(rect.sh).toBe(1000);
      expect(rect.dy).toBe(0);
    });

    it('is null when the tile is not in the photo at all', () => {
      expect(patchSource({ x: 130, y: 0 }, photo)).toBeNull();
      expect(patchSource({ x: 0, y: -101 }, photo)).toBeNull();
    });
  });
});
