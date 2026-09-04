const mockObjects: Record<string, any> = {};
const mockRemove = jest.fn();
const mockSet = jest.fn();

jest.mock('@core/app/stores/stlStore', () => ({
  useStlStore: {
    getState: () => ({ objects: mockObjects, remove: mockRemove, set: mockSet }),
  },
}));

jest.mock('./getters', () => ({
  is3dProjection: (elem?: Element | null) =>
    Boolean(elem?.getAttribute('data-stl') || elem?.getAttribute('data-stl-photo')),
}));

import {
  collectStlObjects,
  collectStlProjectionElements,
  createClonedStlObjects,
  syncStlObjectsWithDom,
} from './sync';

const makeObject = (id: string) => ({
  buffer: new ArrayBuffer(1),
  geometry: { id: `geometry-${id}` },
  id,
  initialTransform: { flip: [false, false, false], position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  transform: { flip: [false, false, false], position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
});

describe('STL DOM synchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockObjects).forEach((id) => delete mockObjects[id]);
    document.body.innerHTML = '';
  });

  test('collects projections nested in a layer without duplicates', () => {
    document.body.innerHTML = `
      <svg>
        <g id="layer">
          <rect id="mesh" data-stl="1" />
          <g><image id="photo" data-stl-photo="1" /></g>
          <path id="plain" />
        </g>
      </svg>
    `;
    const layer = document.getElementById('layer')!;
    const mesh = document.getElementById('mesh')!;
    const meshObject = makeObject('mesh');
    const photoObject = makeObject('photo');

    mockObjects.mesh = meshObject;
    mockObjects.photo = photoObject;

    expect(collectStlProjectionElements([layer, mesh])).toEqual([mesh, document.getElementById('photo')]);
    expect(collectStlObjects([layer])).toEqual([meshObject, photoObject]);
  });

  test('re-keys runtime objects for an in-place layer copy', () => {
    document.body.innerHTML = `
      <svg>
        <g id="source"><rect id="mesh" data-stl="1" /><image id="photo" data-stl-photo="1" /></g>
        <g id="copy"><rect id="mesh-copy" data-stl="1" /><image id="photo-copy" data-stl-photo="1" /></g>
      </svg>
    `;
    const meshObject = makeObject('mesh');
    const photoObject = makeObject('photo');

    mockObjects.mesh = meshObject;
    mockObjects.photo = photoObject;

    const cloned = createClonedStlObjects(document.getElementById('source')!, document.getElementById('copy')!);

    expect(cloned).toEqual([
      { ...meshObject, id: 'mesh-copy' },
      { ...photoObject, id: 'photo-copy' },
    ]);
    expect(cloned[0].geometry).toBe(meshObject.geometry);
    expect(cloned[0].buffer).toBe(meshObject.buffer);
  });

  test('adds or removes runtime objects according to projection existence', () => {
    document.body.innerHTML = '<svg><rect id="present" data-stl="1" /></svg>';
    const present = makeObject('present');
    const missing = makeObject('missing');

    syncStlObjectsWithDom([present, missing] as any);

    expect(mockSet).toHaveBeenCalledWith(present);
    expect(mockRemove).toHaveBeenCalledWith('missing');
  });
});
