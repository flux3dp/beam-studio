import { CAPTURE_HALF_SPAN_MM, CAPTURE_PITCH_MM, capturePoints, PATCH_MM, toCanvasPx } from './captureGrid';

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
});
