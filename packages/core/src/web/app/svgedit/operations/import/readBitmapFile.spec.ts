const mockAddSvgElementFromJson = jest.fn();
const mockAddCommandToHistory = jest.fn();
const mockImageData = jest.fn();
const mockSelectOnly = jest.fn();
const mockSetHref = jest.fn();
const mockUpdateElementColor = jest.fn();

jest.mock('@core/app/svgedit/history/history', () => ({
  InsertElementCommand: jest.fn(),
}));
jest.mock('@core/app/svgedit/history/undoManager', () => ({ addCommandToHistory: mockAddCommandToHistory }));
jest.mock('@core/app/svgedit/selection', () => ({ selectOnly: mockSelectOnly }));
jest.mock('@core/helpers/color/updateElementColor', () => mockUpdateElementColor);
jest.mock('@core/helpers/image/getExifRotationFlag', () => () => 1);
jest.mock('@core/helpers/image-data', () => mockImageData);
jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback: (svg: unknown) => void) =>
    callback({
      Canvas: {
        addSvgElementFromJson: mockAddSvgElementFromJson,
        getNextId: () => 'svg_1',
        setHref: mockSetHref,
      },
    }),
}));

import readBitmapFile from './readBitmapFile';

describe('readBitmapFile', () => {
  const originalFileReader = global.FileReader;
  const originalImage = global.Image;
  const originalCreateObjectURL = URL.createObjectURL;

  beforeEach(() => {
    jest.clearAllMocks();

    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'image');

    elem.setAttribute('origImage', 'blob:source');
    mockAddSvgElementFromJson.mockReturnValue(elem);

    class FileReaderMock {
      onloadend: ((event: { target: { result: ArrayBuffer } }) => void) | null = null;

      readAsArrayBuffer = () => this.onloadend?.({ target: { result: new ArrayBuffer(1) } });
    }

    class ImageMock {
      height = 20;
      onload: (() => void) | null = null;
      style = { opacity: '' };
      width = 40;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    Object.defineProperty(global, 'FileReader', { configurable: true, value: FileReaderMock });
    Object.defineProperty(global, 'Image', { configurable: true, value: ImageMock });
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:source' });
  });

  afterAll(() => {
    Object.defineProperty(global, 'FileReader', { configurable: true, value: originalFileReader });
    Object.defineProperty(global, 'Image', { configurable: true, value: originalImage });
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL });
  });

  test('waits for the processed display image before returning the SVG image', async () => {
    let complete: ((result: { pngBase64: string }) => void) | undefined;

    mockImageData.mockImplementation((_source, options) => {
      complete = options.onComplete;
    });

    let settled = false;
    const promise = readBitmapFile(new File(['photo'], 'photo.png', { type: 'image/png' })).then((elem) => {
      settled = true;

      return elem;
    });

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockImageData).toHaveBeenCalled();
    expect(settled).toBe(false);

    complete?.({ pngBase64: 'data:image/png;base64,MONOCHROME==' });

    const elem = await promise;

    expect(mockSetHref).toHaveBeenCalledWith(elem, 'data:image/png;base64,MONOCHROME==');
    expect(mockUpdateElementColor).toHaveBeenCalledWith(elem);
    expect(settled).toBe(true);
  });
});
