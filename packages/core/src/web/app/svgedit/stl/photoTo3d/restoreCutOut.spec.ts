import { restoreCutOut } from './restoreCutOut';

const mockClose = jest.fn();
const mockDrawImage = jest.fn();
const mockToBlob = jest.fn();
const context = { drawImage: mockDrawImage, globalCompositeOperation: 'source-over', imageSmoothingQuality: 'low' };

describe('restoreCutOut', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    context.globalCompositeOperation = 'source-over';
    global.createImageBitmap = jest.fn(async (blob: Blob) => ({
      ...(blob.size > 5 ? { height: 3000, width: 4000 } : { height: 1152, width: 1536 }),
      close: mockClose,
    })) as unknown as typeof createImageBitmap;
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(context as unknown as CanvasRenderingContext2D);
    jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, cb, type) {
      mockToBlob(this.width, this.height, type);
      cb(new Blob(['restored'], { type: 'image/png' }));
    });
  });

  test('the small cut-out becomes the transparency of the full photo', async () => {
    const result = await restoreCutOut(new Blob(['the full photo']), new Blob(['small']));

    expect(result.type).toBe('image/png');
    expect(mockToBlob).toHaveBeenCalledWith(4000, 3000, 'image/png');
    expect(mockDrawImage.mock.calls).toEqual([
      [expect.objectContaining({ width: 4000 }), 0, 0],
      [expect.objectContaining({ width: 1536 }), 0, 0, 4000, 3000],
    ]);
    expect(context.globalCompositeOperation).toBe('destination-in');
    expect(mockClose).toHaveBeenCalledTimes(2);
  });
});
