import { downscalePhoto, MAX_PHOTO_TO_3D_SIDE } from './downscalePhoto';

const mockClose = jest.fn();
const mockDrawImage = jest.fn();
const mockToBlob = jest.fn();
let bitmapSize = { height: 3000, width: 4000 };

describe('downscalePhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.createImageBitmap = jest.fn(async () => ({
      ...bitmapSize,
      close: mockClose,
    })) as unknown as typeof createImageBitmap;
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: mockDrawImage,
    } as unknown as CanvasRenderingContext2D);
    jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, cb, type) {
      mockToBlob(this.width, this.height, type);
      cb(new Blob(['small'], { type: 'image/png' }));
    });
  });

  test('a photo over the cap is drawn down to it on its longest side, as a PNG', async () => {
    bitmapSize = { height: 3000, width: 4000 };

    const blob = new Blob(['big']);
    const result = await downscalePhoto(blob);

    expect(result).not.toBe(blob);
    expect(result.type).toBe('image/png');
    expect(mockToBlob).toHaveBeenCalledWith(MAX_PHOTO_TO_3D_SIDE, 1152, 'image/png');
    expect(mockDrawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, MAX_PHOTO_TO_3D_SIDE, 1152);
    expect(mockClose).toHaveBeenCalled();
  });

  test('a portrait photo is capped on its height', async () => {
    bitmapSize = { height: 4000, width: 2000 };

    await downscalePhoto(new Blob(['big']), 1000);

    expect(mockToBlob).toHaveBeenCalledWith(500, 1000, 'image/png');
  });

  test('a photo that fits is sent as it is', async () => {
    bitmapSize = { height: 1000, width: MAX_PHOTO_TO_3D_SIDE };

    const blob = new Blob(['fits']);

    await expect(downscalePhoto(blob)).resolves.toBe(blob);
    expect(mockToBlob).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });
});
