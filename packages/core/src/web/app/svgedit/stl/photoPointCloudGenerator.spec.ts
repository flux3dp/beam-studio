jest.mock('./engravingParams', () => ({ getStlEngravingParams: jest.fn() }));
jest.mock('./photoPlane', () => ({ getPhotoTextureUrl: jest.fn() }));

import { decodePointCloud, encodePointCloud } from './pointCloud';
import { createPhotoPointPositions } from './photoPointCloudGenerator';

describe('createPhotoPointPositions', () => {
  test('samples XY by point spacing and converts grayscale levels to layer heights', () => {
    const imageData = {
      data: new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255, 128, 128, 128, 255, 255, 0, 0, 0]),
      height: 2,
      width: 2,
    };

    const positions = createPhotoPointPositions(imageData, {
      heightMm: 2,
      layerHeight: 0.1,
      pointSpacing: 1,
      widthMm: 2,
    });

    expect(Array.from(positions.slice(0, 6))).toEqual([-0.5, 0.5, 25.5, 0.5, 0.5, 0]);
    expect(Array.from(positions.slice(6, 8))).toEqual([-0.5, -0.5]);
    expect(positions[8]).toBeCloseTo(12.7);
  });

  test('distributes samples within the photo when dimensions are not multiples of the spacing', () => {
    const positions = createPhotoPointPositions(
      { data: new Uint8ClampedArray([0, 0, 0, 255]), height: 1, width: 1 },
      { heightMm: 1, layerHeight: 0.1, pointSpacing: 0.6, widthMm: 1 },
    );

    expect(Array.from(positions)).toEqual([-0.25, 0.25, 25.5, 0.25, 0.25, 25.5, -0.25, -0.25, 25.5, 0.25, -0.25, 25.5]);
  });

  test('rejects an excessive sample count before allocating point data', () => {
    expect(() =>
      createPhotoPointPositions(
        { data: new Uint8ClampedArray([0, 0, 0, 255]), height: 1, width: 1 },
        { heightMm: 100, layerHeight: 0.1, pointSpacing: 0.001, widthMm: 100 },
      ),
    ).toThrow('Photo point cloud would exceed 10000000 samples');
  });

  test('produces data accepted by the BSPC codec', () => {
    const positions = createPhotoPointPositions(
      { data: new Uint8ClampedArray([64, 64, 64, 255]), height: 1, width: 1 },
      { heightMm: 1, layerHeight: 0.2, pointSpacing: 1, widthMm: 1 },
    );
    // The frontend generator and the future API share this exact encoded contract.
    const decoded = decodePointCloud(encodePointCloud(positions));

    expect(Array.from(decoded.positions)).toEqual([0, 0, 38.20000076293945]);
  });
});
