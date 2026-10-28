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

import {
  buildExtrusion,
  createExtrusionSource,
  parseExtrusionSourceValue,
  serializeExtrusionSource,
} from './extrusionSource';

describe('extrusionSource', () => {
  beforeEach(() => jest.clearAllMocks());

  test('normalizes source coordinates to millimetres when created', () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    expect(createExtrusionSource(elem).scale).toBe(1);
    expect(createExtrusionSource(elem, { unit: 'scene' }).scale).toBe(0.1);
  });

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

  test('the y flip keeps every face pointing outward', () => {
    const shape = new Shape();

    shape.moveTo(0, 0);
    shape.lineTo(10, 0);
    shape.lineTo(10, 10);
    shape.lineTo(0, 10);
    shape.closePath();
    mockParseSvg.mockReturnValue({ paths: [{ shapes: [shape] }] });

    const built = buildExtrusion({ depth: 1, markup: '<rect />', scale: 1, type: 'svg' });
    const position = built!.geometry.getAttribute('position');
    // non-indexed: three vertices per triangle. The signed volume is positive when the triangles
    // wind counter-clockwise seen from outside, negative for a mesh turned inside out by a mirror.
    let signedVolume = 0;

    for (let i = 0; i < position.count; i += 3) {
      const a = new Vector3().fromBufferAttribute(position, i);
      const b = new Vector3().fromBufferAttribute(position, i + 1);
      const c = new Vector3().fromBufferAttribute(position, i + 2);

      signedVolume += a.dot(b.clone().cross(c)) / 6;
    }

    expect(signedVolume).toBeCloseTo(100);
    // the shape still lands at y <= 0 and z in 0..depth
    expect(built!.geometry.boundingBox!.min.y).toBeCloseTo(-10);
    expect(built!.geometry.boundingBox!.max.y).toBeCloseTo(0);
    expect(built!.geometry.boundingBox!.min.z).toBeCloseTo(0);
    expect(built!.geometry.boundingBox!.max.z).toBeCloseTo(1);

    built!.geometry.dispose();
  });

  test('flattens a circle within half a pixel at 2000 DPI instead of a fixed segment count', () => {
    // the Element panel circle: r = 250 scene units = 25mm
    const circle = new Shape();

    circle.absellipse(250, 250, 250, 250, 0, Math.PI * 2, false, 0);
    mockParseSvg.mockReturnValue({ paths: [{ shapes: [circle] }] });

    const built = buildExtrusion({ depth: 1, markup: '<ellipse />', scale: 0.1, type: 'svg' });
    const position = built!.geometry.getAttribute('position');
    let maxDeviation = 0;

    for (let i = 0; i < position.count; i += 1) {
      // geometry is in mm, centred at (25, -25) after the y flip
      const radius = Math.hypot(position.getX(i) - 25, position.getY(i) + 25);

      maxDeviation = Math.max(maxDeviation, 25 - radius);
    }

    // vertices sit on the circle; the chord sagitta is the deviation, bounded by the step angle
    // front and back caps share their xy, so the distinct xy count is the segment count
    const segments = new Set(
      Array.from({ length: position.count }, (_, i) => `${position.getX(i).toFixed(4)},${position.getY(i).toFixed(4)}`),
    ).size;
    const sagitta = 25 * (1 - Math.cos(Math.PI / segments));

    expect(maxDeviation).toBeLessThan(1e-4); // float32 positions
    expect(segments).toBeGreaterThan(100);
    expect(sagitta).toBeLessThanOrEqual(1 / 80 / 2);
  });
});
