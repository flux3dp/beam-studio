import { BoxGeometry, Euler, Matrix4, Quaternion, Vector3 } from 'three';

import type { StlObject, StlTransform } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args: unknown[]) => mockAddCommandToHistory(...args),
}));

import type { GroupDelta } from './groupTransform';
import {
  applyGroupTransform,
  commitGroupDrag,
  fitObjectsTo,
  getGroupBox,
  getGroupDeltaMatrix,
  getGroupDragTransforms,
  getUniformFactor,
  moveObjectsCenterTo,
  transformInGroup,
} from './groupTransform';
import { getMatrix } from './transform';

/** A box whose own centre is not at its origin, like most STL files. */
const createGeometry = (size: [number, number, number], offset: [number, number, number]) =>
  new BoxGeometry(...size).translate(...offset);

const createObject = (id: string, transform: StlTransform, geometry = createGeometry([10, 20, 30], [3, -4, 5])) =>
  ({ geometry, id, initialTransform: transform, transform }) as StlObject;

const objects = [
  createObject('plain', {
    flip: [false, false, false],
    position: [100, 200, 50],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  }),
  createObject(
    'rotated',
    { flip: [false, false, false], position: [300, 150, 120], rotation: [0.3, -1.1, 2.4], scale: [0.5, 2, 1.5] },
    createGeometry([4, 8, 2], [-7, 1, 9]),
  ),
  createObject(
    'flipped',
    { flip: [true, false, true], position: [-50, 80, 30], rotation: [-2.9, 0.7, -0.4], scale: [1.2, 0.3, 0.8] },
    createGeometry([12, 6, 9], [0, 0, -3]),
  ),
  // near gimbal lock, where Euler angles are least stable
  createObject('gimbal', {
    flip: [false, true, false],
    position: [10, -20, 5],
    rotation: [1.2, Math.PI / 2 - 1e-4, -0.8],
    scale: [2, 2, 0.5],
  }),
];

const pivot = new Vector3(120, 90, 60);

const corners = (object: StlObject): Vector3[] => {
  object.geometry.computeBoundingBox();

  const { max, min } = object.geometry.boundingBox!;

  return [0, 1, 2, 3, 4, 5, 6, 7].map(
    (i) => new Vector3(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z),
  );
};

/**
 * The definition of a correct group transform: every point of every object lands where the delta
 * matrix sends its current world position. Checked on the mesh's own corners, so position,
 * rotation, scale and flip all have to be right at once.
 */
const expectMatchesDelta = (delta: GroupDelta) => {
  const deltaMatrix = getGroupDeltaMatrix(pivot, delta);

  objects.forEach((object) => {
    const before = getMatrix(object);
    const next = transformInGroup(object.transform, pivot, delta);
    const after = getMatrix({ ...object, transform: next });

    corners(object).forEach((corner) => {
      const expected = corner.clone().applyMatrix4(before).applyMatrix4(deltaMatrix);
      const actual = corner.clone().applyMatrix4(after);

      expect(actual.distanceTo(expected)).toBeLessThan(1e-6 * Math.max(1, expected.length()));
    });

    // the stored parts stay what the panel expects: positive scale, angles that rebuild the matrix
    next.scale.forEach((value) => expect(value).toBeGreaterThan(0));

    const rebuilt = new Matrix4().makeRotationFromEuler(new Euler(...next.rotation, 'XYZ'));

    expect(new Vector3(1, 0, 0).applyMatrix4(rebuilt).length()).toBeCloseTo(1);
  });
};

const rotationOf = (axis: [number, number, number], angle: number) =>
  new Quaternion().setFromAxisAngle(new Vector3(...axis).normalize(), angle);

describe('transformInGroup', () => {
  test.each([
    ['X 90°', rotationOf([1, 0, 0], Math.PI / 2)],
    ['Y -30°', rotationOf([0, 1, 0], -Math.PI / 6)],
    ['Z 45°', rotationOf([0, 0, 1], Math.PI / 4)],
    ['Z 180°', rotationOf([0, 0, 1], Math.PI)],
    ['an oblique axis', rotationOf([1, -2, 0.5], 2.2)],
  ])('rotation about %s moves every point like the rotation matrix', (_, rotation) => {
    expectMatchesDelta({ rotation });
  });

  test('a rotation keeps each object where it is relative to the others', () => {
    const rotation = rotationOf([0, 0, 1], Math.PI / 2);
    const [a, b] = objects.map(
      (object) => new Vector3(...transformInGroup(object.transform, pivot, { rotation }).position),
    );
    const before = new Vector3(...objects[0].transform.position).distanceTo(
      new Vector3(...objects[1].transform.position),
    );

    expect(a.distanceTo(b)).toBeCloseTo(before);
    // 90° about Z through the pivot: (100, 200) relative to (120, 90) is (-20, 110), which turns to (-110, -20)
    expect(a.toArray()).toEqual([expect.closeTo(10), expect.closeTo(70), expect.closeTo(50)]);
  });

  test('a full turn in steps brings every object back', () => {
    const step = rotationOf([1, 1, 0], Math.PI / 3);
    const results = objects.map((object) => {
      let transform = object.transform;

      for (let i = 0; i < 6; i += 1) transform = transformInGroup(transform, pivot, { rotation: step });

      return { object, transform };
    });

    results.forEach(({ object, transform }) => {
      const before = getMatrix(object);
      const after = getMatrix({ ...object, transform });

      corners(object).forEach((corner) => {
        expect(corner.clone().applyMatrix4(after).distanceTo(corner.clone().applyMatrix4(before))).toBeLessThan(1e-6);
      });
    });
  });

  test.each([0.5, 2.5])('uniform scale %d about the pivot', (scale) => {
    expectMatchesDelta({ scale });
  });

  test.each([0, 1, 2] as const)('mirror across axis %d toggles that flip and mirrors positions', (mirrorAxis) => {
    expectMatchesDelta({ mirrorAxis });

    const next = transformInGroup(objects[0].transform, pivot, { mirrorAxis });

    expect(next.flip[mirrorAxis]).toBe(true);
    expect(next.position[mirrorAxis]).toBeCloseTo(
      2 * pivot.getComponent(mirrorAxis) - objects[0].transform.position[mirrorAxis],
    );
  });

  test('translation, rotation, scale and mirror together', () => {
    expectMatchesDelta({
      mirrorAxis: 1,
      rotation: rotationOf([0.3, 0.4, 1], -1.3),
      scale: 1.7,
      translation: new Vector3(15, -25, 4),
    });
  });
});

describe('applyGroupTransform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStlStore.setState({ objects: Object.fromEntries(objects.map((object) => [object.id, object])) });
  });

  test('turns the whole selection about the centre of its union box, in one undo step', () => {
    const rotation = rotationOf([0, 0, 1], Math.PI / 2);
    const center = getGroupBox(objects).getCenter(new Vector3());

    applyGroupTransform(objects, { rotation });

    const { objects: stored } = useStlStore.getState();

    objects.forEach((object) => {
      expect(stored[object.id].transform).toEqual(transformInGroup(object.transform, center, { rotation }));
    });
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);

    // undoing that one step puts every object back
    mockAddCommandToHistory.mock.lastCall[0].unapply();
    objects.forEach((object) => {
      expect(useStlStore.getState().objects[object.id].transform).toEqual(object.transform);
    });
  });

  test('the union box keeps its centre under a rotation about it', () => {
    const before = getGroupBox(objects).getCenter(new Vector3());

    applyGroupTransform(objects, { rotation: rotationOf([0, 0, 1], Math.PI) });

    const after = getGroupBox(Object.values(useStlStore.getState().objects)).getCenter(new Vector3());

    expect(after.distanceTo(before)).toBeLessThan(1e-6);
  });
});

describe('placing the selection in the engravable area', () => {
  const storedObjects = () => Object.values(useStlStore.getState().objects);
  const box = {
    center: [500, 400, 300] as [number, number, number],
    depth: 200,
    height: 100,
    isValid: true,
    width: 300,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useStlStore.setState({ objects: Object.fromEntries(objects.map((object) => [object.id, object])) });
  });

  test('centring moves the union box, keeping the objects where they are relative to each other', () => {
    moveObjectsCenterTo(objects, box.center);

    expect(getGroupBox(storedObjects()).getCenter(new Vector3()).toArray()).toEqual(
      box.center.map((value) => expect.closeTo(value)),
    );
    storedObjects().forEach(({ id, transform }) => {
      const before = objects.find((object) => object.id === id)!.transform;

      expect(transform.rotation).toEqual(before.rotation);
      expect(transform.scale).toEqual(before.scale);
    });
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });

  test('fitting scales the union box to the tightest axis and centres it', () => {
    fitObjectsTo(objects, box);

    const fitted = getGroupBox(storedObjects());
    const size = fitted.getSize(new Vector3());

    expect(fitted.getCenter(new Vector3()).distanceTo(new Vector3(...box.center))).toBeLessThan(1e-6);
    expect(size.x).toBeLessThanOrEqual(box.width + 1e-6);
    expect(size.y).toBeLessThanOrEqual(box.depth + 1e-6);
    expect(size.z).toBeLessThanOrEqual(box.height + 1e-6);
    // the tightest axis touches the box
    expect(Math.max(size.x / box.width, size.y / box.depth, size.z / box.height)).toBeCloseTo(1);
  });

  test('a single object behaves like before: centred on the box', () => {
    moveObjectsCenterTo([objects[1]], box.center);

    expect(useStlStore.getState().objects.rotated.transform.position).toEqual(
      box.center.map((value) => expect.closeTo(value)),
    );
  });
});

describe('dragging the multi-selection gizmo', () => {
  const start = {
    pivot: pivot.clone(),
    transforms: Object.fromEntries(objects.map(({ id, transform }) => [id, transform])),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useStlStore.setState({ objects: Object.fromEntries(objects.map((object) => [object.id, object])) });
  });

  test('the axis that moved the most sets one factor for all three', () => {
    expect(getUniformFactor(new Vector3(1, 1.5, 1))).toBe(1.5);
    expect(getUniformFactor(new Vector3(1.2, 0.5, 1))).toBe(0.5);
    expect(getUniformFactor(new Vector3(1, 1, 1))).toBe(1);
    expect(getUniformFactor(new Vector3(1, 0, 1))).toBe(1e-3);
  });

  test.each([
    ['moved', new Vector3(130, 70, 66), new Quaternion(), 1],
    ['turned about Z', pivot.clone(), rotationOf([0, 0, 1], -0.7), 1],
    ['turned about an oblique axis', pivot.clone(), rotationOf([2, -1, 3], 1.9), 1],
    ['scaled', pivot.clone(), new Quaternion(), 1.8],
  ])('every point follows the gizmo when it is %s', (_, position, quaternion, scale) => {
    const next = getGroupDragTransforms(start, { position, quaternion, scale });
    const deltaMatrix = getGroupDeltaMatrix(pivot, {
      rotation: quaternion,
      scale,
      translation: position.clone().sub(pivot),
    });

    objects.forEach((object) => {
      const after = getMatrix({ ...object, transform: next[object.id] });

      corners(object).forEach((corner) => {
        const expected = corner.clone().applyMatrix4(getMatrix(object)).applyMatrix4(deltaMatrix);

        expect(corner.clone().applyMatrix4(after).distanceTo(expected)).toBeLessThan(
          1e-6 * Math.max(1, expected.length()),
        );
      });
    });
  });

  test('letting go records one step, and undo returns to where the drag started', () => {
    const next = getGroupDragTransforms(start, {
      position: pivot.clone(),
      quaternion: rotationOf([0, 0, 1], Math.PI / 2),
      scale: 1,
    });

    // the drag already wrote the last frame into the store
    Object.entries(next).forEach(([id, transform]) => useStlStore.getState().setTransform(id, transform));
    commitGroupDrag(start, next);

    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    objects.forEach(({ id }) => expect(useStlStore.getState().objects[id].transform).toEqual(next[id]));

    mockAddCommandToHistory.mock.lastCall[0].unapply();
    objects.forEach(({ id, transform }) => expect(useStlStore.getState().objects[id].transform).toEqual(transform));
  });
});
