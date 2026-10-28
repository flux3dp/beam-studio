const mockAddCommandToHistory = jest.fn();
const mockSelectStlObject = jest.fn();
const mockPerformSvgPreChecks = jest.fn();
const mockUploadAndDivideSvg = jest.fn();
const mockParseSvg = jest.fn();
const mockUnitePathData = jest.fn();
const mockBuildExtrusion = jest.fn();
const mockCreate3dObject = jest.fn();
const mockAskToScaleDown = jest.fn();
const mockPopById = jest.fn();
const mockReadBitmapFile = jest.fn();
const mockInitializePhotoPlane = jest.fn();
const mockSyncStlObjectsWithDom = jest.fn();
const mockGetEngravableBox = jest.fn();

const mockSvgCanvas = { prepareSvg: jest.fn() };
const mockSvgedit = {
  utilities: {
    text2xml: (text: string) => new DOMParser().parseFromString(text, 'image/svg+xml'),
  },
};

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: jest.fn(),
  popById: (...args: unknown[]) => mockPopById(...args),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/engravable', () => ({
  getEngravableBox: () => mockGetEngravableBox(),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/selection', () => ({
  selectStlObject: (...args: unknown[]) => mockSelectStlObject(...args),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/transform', () => ({
  IDENTITY_TRANSFORM: { flip: [false, false, false], position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
}));
jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: class {
    stack: unknown[] = [];

    onAfter?: () => void;

    addSubCommand = (cmd: unknown) => this.stack.push(cmd);

    isEmpty = () => this.stack.length === 0;
  },
}));
jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args: unknown[]) => mockAddCommandToHistory(...args),
}));
jest.mock('@core/app/svgedit/operations/import/importSvg', () => ({
  performSvgPreChecks: (...args: unknown[]) => mockPerformSvgPreChecks(...args),
}));
jest.mock('@core/app/svgedit/operations/import/importSvg/utils/processOutputData', () => ({
  preprocessSvgString: (svg: string) => svg,
}));
jest.mock('@core/app/svgedit/operations/import/importSvg/utils/uploadAndDivideSvg', () => ({
  uploadAndDivideSvg: (...args: unknown[]) => mockUploadAndDivideSvg(...args),
}));
jest.mock(
  '@core/app/svgedit/operations/import/readBitmapFile',
  () =>
    (...args: unknown[]) =>
      mockReadBitmapFile(...args),
);
jest.mock(
  '@core/app/svgedit/operations/parseSvg',
  () =>
    (...args: unknown[]) =>
      mockParseSvg(...args),
);
jest.mock('@core/app/svgedit/stl/extrusionSource', () => ({
  buildExtrusion: (...args: unknown[]) => mockBuildExtrusion(...args),
}));
jest.mock('@core/app/svgedit/stl/photoPlane', () => ({
  initializePhotoPlane: (...args: unknown[]) => mockInitializePhotoPlane(...args),
}));
jest.mock('@core/app/svgedit/stl/sync', () => ({
  syncStlObjectsWithDom: (...args: unknown[]) => mockSyncStlObjectsWithDom(...args),
}));
jest.mock('@core/app/svgedit/workarea', () => ({ height: 700, width: 700 }));
jest.mock('@core/helpers/i18n', () => ({ lang: { beambox: { popup: { loading_image: 'loading' } } } }));
jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback: (globalSvg: unknown) => void) => callback({ Canvas: mockSvgCanvas, Edit: mockSvgedit }),
}));
jest.mock(
  './unitePathData',
  () =>
    (...args: unknown[]) =>
      mockUnitePathData(...args),
);
jest.mock('.', () => ({
  askToScaleDown: () => mockAskToScaleDown(),
  create3dObject: (...args: unknown[]) => mockCreate3dObject(...args),
}));

import importSvgFileAsStl from './importSvgFile';

const makeSymbol = (markup: string) => {
  const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');

  symbol.innerHTML = markup;
  document.body.appendChild(symbol);

  return symbol;
};

const makeImage = ({ height, width, x, y }: Record<'height' | 'width' | 'x' | 'y', number>) => {
  const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');

  image.id = 'photo';
  Object.entries({ height, width, x, y }).forEach(([key, value]) => image.setAttribute(key, String(value)));

  return image;
};

// jsdom's Blob has no text(); the divided outputs only need it
const svgOutput = { text: async () => '<svg xmlns="http://www.w3.org/2000/svg"/>' };
const geometry = { id: 'geometry' };

describe('importSvgFileAsStl', () => {
  let symbol: SVGSymbolElement;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformSvgPreChecks.mockResolvedValue({ proceed: true });
    mockGetEngravableBox.mockReturnValue({
      center: [350, 350, 250],
      depth: 600,
      height: 500,
      isValid: true,
      width: 600,
    });
    symbol = makeSymbol('<g><rect width="10" height="10"/></g>');
    mockParseSvg.mockReturnValue({ symbols: [symbol] });
    mockUploadAndDivideSvg.mockResolvedValue({ colors: svgOutput, strokes: svgOutput });
    // 100 x 50 scene units (10 x 5mm) at (0, 0)
    mockUnitePathData.mockReturnValue({ bounds: { height: 50, width: 100, x: 0, y: 0 }, d: 'M0 0Z' });
    mockBuildExtrusion.mockReturnValue({ buffer: new ArrayBuffer(4), geometry });
    mockCreate3dObject.mockReturnValue({ cmd: 'mesh-cmd', id: 'mesh' });
  });

  test('stops when the pre-check is declined', async () => {
    mockPerformSvgPreChecks.mockResolvedValue({ proceed: false });

    await importSvgFileAsStl(new Blob());

    expect(mockUploadAndDivideSvg).not.toHaveBeenCalled();
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
  });

  test('unites strokes and fills into one extrusion centred on the engravable area', async () => {
    await importSvgFileAsStl(new Blob());

    expect(mockUploadAndDivideSvg).toHaveBeenCalledWith(expect.anything(), 'nolayer', expect.anything());
    expect(mockParseSvg).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'nolayer');
    // the parsed symbol is only read, never left in the document
    expect(symbol.isConnected).toBe(false);

    const markup = '<g xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></g>';

    expect(mockUnitePathData).toHaveBeenCalledTimes(1);
    expect(mockUnitePathData).toHaveBeenCalledWith(markup + markup);
    expect(mockBuildExtrusion).toHaveBeenCalledWith({ depth: 1, markup: '<path d="M0 0Z"/>', scale: 0.1, type: 'svg' });
    expect(mockCreate3dObject).toHaveBeenCalledTimes(1);
    expect(mockCreate3dObject.mock.calls[0][2].initialTransform.position).toEqual([350, 350, 250]);
    expect(mockAddCommandToHistory.mock.calls[0][0].stack).toEqual(['mesh-cmd']);
    expect(mockSelectStlObject).toHaveBeenCalledWith('mesh');
  });

  test('keeps the real size without asking when it fits', async () => {
    await importSvgFileAsStl(new Blob());

    expect(mockAskToScaleDown).not.toHaveBeenCalled();
    expect(mockBuildExtrusion).toHaveBeenCalledWith(expect.objectContaining({ scale: 0.1 }));
  });

  describe('when the artwork does not fit', () => {
    // 120mm wide against a 60mm engravable area
    beforeEach(() =>
      mockUnitePathData.mockReturnValue({ bounds: { height: 100, width: 1200, x: 0, y: 0 }, d: 'M0 0Z' }),
    );

    test('asks, with the progress closed, and shrinks on yes', async () => {
      mockAskToScaleDown.mockImplementation(async () => {
        expect(mockPopById).toHaveBeenCalledWith('import-svg-3d');

        return true;
      });

      await importSvgFileAsStl(new Blob());

      expect(mockAskToScaleDown).toHaveBeenCalledTimes(1);
      expect(mockBuildExtrusion).toHaveBeenCalledWith(expect.objectContaining({ scale: 0.05 }));
    });

    test('keeps the real size on no', async () => {
      mockAskToScaleDown.mockResolvedValue(false);

      await importSvgFileAsStl(new Blob());

      expect(mockBuildExtrusion).toHaveBeenCalledWith(expect.objectContaining({ scale: 0.1 }));
      expect(mockCreate3dObject.mock.calls[0][2].initialTransform.position).toEqual([350, 350, 250]);
    });
  });

  test('an embedded bitmap is its own photo plane, placed next to the artwork', async () => {
    const image = makeImage({ height: 50, width: 100, x: 200, y: 0 });
    const object = { id: 'photo' };

    mockUploadAndDivideSvg.mockResolvedValue({ bitmap: { size: 3 }, bitmapOffset: [200, 0], colors: svgOutput });
    mockReadBitmapFile.mockResolvedValue(image);
    mockInitializePhotoPlane.mockImplementation((elem: SVGImageElement) => {
      // the projection rewrites the image's own rect
      elem.setAttribute('x', '0');

      return object;
    });

    await importSvgFileAsStl(new Blob());

    expect(mockReadBitmapFile).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ offset: [200, 0] }));
    // the group spans x 0..300 (centre 150): artwork centred at 50, image at 250
    expect(mockCreate3dObject.mock.calls[0][2].initialTransform.position).toEqual([250, 350, 250]);
    expect(mockInitializePhotoPlane).toHaveBeenCalledWith(image, { position: [450, 350], scale: 1 });

    const [batchCmd] = mockAddCommandToHistory.mock.calls[0];

    expect(batchCmd.stack).toHaveLength(2);
    batchCmd.stack[1].onAfter();
    expect(mockSyncStlObjectsWithDom).toHaveBeenCalledWith([object]);
    expect(mockSelectStlObject).toHaveBeenCalledWith('mesh');
  });

  test('a bitmap-only SVG selects its photo plane', async () => {
    mockUploadAndDivideSvg.mockResolvedValue({ bitmap: { size: 3 } });
    mockReadBitmapFile.mockResolvedValue(makeImage({ height: 50, width: 100, x: 0, y: 0 }));
    mockInitializePhotoPlane.mockReturnValue({ id: 'photo' });

    await importSvgFileAsStl(new Blob());

    expect(mockUnitePathData).not.toHaveBeenCalled();
    expect(mockInitializePhotoPlane).toHaveBeenCalledWith(expect.anything(), { position: [350, 350], scale: 1 });
    expect(mockSelectStlObject).toHaveBeenCalledWith('photo');
  });

  test('records nothing when the file has nothing to extrude', async () => {
    mockUnitePathData.mockReturnValue(null);

    await importSvgFileAsStl(new Blob());

    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
    expect(mockSelectStlObject).not.toHaveBeenCalled();
  });
});
