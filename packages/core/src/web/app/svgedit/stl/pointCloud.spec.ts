import { createPointCloudGeometry, decodePointCloud, encodePointCloud, POINT_CLOUD_FORMAT_VERSION } from './pointCloud';

describe('pointCloud', () => {
  beforeEach(() => jest.clearAllMocks());

  test('round-trips versioned XYZ Float32 LE data', () => {
    const input = new Float32Array([-5.5, 1.25, 0, 5.5, -1.25, 2.75]);
    const buffer = encodePointCloud(input);
    const decoded = decodePointCloud(buffer);

    expect(decoded.version).toBe(POINT_CLOUD_FORMAT_VERSION);
    expect(Array.from(decoded.positions)).toEqual(Array.from(input));

    const view = new DataView(buffer);

    expect(String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))).toBe('BSPC');
    expect(view.getUint32(8, true)).toBe(2);
  });

  test('builds a geometry whose bounds use local millimetres', () => {
    const geometry = createPointCloudGeometry(encodePointCloud(new Float32Array([-10, -5, 0, 10, 5, 3])));

    expect(geometry.getAttribute('position').count).toBe(2);
    expect(geometry.boundingBox?.min.toArray()).toEqual([-10, -5, 0]);
    expect(geometry.boundingBox?.max.toArray()).toEqual([10, 5, 3]);
  });

  test.each([
    ['empty positions', () => encodePointCloud(new Float32Array())],
    ['incomplete XYZ', () => encodePointCloud(new Float32Array([1, 2]))],
    ['non-finite positions', () => encodePointCloud(new Float32Array([1, 2, Number.NaN]))],
    ['invalid binary', () => decodePointCloud(new Uint8Array([1, 2, 3]).buffer)],
  ])('rejects %s', (_name, run) => {
    expect(run).toThrow();
  });
});
