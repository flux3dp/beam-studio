const mockBuildExtrusion = jest.fn();
const mockConvertTextToPath = jest.fn();
const mockCreateExtrusionSource = jest.fn((elem: SVGElement, _options?: unknown) => ({
  depth: 1,
  markup: new XMLSerializer().serializeToString(elem),
  scale: 0.1,
  type: 'svg' as const,
}));
const mockInsertStlGeometry = jest.fn();

jest.mock('@core/app/actions/beambox/font-funcs', () => ({
  convertTextToPath: (...args: unknown[]) => mockConvertTextToPath(...args),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/coordinates', () => ({
  MM_TO_SCENE: 10,
  sceneToSvgY: (y: number) => 1000 - y,
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/engravable', () => ({
  getEngravableBox: () => ({ center: [400, 500, 60], depth: 600, isValid: true, width: 600 }),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/material', () => ({
  getMaterial: () => ({ height: 120 }),
}));
jest.mock('@core/app/components/beambox/InnerEngraving/utils/transform', () => ({
  IDENTITY_TRANSFORM: { flip: [false, false, false], rotation: [0, 0, 0], scale: [1, 1, 1] },
}));
jest.mock('@core/app/stores/canvas/utils/mouseMode', () => ({ setMouseMode: jest.fn() }));
jest.mock('@core/app/svgedit/selection', () => ({ selectOnly: jest.fn() }));
jest.mock('@core/app/svgedit/stl/extrusionSource', () => ({
  buildExtrusion: (...args: unknown[]) => mockBuildExtrusion(...args),
  createExtrusionSource: (...args: [SVGElement, unknown?]) => mockCreateExtrusionSource(...args),
  serializeExtrusionSource: (source: unknown) => JSON.stringify(source),
}));
jest.mock('@core/app/svgedit/workarea', () => ({ height: 1000, width: 1000 }));
jest.mock('@core/app/svgedit/operations/import/importStl', () => ({
  insertStlGeometry: (...args: unknown[]) => mockInsertStlGeometry(...args),
}));

import importTextAsStl from './importText';

describe('importTextAsStl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildExtrusion.mockReturnValue({ buffer: new ArrayBuffer(8), geometry: { mesh: true } });
    mockInsertStlGeometry.mockResolvedValue(undefined);
    mockConvertTextToPath.mockImplementation(async (text: SVGTextElement) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

      path.setAttribute('d', 'M20 30H120V80H20Z');
      Object.defineProperty(path, 'getBBox', {
        value: () => ({ height: 50, width: 100, x: 20, y: 30 }),
      });
      text.replaceWith(path);

      return { path };
    });
  });

  test('retains editable text and creates a natural-size 1mm extrusion at the workarea centre', async () => {
    document.body.innerHTML = '<svg><text id="text-1" font-size="20">Flux</text></svg>';

    const text = document.getElementById('text-1') as unknown as SVGTextElement;

    await expect(importTextAsStl(text)).resolves.toBe(true);

    const source = mockBuildExtrusion.mock.calls[0][0];

    expect(mockCreateExtrusionSource).toHaveBeenCalledWith(text, { depth: 1, unit: 'scene' });
    expect(source).toMatchObject({
      depth: 1,
      markup: expect.stringContaining('<text'),
      scale: 0.1,
      type: 'svg',
    });
    expect(source.geometryMarkup).toContain('<path');
    expect(mockInsertStlGeometry).toHaveBeenCalledWith(
      expect.any(ArrayBuffer),
      { mesh: true },
      { 'data-stl-source': JSON.stringify(source) },
      {
        initialTransform: {
          flip: [false, false, false],
          position: [500, 500, 60],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        mergeWithPreviousHistory: true,
        replaceElement: text,
        skipFitPrompt: true,
      },
    );
    expect(document.querySelector('[id$="-3d-conversion"]')).toBeNull();
  });
});
