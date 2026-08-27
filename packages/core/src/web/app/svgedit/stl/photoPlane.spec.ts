const mockUpdateProjectionRect = jest.fn();

jest.mock('@core/app/components/beambox/InnerEngraving/utils/coordinates', () => ({ MM_TO_SCENE: 10 }));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/engravable', () => ({
  getEngravableBox: () => ({
    center: [400, 500, 60],
    depth: 600,
    height: 100,
    isValid: true,
    max: [700, 800, 110],
    min: [100, 200, 10],
    width: 600,
  }),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/material', () => ({
  getMaterial: () => ({ height: 120 }),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/projection', () => ({
  updateProjectionRect: (...args: unknown[]) => mockUpdateProjectionRect(...args),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/transform', () => ({
  getMatrix: () => ({ matrix: true }),
  IDENTITY_TRANSFORM: { flip: [false, false, false], rotation: [0, 0, 0], scale: [1, 1, 1] },
}));
jest.mock('@core/app/svgedit/workarea', () => ({ height: 1000, width: 1000 }));

import { useStlStore } from '@core/app/stores/stlStore';

import { PHOTO_3D_ATTR } from './constants';
import {
  createPhotoPlaneObject,
  detachPhotoPlaneElements,
  getPhotoTextureUrl,
  initializePhotoPlane,
} from './photoPlane';

describe('photoPlane', () => {
  beforeEach(() => {
    document.body.innerHTML = '<svg id="svgcontent"></svg>';
    mockUpdateProjectionRect.mockClear();
    useStlStore.setState({ objects: {}, selectedId: null });
  });

  test('creates a zero-thickness textured plane at half the material height', () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'image');

    elem.id = 'photo-1';
    elem.setAttribute('height', '500');
    elem.setAttribute('origImage', 'blob:photo');
    elem.setAttribute('width', '1000');
    document.getElementById('svgcontent')!.appendChild(elem);

    const object = initializePhotoPlane(elem);

    expect(object.kind).toBe('photo');
    expect(object.textureUrl).toBe('blob:photo');
    expect(object.transform.position).toEqual([400, 500, 60]);
    expect(object.transform.scale).toEqual([0.6, 0.6, 1]);
    expect(elem.getAttribute(PHOTO_3D_ATTR.marker)).toBe('1');
    expect(elem.getAttribute(PHOTO_3D_ATTR.width)).toBe('100');
    expect(elem.getAttribute(PHOTO_3D_ATTR.height)).toBe('50');
    expect(object.geometry.boundingBox!.min.z).toBe(0);
    expect(object.geometry.boundingBox!.max.z).toBe(0);
    expect(useStlStore.getState().objects['photo-1']).toBe(object);
    expect(mockUpdateProjectionRect).toHaveBeenCalledWith(
      elem,
      object.geometry,
      { matrix: true },
      { initialTransform: object.transform, transform: object.transform },
    );
  });

  test('rebuilds a saved photo after its source has been restored', () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'image');

    elem.id = 'photo-2';
    elem.setAttribute('origImage', 'data:image/png;base64,AA==');
    elem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', 'data:image/png;base64,DISPLAY==');
    elem.setAttribute(PHOTO_3D_ATTR.width, '25');
    elem.setAttribute(PHOTO_3D_ATTR.height, '10');
    elem.setAttribute(
      'data-stl-transform',
      JSON.stringify({
        initialTransform: { flip: [false, false, false], position: [1, 2, 3], rotation: [0, 0, 0], scale: [1, 1, 1] },
        transform: { flip: [false, false, false], position: [4, 5, 6], rotation: [0, 0, 0], scale: [2, 2, 1] },
      }),
    );

    const object = createPhotoPlaneObject(elem);

    expect(object).toMatchObject({ id: 'photo-2', kind: 'photo', textureUrl: 'data:image/png;base64,DISPLAY==' });
    expect(object!.geometry.boundingBox!.max.toArray()).toEqual([12.5, 5, 0]);
  });

  test('uses the processed 2D image as the 3D texture', () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'image');

    elem.setAttribute('origImage', 'data:image/png;base64,ORIGINAL==');
    elem.setAttribute('xlink:href', 'data:image/png;base64,PROCESSED==');

    expect(getPhotoTextureUrl(elem)).toBe('data:image/png;base64,PROCESSED==');
  });

  test('temporarily removes multiple photos and restores their DOM order', () => {
    const svg = document.getElementById('svgcontent')!;

    svg.innerHTML = `<image id="a" ${PHOTO_3D_ATTR.marker}="1"/><image id="b" ${PHOTO_3D_ATTR.marker}="1"/><rect id="c"/>`;

    const restore = detachPhotoPlaneElements();

    expect(Array.from(svg.children, ({ id }) => id)).toEqual(['c']);
    restore();
    expect(Array.from(svg.children, ({ id }) => id)).toEqual(['a', 'b', 'c']);
  });
});
