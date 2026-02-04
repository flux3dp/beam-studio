import { preprocessByUrl } from './preprocess';

jest.mock('@core/implementations/imageProcessor', () => ({ AUTO: 'AUTO' }));

const mockUrlToImage = jest.fn();
const mockImageToUrl = jest.fn();

jest.mock('@core/helpers/jimp-helper', () => ({
  imageToUrl: (...args) => mockImageToUrl(...args),
  urlToImage: (...args) => mockUrlToImage(...args),
}));

const mockGetWidth = jest.fn();
const mockGetHeight = jest.fn();
const mockJimpImage = {
  bitmap: {
    get height() {
      return mockGetHeight();
    },
    get width() {
      return mockGetWidth();
    },
  },
  resize: jest.fn(),
};

describe('test image-edit-panel/preprocess', () => {
  test('crop preprocess', async () => {
    mockUrlToImage.mockResolvedValueOnce(mockJimpImage);
    mockGetWidth.mockReturnValueOnce(700).mockReturnValueOnce(600);
    mockGetHeight.mockReturnValueOnce(400).mockReturnValueOnce(300);
    mockImageToUrl.mockResolvedValueOnce('mock-url');

    const res = await preprocessByUrl('bloburl');

    expect(mockUrlToImage).toHaveBeenCalledTimes(1);
    expect(mockUrlToImage).toHaveBeenLastCalledWith('bloburl');
    expect(mockJimpImage.resize).toHaveBeenCalledTimes(1);
    expect(mockJimpImage.resize).toHaveBeenLastCalledWith(600, 'AUTO');
    expect(mockImageToUrl).toHaveBeenCalledTimes(1);
    expect(mockImageToUrl).toHaveBeenLastCalledWith(mockJimpImage);
    expect(res).toEqual({
      blobUrl: 'mock-url',
      dimension: { height: 300, width: 600, x: 0, y: 0 },
      originalHeight: 400,
      originalWidth: 700,
    });
  });
});
