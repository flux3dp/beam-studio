import { applyProps } from '@react-three/fiber';
import { Mesh } from 'three';

import { getMaterialRotation } from './materialGeometry';

describe('inner engraving material geometry', () => {
  beforeEach(() => jest.clearAllMocks());

  test('uses an explicit zero rotation for a box so reused region meshes reset their orientation', () => {
    expect(getMaterialRotation('box')).toEqual([0, 0, 0]);
  });

  test('keeps a reused blue region aligned with a newly mounted out-of-range region', () => {
    const reusedRegion = new Mesh();
    const newRegion = new Mesh();

    applyProps(reusedRegion, { rotation: getMaterialRotation('cylinder') });
    expect(reusedRegion.rotation.x).toBe(Math.PI / 2);

    applyProps(reusedRegion, { rotation: getMaterialRotation('box') });
    applyProps(newRegion, { rotation: getMaterialRotation('box') });

    expect(reusedRegion.rotation.toArray().slice(0, 3)).toEqual(newRegion.rotation.toArray().slice(0, 3));
  });

  test.each(['cylinder', 'sphere'] as const)('rotates a %s from three.js Y-up to the scene Z-up axis', (shape) => {
    expect(getMaterialRotation(shape)).toEqual([Math.PI / 2, 0, 0]);
  });
});
