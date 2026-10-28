const mockAddCommandToHistory = jest.fn();
const mockGetMatrix = jest.fn(() => ({ matrix: true }));
const mockUpdateProjectionRect = jest.fn();

jest.mock('@core/app/components/beambox/InnerEngraving/utils/projection', () => ({
  updateProjectionRect: (...args: unknown[]) => mockUpdateProjectionRect(...args),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/transform', () => ({
  getMatrix: (...args: unknown[]) => mockGetMatrix(...args),
}));
jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args: unknown[]) => mockAddCommandToHistory(...args),
}));

import { PlaneGeometry } from 'three';

import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';

import { PHOTO_3D_ATTR, POINT_CLOUD_ATTR } from './constants';
import { encodePointCloud } from './pointCloud';
import { applyPhotoPointCloud, type PhotoPointCloudCommand } from './photoPointCloud';

const transform = {
  flip: [false, false, false],
  position: [100, 200, 30],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
} as const;

describe('photoPointCloud', () => {
  let photo: StlObject;

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = `<svg id="svgcontent"><image id="photo" ${PHOTO_3D_ATTR.marker}="1" /></svg>`;
    photo = {
      geometry: new PlaneGeometry(20, 10),
      id: 'photo',
      initialTransform: transform,
      kind: 'photo',
      textureUrl: 'data:image/png;base64,PHOTO==',
      transform,
    };
    useStlStore.getState().set(photo);
  });

  test('replaces only the photo 3D representation and records undo history', () => {
    const buffer = encodePointCloud(new Float32Array([-10, -5, 0, 10, 5, 2]));
    const result = applyPhotoPointCloud('photo', buffer);
    const elem = document.getElementById('photo')!;

    expect(result).toMatchObject({ id: 'photo', kind: 'point-cloud', pointCloudBuffer: buffer });
    expect(result.textureUrl).toBe(photo.textureUrl);
    expect(elem.getAttribute(POINT_CLOUD_ATTR.marker)).toBe('1');
    expect(useStlStore.getState().objects.photo).toBe(result);
    expect(mockUpdateProjectionRect).toHaveBeenCalledWith(
      elem,
      result.geometry,
      { matrix: true },
      { initialTransform: transform, transform },
    );
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });

  test('undo restores the fallback plane and redo restores the point cloud', () => {
    const result = applyPhotoPointCloud('photo', encodePointCloud(new Float32Array([0, 0, 0, 1, 1, 1])));
    const command = mockAddCommandToHistory.mock.calls[0][0] as PhotoPointCloudCommand;
    const elem = document.getElementById('photo')!;

    command.doUnapply();
    expect(useStlStore.getState().objects.photo).toBe(photo);
    expect(elem.hasAttribute(POINT_CLOUD_ATTR.marker)).toBe(false);

    command.doApply();
    expect(useStlStore.getState().objects.photo).toBe(result);
    expect(elem.getAttribute(POINT_CLOUD_ATTR.marker)).toBe('1');
  });

  test('rejects an object that is not a photo source', () => {
    document.getElementById('photo')!.removeAttribute(PHOTO_3D_ATTR.marker);

    expect(() => applyPhotoPointCloud('photo', encodePointCloud(new Float32Array([0, 0, 0])))).toThrow(
      'Photo plane photo does not exist',
    );
  });
});
