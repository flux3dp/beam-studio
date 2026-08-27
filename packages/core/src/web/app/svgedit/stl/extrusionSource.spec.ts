import { Shape, Vector3 } from 'three';

const mockParseSvg = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({ addCommandToHistory: jest.fn() }));
jest.mock('@core/app/stores/stlStore', () => ({ useStlStore: { getState: jest.fn() } }));

jest.mock('three/examples/jsm/loaders/SVGLoader.js', () => ({
  SVGLoader: class {
    static createShapes = (path: { shapes: Shape[] }) => path.shapes;
    parse = (...args: unknown[]) => mockParseSvg(...args);
  },
}));

jest.mock('three/examples/jsm/exporters/STLExporter.js', () => ({
  STLExporter: class {
    parse = () => new DataView(new ArrayBuffer(16));
  },
}));

import { buildExtrusion, parseExtrusionSourceValue, serializeExtrusionSource } from './extrusionSource';

describe('extrusionSource', () => {
  beforeEach(() => jest.clearAllMocks());

  test('round trips a valid editable SVG source', () => {
    const source = {
      depth: 1,
      markup: '<rect width="100" height="50" rx="10" />',
      scale: 0.1,
      type: 'svg' as const,
    };

    expect(parseExtrusionSourceValue(serializeExtrusionSource(source))).toEqual(source);
  });

  test('keeps editable text markup while building from its outlined geometry', () => {
    const source = {
      depth: 1,
      geometryMarkup: '<path d="M0 0H10V10H0Z" />',
      markup: '<text font-size="10">Flux</text>',
      scale: 0.1,
      type: 'svg' as const,
    };

    mockParseSvg.mockReturnValue({ paths: [] });

    expect(parseExtrusionSourceValue(serializeExtrusionSource(source))).toEqual(source);
    expect(buildExtrusion(source)).toBeNull();
    expect(mockParseSvg).toHaveBeenCalledWith(expect.stringContaining(source.geometryMarkup));
    expect(mockParseSvg).not.toHaveBeenCalledWith(expect.stringContaining(source.markup));
  });

  test.each([null, '', '{}', '{"type":"svg","markup":"","scale":1,"depth":1}', 'not json'])(
    'rejects an invalid source: %p',
    (value) => expect(parseExtrusionSourceValue(value)).toBeNull(),
  );

  test('rejects an empty outlined geometry', () => {
    expect(
      parseExtrusionSourceValue('{"type":"svg","markup":"<text>Flux</text>","geometryMarkup":"","scale":1,"depth":1}'),
    ).toBeNull();
  });

  test('builds a scaled extrusion while keeping depth in millimetres', () => {
    const shape = new Shape();

    shape.moveTo(0, 0);
    shape.lineTo(100, 0);
    shape.lineTo(100, 50);
    shape.lineTo(0, 50);
    shape.closePath();
    mockParseSvg.mockReturnValue({ paths: [{ shapes: [shape] }] });

    const built = buildExtrusion({
      depth: 1,
      markup: '<rect width="100" height="50" rx="10" />',
      scale: 0.1,
      type: 'svg',
    });

    expect(built).not.toBeNull();

    const size = built!.geometry.boundingBox!.getSize(new Vector3());

    expect(size.x).toBeCloseTo(10);
    expect(size.y).toBeCloseTo(5);
    expect(size.z).toBeCloseTo(1);
    expect(built!.buffer.byteLength).toBeGreaterThan(0);

    built!.geometry.dispose();
  });
});
