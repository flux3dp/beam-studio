import NS from '@core/app/constants/namespaces';
import type { CustomShapeElementOptionDef, CustomShapeTextValues } from '../types';

const mockGetFontOfPostscriptName = jest.fn();
const mockConvertTextToPathByFontkit = jest.fn();
const mockGetFontObj = jest.fn();

jest.mock('@core/app/actions/beambox/font-funcs', () => ({
  convertTextToPathByFontkit: mockConvertTextToPathByFontkit,
  getFontObj: mockGetFontObj,
  getFontOfPostscriptName: mockGetFontOfPostscriptName,
}));

const mockCreateTextElement = jest.fn();

jest.mock('./buildText', () => ({
  createTextElement: mockCreateTextElement,
}));

const mockCollectPathItems = jest.fn();

jest.mock('./buildShape', () => ({
  collectPathItems: mockCollectPathItems,
}));

const mockSvgCache = new Map<string, string>();

jest.mock('./buildElement', () => ({
  svgCache: mockSvgCache,
}));

const mockOffset = jest.fn();

jest.mock('paperjs-offset', () => ({
  PaperOffset: { offset: mockOffset },
}));

const mockUnite = jest.fn();
const mockExclude = jest.fn();
const mockRemove = jest.fn();
const mockIntersects = jest.fn();

const mockPoint = (x = 0, y = 0) => ({ add: (p: any) => mockPoint(x + p.x, y + p.y), x, y });

class MockPath {
  bounds: any = {
    bottomCenter: mockPoint(),
    height: 100,
    leftCenter: mockPoint(),
    rightCenter: mockPoint(),
    topCenter: mockPoint(),
    width: 100,
  };
  clockwise = true;
  strokeColor: any = null;
  strokeScaling = true;
  strokeWidth = 0;
  area = 100;
  exclude = mockExclude;
  fitBounds = jest.fn();
  intersects = mockIntersects;
  remove = mockRemove;
  reorient = jest.fn();
  unite = mockUnite;

  constructor() {}
}

class MockCompoundPath {
  children: any[] = [];
  remove = jest.fn();
}

jest.mock('paper', () => {
  const mod = {
    Color: jest.fn(),
    CompoundPath: MockCompoundPath,
    Path: MockPath,
    Point: jest.fn().mockImplementation((x: number, y: number) => ({ x, y })),
    Project: jest.fn().mockImplementation(() => ({
      importSVG: jest.fn(),
    })),
    Rectangle: jest.fn().mockImplementation((x: number, y: number, width: number, height: number) => ({
      height,
      width,
      x,
      y,
    })),
  };

  return { __esModule: true, default: mod, ...mod };
});

import { generateCustomBaseShape, generateShapeTextPathD } from './buildCustomBaseShape';

const defaultFont = { family: 'Arial', postscriptName: 'ArialMT', style: 'Regular' };
const defaultTextValues: CustomShapeTextValues = {
  font: defaultFont,
  fontSize: 80,
  letterSpacing: 0,
  lineSpacing: 1,
  text: 'Hello',
};

describe('generateShapeTextPathD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null for empty text', async () => {
    const result = await generateShapeTextPathD({ ...defaultTextValues, text: '   ' });

    expect(result).toBeNull();
  });

  it('should return null when font descriptor not found', async () => {
    mockGetFontOfPostscriptName.mockReturnValue(null);

    const result = await generateShapeTextPathD(defaultTextValues);

    expect(result).toBeNull();
  });

  it('should return null when fontObj is null', async () => {
    mockGetFontOfPostscriptName.mockReturnValue({ family: 'Arial' });

    const textEl = document.createElementNS(NS.SVG, 'text');

    mockCreateTextElement.mockResolvedValue(textEl);
    mockGetFontObj.mockResolvedValue(null);

    const result = await generateShapeTextPathD(defaultTextValues);

    expect(result).toBeNull();
  });

  it('should return null when convertTextToPathByFontkit returns null', async () => {
    mockGetFontOfPostscriptName.mockReturnValue({ family: 'Arial' });

    const textEl = document.createElementNS(NS.SVG, 'text');

    mockCreateTextElement.mockResolvedValue(textEl);
    mockGetFontObj.mockResolvedValue({ mock: 'fontObj' });
    mockConvertTextToPathByFontkit.mockReturnValue(null);

    const result = await generateShapeTextPathD(defaultTextValues);

    expect(result).toBeNull();
  });

  it('should return path d when conversion succeeds', async () => {
    mockGetFontOfPostscriptName.mockReturnValue({ family: 'Arial' });

    const textEl = document.createElementNS(NS.SVG, 'text');

    mockCreateTextElement.mockResolvedValue(textEl);
    mockGetFontObj.mockResolvedValue({ mock: 'fontObj' });
    mockConvertTextToPathByFontkit.mockReturnValue({ d: 'M10 20 L30 40' });

    const result = await generateShapeTextPathD(defaultTextValues);

    expect(result).toBe('M10 20 L30 40');
  });

  it('should set text element to outline style', async () => {
    mockGetFontOfPostscriptName.mockReturnValue({ family: 'Arial' });

    const textEl = document.createElementNS(NS.SVG, 'text');

    mockCreateTextElement.mockResolvedValue(textEl);
    mockGetFontObj.mockResolvedValue({ mock: 'fontObj' });
    mockConvertTextToPathByFontkit.mockReturnValue({ d: 'M0 0' });

    await generateShapeTextPathD(defaultTextValues);

    expect(textEl.getAttribute('fill')).toBe('none');
    expect(textEl.getAttribute('stroke')).toBe('#000000');
  });

  it('should clean up SVG from DOM after processing', async () => {
    mockGetFontOfPostscriptName.mockReturnValue({ family: 'Arial' });

    const textEl = document.createElementNS(NS.SVG, 'text');

    mockCreateTextElement.mockResolvedValue(textEl);
    mockGetFontObj.mockResolvedValue({ mock: 'fontObj' });
    mockConvertTextToPathByFontkit.mockReturnValue({ d: 'M0 0' });

    await generateShapeTextPathD(defaultTextValues);

    // The svg should be removed from body
    expect(document.body.querySelector('svg')).toBeNull();
  });
});

describe('generateCustomBaseShape', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSvgCache.clear();
    mockGetFontOfPostscriptName.mockReturnValue(null);
  });

  it('should return null paths when no text and no element', async () => {
    const result = await generateCustomBaseShape(
      undefined,
      { ...defaultTextValues, text: '' },
      { enabled: false, shapeKey: '', size: 100 },
      3,
    );

    expect(result.basePath).toBeNull();
    expect(result.innerPath).toBeNull();
    expect(result.sizeRatio).toBe(1);
  });

  it('should return null paths when text is empty and element is disabled', async () => {
    const elementDef: CustomShapeElementOptionDef = {
      defaults: { enabled: true, shapeKey: 'basic/icon-heart1', size: 100 },
      options: [],
      positionRef: 'bottomCenter',
    };

    const result = await generateCustomBaseShape(
      elementDef,
      { ...defaultTextValues, text: '   ' },
      { enabled: false, shapeKey: 'basic/icon-heart1', size: 100 },
      3,
    );

    expect(result.basePath).toBeNull();
    expect(result.innerPath).toBeNull();
  });

  it('should build basePath from text path segments', async () => {
    // Mock generateShapeTextPathD to return a path
    mockGetFontOfPostscriptName.mockReturnValue({ family: 'Arial' });

    const textEl = document.createElementNS(NS.SVG, 'text');

    mockCreateTextElement.mockResolvedValue(textEl);
    mockGetFontObj.mockResolvedValue({ mock: 'fontObj' });
    mockConvertTextToPathByFontkit.mockReturnValue({ d: 'M10 20 L30 40' });

    // Mock path operations
    const unitedPath = new MockPath();

    mockUnite.mockReturnValue(unitedPath);
    mockIntersects.mockReturnValue(false);
    mockExclude.mockReturnValue(new MockPath());

    // Mock PaperOffset for outline
    const offsetResult = new MockPath();

    (offsetResult as any).unite = jest.fn().mockReturnValue(new MockPath());
    mockOffset.mockReturnValue(offsetResult);

    const result = await generateCustomBaseShape(
      undefined,
      defaultTextValues,
      { enabled: false, shapeKey: '', size: 100 },
      3,
    );

    expect(result.basePath).not.toBeNull();
    expect(result.project).toBeDefined();
  });

  it('should use sizeRatio when size is provided', async () => {
    mockGetFontOfPostscriptName.mockReturnValue({ family: 'Arial' });

    const textEl = document.createElementNS(NS.SVG, 'text');

    mockCreateTextElement.mockResolvedValue(textEl);
    mockGetFontObj.mockResolvedValue({ mock: 'fontObj' });
    mockConvertTextToPathByFontkit.mockReturnValue({ d: 'M10 20 L30 40' });

    const innerPath = new MockPath();

    (innerPath.bounds as any).width = 50;
    mockUnite.mockReturnValue(innerPath);
    mockIntersects.mockReturnValue(false);
    mockExclude.mockReturnValue(innerPath);

    const offsetResult = new MockPath();

    (offsetResult as any).unite = jest.fn().mockReturnValue(new MockPath());
    mockOffset.mockReturnValue(offsetResult);

    const result = await generateCustomBaseShape(
      undefined,
      defaultTextValues,
      { enabled: false, shapeKey: '', size: 100 },
      3,
      { dimension: 'width', value: 50 },
    );

    expect(result.sizeRatio).not.toBe(1);
  });

  it('should return null innerPath when compensatedOffset <= 0', async () => {
    mockGetFontOfPostscriptName.mockReturnValue({ family: 'Arial' });

    const textEl = document.createElementNS(NS.SVG, 'text');

    mockCreateTextElement.mockResolvedValue(textEl);
    mockGetFontObj.mockResolvedValue({ mock: 'fontObj' });
    mockConvertTextToPathByFontkit.mockReturnValue({ d: 'M10 20 L30 40' });

    mockUnite.mockReturnValue(new MockPath());
    mockIntersects.mockReturnValue(false);
    mockExclude.mockReturnValue(new MockPath());

    // outlineOffsetMm = 0 → compensatedOffset = 0
    const result = await generateCustomBaseShape(
      undefined,
      defaultTextValues,
      { enabled: false, shapeKey: '', size: 100 },
      0,
    );

    expect(result.innerPath).toBeNull();
  });

  it('should unite element path into basePath and innerPath when element is enabled', async () => {
    // Generate valid text path
    mockGetFontOfPostscriptName.mockReturnValue({ family: 'Arial' });

    const textEl = document.createElementNS(NS.SVG, 'text');

    mockCreateTextElement.mockResolvedValue(textEl);
    mockGetFontObj.mockResolvedValue({ mock: 'fontObj' });
    mockConvertTextToPathByFontkit.mockReturnValue({ d: 'M10 20 L30 40' });

    // Set up element SVG cache
    mockSvgCache.set('basic/icon-heart1', '<svg>heart</svg>');

    // Mock Paper.js project importSVG for element loading
    const paper = jest.requireMock('paper').default;
    const elementSvgItem = { remove: jest.fn() };
    const elementPathItem = new MockPath();

    paper.Project.mockImplementation(() => ({
      importSVG: jest.fn().mockReturnValue(elementSvgItem),
    }));
    mockCollectPathItems.mockReturnValue([elementPathItem]);

    // Path ops
    const unitedPath = new MockPath();

    mockUnite.mockReturnValue(unitedPath);
    mockIntersects.mockReturnValue(false);
    mockExclude.mockReturnValue(new MockPath());

    // Offset
    const offsetResult = new MockPath();

    (offsetResult as any).unite = jest.fn().mockReturnValue(new MockPath());
    mockOffset.mockReturnValue(offsetResult);

    const elementDef: CustomShapeElementOptionDef = {
      defaults: { enabled: true, shapeKey: 'basic/icon-heart1', size: 100 },
      options: ['basic/icon-heart1'],
      positionRef: 'bottomCenter',
    };

    const result = await generateCustomBaseShape(
      elementDef,
      defaultTextValues,
      { enabled: true, shapeKey: 'basic/icon-heart1', size: 100 },
      3,
    );

    expect(result.basePath).not.toBeNull();
    // Element path should have been united
    expect(mockUnite).toHaveBeenCalled();
  });

  it('should handle intersecting path segments with unite instead of exclude', async () => {
    mockGetFontOfPostscriptName.mockReturnValue({ family: 'Arial' });

    const textEl = document.createElementNS(NS.SVG, 'text');

    mockCreateTextElement.mockResolvedValue(textEl);
    mockGetFontObj.mockResolvedValue({ mock: 'fontObj' });
    mockConvertTextToPathByFontkit.mockReturnValue({ d: 'M10 20 L30 40' });

    mockIntersects.mockReturnValue(true); // paths intersect
    mockUnite.mockReturnValue(new MockPath());

    const offsetResult = new MockPath();

    (offsetResult as any).unite = jest.fn().mockReturnValue(new MockPath());
    mockOffset.mockReturnValue(offsetResult);

    await generateCustomBaseShape(undefined, defaultTextValues, { enabled: false, shapeKey: '', size: 100 }, 3);

    // For intersecting paths, innerPath uses unite instead of exclude
    expect(mockUnite).toHaveBeenCalled();
    expect(mockExclude).not.toHaveBeenCalled();
  });

  it('should remove inner holes when offset produces CompoundPath', async () => {
    mockGetFontOfPostscriptName.mockReturnValue({ family: 'Arial' });

    const textEl = document.createElementNS(NS.SVG, 'text');

    mockCreateTextElement.mockResolvedValue(textEl);
    mockGetFontObj.mockResolvedValue({ mock: 'fontObj' });
    mockConvertTextToPathByFontkit.mockReturnValue({ d: 'M10 20 L30 40' });

    mockUnite.mockReturnValue(new MockPath());
    mockIntersects.mockReturnValue(false);
    mockExclude.mockReturnValue(new MockPath());

    // Simulate PaperOffset.offset returning a compound path that after unite is a CompoundPath
    const outlineChild1 = new MockPath();

    outlineChild1.clockwise = true;
    outlineChild1.area = 1000;

    const holeChild = new MockPath();

    holeChild.clockwise = false;
    holeChild.area = -50;
    holeChild.remove = jest.fn();

    const compoundResult = new MockCompoundPath();

    compoundResult.children = [outlineChild1, holeChild];
    (compoundResult as any).reorient = jest.fn();

    const offsetResult = new MockPath();

    (offsetResult as any).unite = jest.fn().mockReturnValue(compoundResult);
    mockOffset.mockReturnValue(offsetResult);

    // Need to make compoundResult pass instanceof paper.CompoundPath
    Object.setPrototypeOf(compoundResult, MockCompoundPath.prototype);

    const result = await generateCustomBaseShape(
      undefined,
      defaultTextValues,
      { enabled: false, shapeKey: '', size: 100 },
      3,
    );

    // The hole child (opposite clockwise from outline) should be removed
    expect(holeChild.remove).toHaveBeenCalled();
    expect(result.basePath).not.toBeNull();
  });

  it('should build shape from element only when text is empty', async () => {
    mockGetFontOfPostscriptName.mockReturnValue(null); // No font = no text path

    mockSvgCache.set('basic/icon-heart1', '<svg>heart</svg>');

    const paper = jest.requireMock('paper').default;
    const elementSvgItem = { remove: jest.fn() };
    const elementPathItem = new MockPath();

    paper.Project.mockImplementation(() => ({
      importSVG: jest.fn().mockReturnValue(elementSvgItem),
    }));
    mockCollectPathItems.mockReturnValue([elementPathItem]);
    mockUnite.mockReturnValue(new MockPath());

    const offsetResult = new MockPath();

    (offsetResult as any).unite = jest.fn().mockReturnValue(new MockPath());
    mockOffset.mockReturnValue(offsetResult);

    const elementDef: CustomShapeElementOptionDef = {
      defaults: { enabled: true, shapeKey: 'basic/icon-heart1', size: 100 },
      options: ['basic/icon-heart1'],
      positionRef: 'topCenter',
    };

    const result = await generateCustomBaseShape(
      elementDef,
      { ...defaultTextValues, text: '' },
      { enabled: true, shapeKey: 'basic/icon-heart1', size: 100 },
      3,
    );

    expect(result.basePath).not.toBeNull();
  });
});
