const mockGetEngravableBox = jest.fn(() => ({
  center: [350, 350, 50],
  depth: 700,
  height: 100,
  isValid: true,
  max: [700, 700, 100],
  min: [0, 0, 0],
  width: 700,
}));

jest.mock('@core/app/components/beambox/InnerEngraving/utils/engravable', () => ({
  getEngravableBox: () => mockGetEngravableBox(),
}));

const mockBuildExtrusion = jest.fn(() => ({ buffer: new ArrayBuffer(8), geometry: { id: 'geometry' } }));
const mockCreateExtrusionSource = jest.fn(
  (_elem: SVGElement, { depth = 1, unit = 'mm' }: { depth?: number; unit?: 'mm' | 'scene' } = {}) => ({
    depth,
    markup: '<rect height="250" width="500" />',
    scale: unit === 'scene' ? 0.1 : 1,
    type: 'svg' as const,
  }),
);
const mockGetExtrusionSize = jest.fn((source: { scale: number }) => ({
  x: 500 * source.scale,
  y: 250 * source.scale,
}));
const mockSerializeExtrusionSource = jest.fn(() => 'serialized-source');

jest.mock('@core/app/svgedit/stl/extrusionSource', () => ({
  buildExtrusion: (...args: unknown[]) => mockBuildExtrusion(...args),
  createExtrusionSource: (...args: unknown[]) => mockCreateExtrusionSource(...args),
  getExtrusionSize: (...args: unknown[]) => mockGetExtrusionSize(...args),
  serializeExtrusionSource: (...args: unknown[]) => mockSerializeExtrusionSource(...args),
}));

const mockInsertStlGeometry = jest.fn();

jest.mock('.', () => ({
  insertStlGeometry: (...args: unknown[]) => mockInsertStlGeometry(...args),
}));

import { importSvgElementAsStl } from './importPath';

describe('importSvgElementAsStl', () => {
  beforeEach(() => jest.clearAllMocks());

  it('preserves scene-unit geometry size when it fits and skips the STL fit prompt', async () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    await importSvgElementAsStl(elem, { preserveSource: true, unit: 'scene' });

    expect(mockCreateExtrusionSource).toHaveBeenCalledWith(elem, { depth: 1, unit: 'scene' });
    expect(mockBuildExtrusion).toHaveBeenCalledWith(expect.objectContaining({ depth: 1, scale: 0.1 }));
    expect(mockInsertStlGeometry).toHaveBeenCalledWith(
      expect.any(ArrayBuffer),
      expect.anything(),
      { 'data-stl-source': 'serialized-source' },
      { skipFitPrompt: true },
    );
  });

  it('treats source units as millimetres by default', async () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    await importSvgElementAsStl(elem);

    expect(mockCreateExtrusionSource).toHaveBeenCalledWith(elem, { depth: 1, unit: 'mm' });
    expect(mockBuildExtrusion).toHaveBeenCalledWith(expect.objectContaining({ depth: 1, scale: 0.14 }));
  });
});
