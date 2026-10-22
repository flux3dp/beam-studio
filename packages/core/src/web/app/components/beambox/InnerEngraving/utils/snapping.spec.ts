import { Vector3 } from 'three';

import { ROTATION_SNAP_RAD, snapPosition, snapScale, TRANSLATION_SNAP } from './snapping';

describe('inner engraving snapping', () => {
  beforeEach(() => jest.clearAllMocks());

  test('uses 15 degree rotation and 1mm translation steps', () => {
    expect(ROTATION_SNAP_RAD).toBeCloseTo(Math.PI / 12);
    expect(TRANSLATION_SNAP).toBe(10);
  });

  test('snaps position to the grid and nearby engravable centre', () => {
    const position = new Vector3(14, 104, 27);

    snapPosition(position, [15, 100, 25]);

    expect(position.toArray()).toEqual([15, 100, 25]);
  });

  test('snaps unlocked dimensions independently to whole millimetres', () => {
    const scale = new Vector3(1.24, 0.76, 1);

    snapScale(scale, new Vector3(10, 10, 0), false);

    expect(scale.toArray()).toEqual([1.2, 0.8, 1]);
  });

  test('preserves the ratio lock while snapping the longest dimension', () => {
    const scale = new Vector3(1.24, 1.24, 1.24);

    snapScale(scale, new Vector3(10, 5, 1), true);

    expect(scale.x).toBeCloseTo(1.2);
    expect(scale.y).toBeCloseTo(1.2);
    expect(scale.z).toBeCloseTo(1.2);
  });
});
