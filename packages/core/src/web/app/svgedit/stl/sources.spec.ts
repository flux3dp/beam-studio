import { BoxGeometry } from 'three';

import { useStlStore } from '@core/app/stores/stlStore';

import { POINT_CLOUD_ATTR } from './constants';
import { encodePointCloud } from './pointCloud';
import { getPointCloudSources } from './sources';

describe('stl sources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = `<svg id="svgcontent"><image id="photo" ${POINT_CLOUD_ATTR.marker}="1" /></svg>`;
  });

  test('collects only a marked photo point cloud with a matching store object', () => {
    const pointCloudBuffer = encodePointCloud(new Float32Array([0, 0, 0]));

    useStlStore.getState().set({
      geometry: new BoxGeometry(1, 1, 1),
      id: 'photo',
      initialTransform: { flip: [false, false, false], position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      kind: 'point-cloud',
      pointCloudBuffer,
      transform: { flip: [false, false, false], position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    });

    expect(getPointCloudSources()).toEqual({ photo: pointCloudBuffer });
  });
});
