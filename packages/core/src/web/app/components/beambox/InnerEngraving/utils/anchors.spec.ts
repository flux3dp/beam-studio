import { Group } from 'three';

import { applyTransformToAnchor, getAnchor, registerAnchor } from './anchors';
import { MM_TO_SCENE } from './coordinates';

describe('test anchors', () => {
  test('registers and unregisters an anchor by id', () => {
    const anchor = new Group();

    registerAnchor('a', anchor);
    expect(getAnchor('a')).toBe(anchor);
    registerAnchor('a', null);
    expect(getAnchor('a')).toBeUndefined();
  });

  test('applies a transform the way StlMesh renders it', () => {
    const anchor = new Group();

    applyTransformToAnchor(anchor, {
      flip: [true, false, false],
      position: [10, 20, 30],
      rotation: [0, 0, Math.PI / 2],
      scale: [2, 3, 4],
    });
    expect(anchor.position.toArray()).toEqual([10, 20, 30]);
    expect(anchor.rotation.z).toBeCloseTo(Math.PI / 2);
    // the mirror is not the anchor's: its scale stays positive
    expect(anchor.scale.toArray()).toEqual([2 * MM_TO_SCENE, 3 * MM_TO_SCENE, 4 * MM_TO_SCENE]);
    expect(anchor.matrixWorld.elements[12]).toBe(10);
  });
});
