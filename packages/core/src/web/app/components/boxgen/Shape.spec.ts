import type * as THREE from 'three';

import type { IController } from '@core/interfaces/IBoxgen';

import { getFrontBackShape, getLeftRightShape, getTopBottomShape } from './Shape';

/**
 * Geometry reference for the hand-derived expectations below.
 *
 * Base box: 40 x 40 panel, sheetThickness 3, teethLength 10.
 * - inner size = 40 - 2 * 3 = 34, so teeth count per edge = round(34 / 10 / 2) = 2
 * - teeth start = -20 + (40 - 10 * 3) / 2 = -15, teeth at x/y = -15 and 5, each 10 long
 * - convex teeth protrude outward by sheetThickness (3); concave slots dip inward by 3
 */
const baseParams: IController = {
  cover: true,
  depth: 40,
  height: 40,
  joint: 'finger',
  sheetThickness: 3,
  teethLength: 10,
  tSlotCount: 1,
  tSlotDiameter: 3,
  tSlotLength: 10,
  volume: 'outer',
  width: 40,
};

// round to 6 decimals to absorb float noise (e.g. BOLT_THICK.M3 + 0.3); `+ 0` normalizes -0
const getPts = (shape: THREE.Shape): number[][] =>
  shape.getPoints().map((p) => [Math.round(p.x * 1e6) / 1e6 + 0, Math.round(p.y * 1e6) / 1e6 + 0]);

describe('getTopBottomShape', () => {
  test('finger joint traces the full known perimeter with outward teeth on all four edges', () => {
    const { height, shape, width } = getTopBottomShape(baseParams);

    expect(width).toBe(40);
    expect(height).toBe(40);

    // hand-derived: inner square is ±17, teeth protrude to ±20, two 10mm teeth per edge
    expect(getPts(shape)).toEqual([
      [-17, -17],
      // top edge, left to right (teeth stick up to y = -20)
      [-15, -17],
      [-15, -20],
      [-5, -20],
      [-5, -17],
      [5, -17],
      [5, -20],
      [15, -20],
      [15, -17],
      [17, -17],
      // right edge, top to bottom (teeth stick out to x = 20)
      [17, -15],
      [20, -15],
      [20, -5],
      [17, -5],
      [17, 5],
      [20, 5],
      [20, 15],
      [17, 15],
      [17, 17],
      // bottom edge, right to left (teeth stick down to y = 20)
      [15, 17],
      [15, 20],
      [5, 20],
      [5, 17],
      [-5, 17],
      [-5, 20],
      [-15, 20],
      [-15, 17],
      [-17, 17],
      // left edge, bottom to top (teeth stick out to x = -20)
      [-17, 15],
      [-20, 15],
      [-20, 5],
      [-17, 5],
      [-17, -5],
      [-20, -5],
      [-20, -15],
      [-17, -15],
      [-17, -17],
    ]);
  });

  test('t-slot joint carves a screw notch of tSlotDiameter into each tooth', () => {
    const { shape } = getTopBottomShape({ ...baseParams, joint: 't-slot', tSlotDiameter: 3 });

    // first tooth on the top edge (x from -15 to -5, protruding to y = -20):
    // notch is centered, (10 - 3) / 2 = 3.5 from each tooth end, 3 wide and 3 deep
    expect(getPts(shape).slice(1, 9)).toEqual([
      [-15, -17],
      [-15, -20],
      [-11.5, -20],
      [-11.5, -17],
      [-8.5, -17],
      [-8.5, -20],
      [-5, -20],
      [-5, -17],
    ]);
  });

  test('changing tSlotDiameter changes notch width, position and depth', () => {
    const { shape } = getTopBottomShape({ ...baseParams, joint: 't-slot', tSlotDiameter: 4 });

    // notch now (10 - 4) / 2 = 3 from each tooth end, 4 wide, 4 deep (to y = -16)
    expect(getPts(shape).slice(1, 9)).toEqual([
      [-15, -17],
      [-15, -20],
      [-12, -20],
      [-12, -16],
      [-8, -16],
      [-8, -20],
      [-5, -20],
      [-5, -17],
    ]);
  });
});

describe('getFrontBackShape', () => {
  test('t-slot joint cuts a slot with an M3 bolt pocket; slot depth equals tSlotLength', () => {
    const { shape } = getFrontBackShape({
      ...baseParams,
      joint: 't-slot',
      tSlotDiameter: 3,
      tSlotLength: 10,
    });

    // hand-derived for M3: boltThickness = 2.4 + 0.3 = 2.7, boltWidth = 0.25 + (5.5 - 3) / 2 = 1.5
    // slot: 3 (sheet) + 4.3 (shaft) + 2.7 (pocket) = 10 = tSlotLength deep, pocket 1.5 wider per side
    expect(getPts(shape).slice(0, 15)).toEqual([
      [-20, -20],
      [-15, -20],
      [-15, -17],
      [-11.5, -17],
      [-11.5, -12.7],
      [-13, -12.7],
      [-13, -10],
      [-11.5, -10],
      [-8.5, -10],
      [-7, -10],
      [-7, -12.7],
      [-8.5, -12.7],
      [-8.5, -17],
      [-5, -17],
      [-5, -20],
    ]);
  });

  test('increasing tSlotLength deepens the slot by the same amount', () => {
    const { shape } = getFrontBackShape({
      ...baseParams,
      joint: 't-slot',
      tSlotDiameter: 3,
      tSlotLength: 12,
    });
    const pts = getPts(shape);

    // pocket bottom moves from y = -10 to y = -20 + 12 = -8
    expect(pts[6]).toEqual([-13, -8]);
    expect(pts[8]).toEqual([-8.5, -8]);
  });

  test('cover=false leaves the top edge straight (no slots for a lid)', () => {
    const withCover = getFrontBackShape(baseParams);
    const withoutCover = getFrontBackShape({ ...baseParams, cover: false });

    // with a cover the top edge starts with the first slot at x = -15
    expect(getPts(withCover.shape)[1]).toEqual([-15, -20]);
    // without a cover it runs straight to the top-right corner
    expect(getPts(withoutCover.shape)[1]).toEqual([20, -20]);
  });
});

describe('getLeftRightShape', () => {
  test('finger joint mixes concave slots on the cover edge with convex teeth on the sides', () => {
    const { shape } = getLeftRightShape(baseParams);

    // top edge: concave slots dip inward to y = -17; side edge: convex teeth out to x = 20
    expect(getPts(shape).slice(0, 14)).toEqual([
      [-17, -20],
      [-15, -20],
      [-15, -17],
      [-5, -17],
      [-5, -20],
      [5, -20],
      [5, -17],
      [15, -17],
      [15, -20],
      [17, -20],
      [17, -15],
      [20, -15],
      [20, -5],
      [17, -5],
    ]);
  });
});
