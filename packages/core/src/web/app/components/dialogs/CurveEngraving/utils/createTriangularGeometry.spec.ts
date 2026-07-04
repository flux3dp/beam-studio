import * as THREE from 'three';

// delaunator is ESM-only (not transformed by ts-jest); it is imported at module top by
// createTriangularGeometry.ts but not used by the functions under test, so stub it out.
jest.mock('delaunator', () => ({
  __esModule: true,
  default: { from: jest.fn() },
}));

import { interpolateTriangles, setGeometryAngleAlertColor } from './createTriangularGeometry';

type Point3D = [number, number, number];
type Triangle = [Point3D, Point3D, Point3D];

// non-indexed triangle soup, same layout createTriangularGeometry produces (3 vertices per face)
const buildGeometry = (triangles: Triangle[]): THREE.BufferGeometry => {
  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(triangles.flat(2), 3));

  return geometry;
};

const FLAT: Triangle = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
];
const TILT_30: Triangle = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, Math.tan(Math.PI / 6)],
];
const TILT_60: Triangle = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, Math.tan(Math.PI / 3)],
];

describe('setGeometryAngleAlertColor', () => {
  it('returns the max plane angle and paints only >45° faces with the alert (red) color', () => {
    const geometry = buildGeometry([FLAT, TILT_30, TILT_60]);
    const maxAngle = setGeometryAngleAlertColor(geometry);

    expect(maxAngle).toBeCloseTo(60, 2);

    const colors = geometry.getAttribute('color');

    expect(colors.count).toBe(9);

    // flat (0°) and 30° faces stay default white on every vertex
    for (let i = 0; i < 6; i += 1) {
      expect([colors.getX(i), colors.getY(i), colors.getZ(i)]).toEqual([1, 1, 1]);
    }

    // 60° face gets the alert color on all 3 vertices
    for (let i = 6; i < 9; i += 1) {
      expect(colors.getX(i)).toBeCloseTo(1, 5);
      expect(colors.getY(i)).toBeCloseTo(2 / 3, 5);
      expect(colors.getZ(i)).toBeCloseTo(2 / 3, 5);
    }
  });

  it('respects a custom angle threshold', () => {
    const geometry = buildGeometry([TILT_30, TILT_60]);
    const maxAngle = setGeometryAngleAlertColor(geometry, 25);

    expect(maxAngle).toBeCloseTo(60, 2);

    const colors = geometry.getAttribute('color');

    // with threshold 25 the 30° face is flagged too
    expect(colors.getY(0)).toBeCloseTo(2 / 3, 5);
    expect(colors.getY(3)).toBeCloseTo(2 / 3, 5);
  });

  it('reports 0 and keeps everything white for a flat mesh', () => {
    const geometry = buildGeometry([FLAT]);

    expect(setGeometryAngleAlertColor(geometry)).toBeCloseTo(0, 5);

    const colors = geometry.getAttribute('color');

    expect([colors.getX(0), colors.getY(0), colors.getZ(0)]).toEqual([1, 1, 1]);
  });
});

describe('interpolateTriangles', () => {
  // lies on the plane z = x, so any correct midpoint subdivision keeps z === x
  const triangle: Triangle = [
    [0, 0, 0],
    [4, 0, 4],
    [0, 3, 0],
  ];

  it('returns triangles unchanged when every 2D edge is within the limit', () => {
    expect(interpolateTriangles([triangle], 10)).toEqual([triangle]);
  });

  it('subdivides until every 2D edge is within the limit while preserving the z profile', () => {
    const result = interpolateTriangles([triangle], 2.5);

    expect(result.length).toBeGreaterThan(1);

    for (const [p1, p2, p3] of result) {
      for (const [a, b] of [
        [p1, p2],
        [p2, p3],
        [p3, p1],
      ] as const) {
        expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeLessThanOrEqual(2.5);
      }

      // midpoint bisection must not bend the surface: all vertices stay on z = x
      for (const p of [p1, p2, p3]) {
        expect(p[2]).toBeCloseTo(p[0], 10);
      }
    }
  });
});
