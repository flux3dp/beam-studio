import {
  CAPTURE_AIM_INSET_MM,
  CAPTURE_HALF_SPAN_MM,
  CAPTURE_PITCH_MM,
  captureAim,
  capturePoints,
  expectedPhotoSize,
  PATCH_MM,
  patchSource,
  planTile,
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

  describe('planTile', () => {
    // A grid like hx2GalvoPerspectiveGridWide's (the camera looks to the left of the head), wider
    // than today's so the numbers below stay round.
    const grid = { x: [-260, 0, 10] as [number, number, number], y: [0, 145, 10] as [number, number, number] };
    const travel = { maxX: 600, maxY: 520, minX: 0, minY: 0 };

    it('aims the head-side part of the frame at the tile, not the middle', () => {
      expect(captureAim(grid)).toEqual({ x: -CAPTURE_AIM_INSET_MM, y: 72.5 });
      expect(captureAim(grid, 100)).toEqual({ x: -100, y: 72.5 });
    });

    it('sends the gantry so that the aim point lands on the tile', () => {
      const plan = planTile({ x: 20, y: 20 }, grid, travel);

      expect(plan.camera).toEqual({ x: 80, y: 0 });
      expect(plan.shift).toEqual({ x: 0, y: 52.5 });
      // the aim point's pixel: 200 mm from the grid's left edge, 72.5 from its top, at 20 px/mm
      expect(plan.anchor).toEqual({ x: 4000, y: 1450 });
    });

    it('holds the gantry to its travel only, not to keeping the frame on the bed', () => {
      // the middle of the frame would need the gantry at x = 150 for this tile and the preview's
      // own rule would push it to 260; aiming near the head needs only 80, which the travel allows
      const plan = planTile({ x: 20, y: 100 }, grid, travel);

      expect(plan.camera).toEqual({ x: 80, y: 27.5 });
      expect(plan.shift).toEqual({ x: 0, y: 0 });
    });

    it('reports how far the travel stopped it short', () => {
      const plan = planTile({ x: 180, y: 180 }, grid, { ...travel, maxX: 200 });

      expect(plan.camera).toEqual({ x: 200, y: 107.5 });
      expect(plan.shift).toEqual({ x: -40, y: 0 });
    });

    it('knows what size the remapped frame comes back at', () => {
      expect(expectedPhotoSize(grid)).toEqual({ height: 2900, width: 5200 });
      expect(expectedPhotoSize(grid, 5)).toEqual({ height: 725, width: 1300 });
    });
  });

  describe('patchSource', () => {
    const photo = { height: 3000, width: 4000 }; // 200 × 150 mm at 20 px/mm

    it('cuts the patch from the middle when nothing says otherwise', () => {
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

    it('cuts the patch around the anchor when given one', () => {
      expect(patchSource({ x: 0, y: 0 }, photo, { anchor: { x: 3000, y: 1450 } })).toEqual({
        dx: 0,
        dy: 0,
        offCentreMm: 0,
        sh: 1000,
        sw: 1000,
        sx: 2500,
        sy: 950,
      });
    });

    it('moves the cut the other way when the camera stopped short', () => {
      // the camera landed 30 mm to the right of where it was sent, so the tile is 30 mm left of the anchor
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
