import calculateBase64 from './calculate-base64';

const mockImageData = jest.fn();

jest.mock(
  '@core/helpers/image-data',
  () =>
    (...args) =>
      mockImageData(...args),
);

describe('test calculateBase64', () => {
  beforeEach(() => {
    mockImageData.mockReset();
  });

  it('should work', async () => {
    const promise = calculateBase64('blob-url', true, 128);

    expect(mockImageData).toHaveBeenCalledTimes(1);
    expect(mockImageData).toHaveBeenLastCalledWith('blob-url', {
      grayscale: {
        is_rgba: true,
        is_shading: true,
        is_svg: false,
        threshold: 128,
      },
      isFullResolution: true,
      onComplete: expect.anything(),
    });

    const callback = mockImageData.mock.calls[0][1].onComplete;

    callback({ pngBase64: 'mock-base64' });
    expect(await promise).toEqual('mock-base64');
  });

  test('call with full color', async () => {
    const promise = calculateBase64('blob-url', true, 128, true);

    expect(mockImageData).toHaveBeenCalledTimes(1);
    expect(mockImageData).toHaveBeenLastCalledWith('blob-url', {
      isFullResolution: true,
      onComplete: expect.anything(),
    });

    const callback = mockImageData.mock.calls[0][1].onComplete;

    callback({ pngBase64: 'mock-base64-2' });
    expect(await promise).toEqual('mock-base64-2');
  });
});
