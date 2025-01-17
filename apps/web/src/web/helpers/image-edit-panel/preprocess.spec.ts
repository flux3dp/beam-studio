import { preprocessByUrl } from './preprocess';

jest.mock('implementations/imageProcessor', () => ({ AUTO: 'AUTO' }));

const mockUrlToImage = jest.fn();
const mockImageToUrl = jest.fn();
jest.mock('helpers/jimp-helper', () => ({
  urlToImage: (...args) => mockUrlToImage(...args),
  imageToUrl: (...args) => mockImageToUrl(...args),
}));

const mockGetWidth = jest.fn();
const mockGetHeight = jest.fn();
const mockJimpImage = {
  resize: jest.fn(),
  bitmap: {
    get width() {
      return mockGetWidth();
    },
    get height() {
      return mockGetHeight();
    },
  },
};

describe('test image-edit-panel/preprocess', () => {
  test('crop preprocess', async () => {
    mockUrlToImage.mockResolvedValueOnce(mockJimpImage);
    mockGetWidth.mockReturnValueOnce(700).mockReturnValueOnce(600);
    mockGetHeight.mockReturnValueOnce(400).mockReturnValueOnce(300);
    mockImageToUrl.mockResolvedValueOnce('mock-url');
    const res = await preprocessByUrl('bloburl');
    expect(mockUrlToImage).toBeCalledTimes(1);
    expect(mockUrlToImage).toHaveBeenLastCalledWith('bloburl');
    expect(mockJimpImage.resize).toBeCalledTimes(1);
    expect(mockJimpImage.resize).toHaveBeenLastCalledWith(600, 'AUTO');
    expect(mockImageToUrl).toBeCalledTimes(1);
    expect(mockImageToUrl).toHaveBeenLastCalledWith(mockJimpImage);
    expect(res).toEqual({
      blobUrl: 'mock-url',
      dimension: { x: 0, y: 0, width: 600, height: 300 },
      originalWidth: 700,
      originalHeight: 400,
    });
  });
});
