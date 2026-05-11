import NS from '@core/app/constants/namespaces';
import type { ElementOptionDef, KeyChainState } from '../types';

const mockGetNPIconByID = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  getNPIconByID: (...args: any[]) => mockGetNPIconByID(...args),
}));

const mockRenderToStaticMarkup = jest.fn();

jest.mock('react-dom/server', () => ({
  __esModule: true,
  default: { renderToStaticMarkup: (...args: any[]) => mockRenderToStaticMarkup(...args) },
}));

const mockCollectPathItems = jest.fn();

jest.mock('./buildShape', () => ({
  collectPathItems: (...args: any[]) => mockCollectPathItems(...args),
}));

const mockImportSVG = jest.fn();
const mockFitBounds = jest.fn();
const mockExportSVG = jest.fn();
const mockRemove = jest.fn();
const mockUnite = jest.fn();

import { applyElements, loadShape, NP_SHAPE_PREFIX, svgCache } from './buildElement';

describe('loadShape', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    svgCache.clear();
  });

  it('should return null for empty shapeKey', async () => {
    expect(await loadShape('')).toBeNull();
  });

  it('should return cached SVG if available', async () => {
    svgCache.set('basic/icon-heart1', '<svg>heart</svg>');

    const result = await loadShape('basic/icon-heart1');

    expect(result).toBe('<svg>heart</svg>');
  });

  it('should load Noun Project shape via getNPIconByID', async () => {
    const mockBase64 = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';

    mockGetNPIconByID.mockResolvedValue(mockBase64);
    global.fetch = jest.fn().mockResolvedValue({ text: () => Promise.resolve('<svg>np</svg>') }) as any;

    const result = await loadShape('np/12345');

    expect(mockGetNPIconByID).toHaveBeenCalledWith('12345');
    expect(result).toBe('<svg>np</svg>');
    expect(svgCache.get('np/12345')).toBe('<svg>np</svg>');
  });

  it('should return null when getNPIconByID returns null', async () => {
    mockGetNPIconByID.mockResolvedValue(null);

    const result = await loadShape('np/99999');

    expect(result).toBeNull();
  });

  it('should export NP_SHAPE_PREFIX as np/', () => {
    expect(NP_SHAPE_PREFIX).toBe('np/');
  });
});

describe('applyElements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    svgCache.clear();
  });

  const makeProject = () => ({ importSVG: mockImportSVG }) as any;
  const makeSvg = () => document.createElementNS(NS.SVG, 'svg');

  it('should skip disabled elements', async () => {
    const svg = makeSvg();
    const state = {
      elements: { e1: { emboss: false, enabled: false, shapeKey: 'basic/icon-heart1' } },
    } as unknown as KeyChainState;
    const defs: ElementOptionDef[] = [
      { bounds: { height: 50, width: 50, x: 0, y: 0 }, defaults: {} as any, id: 'e1', options: [] },
    ];

    await applyElements(makeProject(), svg, state, defs);
    expect(svg.children.length).toBe(0);
  });

  it('should skip elements with empty shapeKey', async () => {
    const svg = makeSvg();
    const state = {
      elements: { e1: { emboss: false, enabled: true, shapeKey: '' } },
    } as unknown as KeyChainState;
    const defs: ElementOptionDef[] = [
      { bounds: { height: 50, width: 50, x: 0, y: 0 }, defaults: {} as any, id: 'e1', options: [] },
    ];

    await applyElements(makeProject(), svg, state, defs);
    expect(svg.children.length).toBe(0);
  });

  it('should skip when shape SVG cannot be loaded', async () => {
    const svg = makeSvg();
    const state = {
      elements: { e1: { emboss: false, enabled: true, shapeKey: 'np/missing' } },
    } as unknown as KeyChainState;
    const defs: ElementOptionDef[] = [
      { bounds: { height: 50, width: 50, x: 0, y: 0 }, defaults: {} as any, id: 'e1', options: [] },
    ];

    mockGetNPIconByID.mockResolvedValue(null);

    await applyElements(makeProject(), svg, state, defs);
    expect(svg.children.length).toBe(0);
  });

  it('should skip when collectPathItems returns empty', async () => {
    svgCache.set('basic/icon-heart1', '<svg>heart</svg>');

    const svgItem = { remove: jest.fn() };

    mockImportSVG.mockReturnValue(svgItem);
    mockCollectPathItems.mockReturnValue([]);

    const svg = makeSvg();
    const state = {
      elements: { e1: { emboss: false, enabled: true, shapeKey: 'basic/icon-heart1' } },
    } as unknown as KeyChainState;
    const defs: ElementOptionDef[] = [
      { bounds: { height: 50, width: 50, x: 0, y: 0 }, defaults: {} as any, id: 'e1', options: [] },
    ];

    await applyElements(makeProject(), svg, state, defs);
    expect(svgItem.remove).toHaveBeenCalled();
    expect(svg.children.length).toBe(0);
  });

  it('should import shape, scale to bounds, and append path to SVG', async () => {
    svgCache.set('basic/icon-heart1', '<svg>heart</svg>');

    const pathEl = document.createElementNS(NS.SVG, 'path');

    pathEl.setAttribute('d', 'M0 0');

    const shapePath = {
      exportSVG: mockExportSVG.mockReturnValue(pathEl),
      fitBounds: mockFitBounds,
      remove: mockRemove,
      unite: mockUnite,
    };
    const svgItem = { remove: jest.fn() };

    mockImportSVG.mockReturnValue(svgItem);
    mockCollectPathItems.mockReturnValue([shapePath]);

    const svg = makeSvg();
    const state = {
      elements: { e1: { emboss: false, enabled: true, shapeKey: 'basic/icon-heart1' } },
    } as unknown as KeyChainState;
    const defs: ElementOptionDef[] = [
      { bounds: { height: 50, width: 50, x: 10, y: 20 }, defaults: {} as any, id: 'e1', options: [] },
    ];

    await applyElements(makeProject(), svg, state, defs);

    expect(mockFitBounds).toHaveBeenCalled();
    expect(svg.children.length).toBe(1);
    expect(svg.children[0].getAttribute('fill')).toBe('#000');
    expect(svg.children[0].hasAttribute('stroke')).toBe(false);
  });

  it('should handle compound path (g element) by extracting inner paths', async () => {
    svgCache.set('basic/icon-star1', '<svg>star</svg>');

    const inner1 = document.createElementNS(NS.SVG, 'path');

    inner1.setAttribute('d', 'M1 1');

    const inner2 = document.createElementNS(NS.SVG, 'path');

    inner2.setAttribute('d', 'M2 2');

    const gEl = document.createElementNS(NS.SVG, 'g');

    gEl.appendChild(inner1);
    gEl.appendChild(inner2);

    const shapePath = {
      exportSVG: mockExportSVG.mockReturnValue(gEl),
      fitBounds: mockFitBounds,
      remove: mockRemove,
      unite: mockUnite,
    };
    const svgItem = { remove: jest.fn() };

    mockImportSVG.mockReturnValue(svgItem);
    mockCollectPathItems.mockReturnValue([shapePath]);

    const svg = makeSvg();
    const state = {
      elements: { e1: { emboss: false, enabled: true, shapeKey: 'basic/icon-star1' } },
    } as unknown as KeyChainState;
    const defs: ElementOptionDef[] = [
      { bounds: { height: 50, width: 50, x: 0, y: 0 }, defaults: {} as any, id: 'e1', options: [] },
    ];

    await applyElements(makeProject(), svg, state, defs);

    expect(svg.children.length).toBe(2);
    expect(svg.children[0].getAttribute('fill')).toBe('#000');
    expect(svg.children[1].getAttribute('fill')).toBe('#000');
  });

  it('should unite multiple path items from a single shape', async () => {
    svgCache.set('basic/icon-multi', '<svg>multi</svg>');

    const pathEl = document.createElementNS(NS.SVG, 'path');

    pathEl.setAttribute('d', 'M0 0');

    const path1 = { fitBounds: mockFitBounds, remove: mockRemove, unite: mockUnite };
    const path2 = { remove: mockRemove };
    const unitedPath = {
      exportSVG: mockExportSVG.mockReturnValue(pathEl),
      fitBounds: mockFitBounds,
      remove: mockRemove,
      unite: mockUnite,
    };

    mockUnite.mockReturnValue(unitedPath);
    mockImportSVG.mockReturnValue({ remove: jest.fn() });
    mockCollectPathItems.mockReturnValue([path1, path2]);

    const svg = makeSvg();
    const state = {
      elements: { e1: { emboss: false, enabled: true, shapeKey: 'basic/icon-multi' } },
    } as unknown as KeyChainState;
    const defs: ElementOptionDef[] = [
      { bounds: { height: 50, width: 50, x: 0, y: 0 }, defaults: {} as any, id: 'e1', options: [] },
    ];

    await applyElements(makeProject(), svg, state, defs);

    expect(mockUnite).toHaveBeenCalledWith(path2);
    expect(svg.children.length).toBe(1);
  });
});
