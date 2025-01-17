import calculateBase64 from './calculate-base64';

const mockImageData = jest.fn();
jest.mock('helpers/image-data', () => (...args) => mockImageData(...args));

describe('test calculateBase64', () => {
  beforeEach(() => {
    mockImageData.mockReset();
  });

  it('should work', async () => {
    const promise = calculateBase64('blob-url', true, 128);
    expect(mockImageData).toBeCalledTimes(1);
    expect(mockImageData).toHaveBeenLastCalledWith('blob-url', {
      grayscale: {
        is_rgba: true,
        is_shading: true,
        threshold: 128,
        is_svg: false,
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
    expect(mockImageData).toBeCalledTimes(1);
    expect(mockImageData).toHaveBeenLastCalledWith('blob-url', {
      isFullResolution: true,
      onComplete: expect.anything(),
    });
    const callback = mockImageData.mock.calls[0][1].onComplete;
    callback({ pngBase64: 'mock-base64-2' });
    expect(await promise).toEqual('mock-base64-2');
  });
});
