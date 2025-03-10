import loadCamera3dRotation from './loadCamera3dRotation';

const mockFetchFisheye3DRotation = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  fetchFisheye3DRotation: (...args) => mockFetchFisheye3DRotation(...args),
}));

describe('test loadCamera3dRotation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return rotation data from device', async () => {
    mockFetchFisheye3DRotation.mockResolvedValue({
      ch: 5,
      dh: 0,
      rx: 1,
      ry: 2,
      rz: 3,
      sh: 4,
      tx: 2,
      ty: 3,
    });

    const res = await loadCamera3dRotation();

    expect(res).toStrictEqual({ ch: 5, dh: 0, rx: 1, ry: 2, rz: 3, sh: 4, tx: 2, ty: 3 });
    expect(mockFetchFisheye3DRotation).toHaveBeenCalledTimes(1);
  });

  it('should return null when error occurs', async () => {
    mockFetchFisheye3DRotation.mockRejectedValue(new Error('mock error'));

    const res = await loadCamera3dRotation();

    expect(res).toBeNull();
    expect(mockFetchFisheye3DRotation).toHaveBeenCalledTimes(1);
  });
});
