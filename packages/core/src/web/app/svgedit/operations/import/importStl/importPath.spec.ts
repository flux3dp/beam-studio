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
const mockCreateExtrusionSource = jest.fn(() => ({
  depth: 1,
  markup: '<rect height="250" width="500" />',
  scale: 1,
  type: 'svg' as const,
}));
const mockGetExtrusionSize = jest.fn(() => ({ x: 500, y: 250 }));
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

  it('sizes generated geometry from the safe engravable box and skips the STL fit prompt', async () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    await importSvgElementAsStl(elem, true);

    expect(mockBuildExtrusion).toHaveBeenCalledWith(expect.objectContaining({ depth: 1, scale: 0.14 }));
    expect(mockInsertStlGeometry).toHaveBeenCalledWith(
      expect.any(ArrayBuffer),
      expect.anything(),
      { 'data-stl-source': 'serialized-source' },
      { skipFitPrompt: true },
    );
  });
});
