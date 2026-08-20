import { toCameraPreviewPoint } from './cameraPreview';

describe('toCameraPreviewPoint', () => {
  beforeEach(() => jest.clearAllMocks());

  it('converts the far side of the 3D scene to camera y=0', () => {
    expect(toCameraPreviewPoint({ x: 20, y: 700 }, { height: 700, width: 700 })).toEqual([20, 0]);
  });

  it('converts the near side of the 3D scene to camera y=max', () => {
    expect(toCameraPreviewPoint({ x: 20, y: 0 }, { height: 700, width: 700 })).toEqual([20, 700]);
  });

  it('clamps pointer intersections to the work area', () => {
    expect(toCameraPreviewPoint({ x: -10, y: 800 }, { height: 700, width: 700 })).toEqual([0, 0]);
  });
});
