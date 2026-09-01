import elementIntersectsRect from './elementIntersectsRect';

const SVG_NS = 'http://www.w3.org/2000/svg';

const identityCtm = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } as DOMMatrix;
// content CTM inverse stub: combining with an element's screen CTM just returns it
const contentCtmInverse = { multiply: (m: DOMMatrix) => m } as DOMMatrix;

// path stub whose outline is the polyline through verts, with linear getPointAtLength
const makePath = (verts: Array<[number, number]>, ctm: DOMMatrix = identityCtm): SVGPathElement => {
  const elem = document.createElementNS(SVG_NS, 'path');
  const segments: Array<{ from: [number, number]; len: number; to: [number, number] }> = [];
  let total = 0;

  for (let i = 1; i < verts.length; i++) {
    const len = Math.hypot(verts[i][0] - verts[i - 1][0], verts[i][1] - verts[i - 1][1]);

    segments.push({ from: verts[i - 1], len, to: verts[i] });
    total += len;
  }

  const xs = verts.map(([x]) => x);
  const ys = verts.map(([, y]) => y);

  Object.assign(elem, {
    getBBox: () => ({
      height: Math.max(...ys) - Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      x: Math.min(...xs),
      y: Math.min(...ys),
    }),
    getPointAtLength: (dist: number) => {
      let remaining = dist;

      for (const { from, len, to } of segments) {
        if (remaining <= len) {
          const t = len ? remaining / len : 0;

          return { x: from[0] + (to[0] - from[0]) * t, y: from[1] + (to[1] - from[1]) * t };
        }

        remaining -= len;
      }

      return { x: verts[verts.length - 1][0], y: verts[verts.length - 1][1] };
    },
    getScreenCTM: () => ctm,
    getTotalLength: () => total,
  });

  return elem as SVGPathElement;
};

// non-geometry stub (image-like): bbox only, no getTotalLength
const makeBoxElem = (tag: string, bbox: { height: number; width: number; x: number; y: number }): SVGElement => {
  const elem = document.createElementNS(SVG_NS, tag);

  Object.assign(elem, { getBBox: () => bbox, getScreenCTM: () => identityCtm });

  return elem;
};

describe('elementIntersectsRect', () => {
  // open square missing its right edge, bbox (0,0)-(100,100)
  const cShape = makePath([
    [100, 0],
    [0, 0],
    [0, 100],
    [100, 100],
  ]);

  test('rect inside the empty interior of a C shape does not intersect', () => {
    expect(elementIntersectsRect(cShape, { height: 20, width: 20, x: 40, y: 40 }, contentCtmInverse)).toBe(false);
  });

  test('rect touching the outline of a C shape intersects', () => {
    expect(elementIntersectsRect(cShape, { height: 20, width: 10, x: -5, y: 40 }, contentCtmInverse)).toBe(true);
  });

  test('rect fully containing the shape intersects', () => {
    expect(elementIntersectsRect(cShape, { height: 200, width: 200, x: -50, y: -50 }, contentCtmInverse)).toBe(true);
  });

  test('scaled element is sampled in content space', () => {
    // 20 local units long, scaled 5x -> spans x 0..100 in content space
    const scaled = makePath(
      [
        [0, 0],
        [20, 0],
      ],
      { a: 5, b: 0, c: 0, d: 5, e: 0, f: 0 } as DOMMatrix,
    );

    expect(elementIntersectsRect(scaled, { height: 10, width: 10, x: 50, y: -5 }, contentCtmInverse)).toBe(true);
    expect(elementIntersectsRect(scaled, { height: 10, width: 10, x: 50, y: 20 }, contentCtmInverse)).toBe(false);
  });

  describe('group with sparse children', () => {
    const group = makeBoxElem('g', { height: 100, width: 100, x: 0, y: 0 });

    group.appendChild(makeBoxElem('image', { height: 10, width: 10, x: 0, y: 0 }));
    group.appendChild(makeBoxElem('image', { height: 10, width: 10, x: 90, y: 90 }));

    test('rect in the empty middle of the group does not intersect', () => {
      expect(elementIntersectsRect(group, { height: 20, width: 20, x: 40, y: 40 }, contentCtmInverse)).toBe(false);
    });

    test('rect over one child intersects', () => {
      expect(elementIntersectsRect(group, { height: 10, width: 10, x: 5, y: 5 }, contentCtmInverse)).toBe(true);
    });
  });

  describe('text with per-character extents', () => {
    // four glyphs at the corners of a ring, bbox (0,0)-(100,100) — like text on a circle path
    const makeText = (extents: Array<{ height: number; width: number; x: number; y: number }>): SVGElement => {
      const elem = makeBoxElem('text', { height: 100, width: 100, x: 0, y: 0 });

      Object.assign(elem, {
        getExtentOfChar: (i: number) => extents[i],
        getNumberOfChars: () => extents.length,
      });

      return elem;
    };

    const ringText = makeText([
      { height: 10, width: 10, x: 45, y: 0 },
      { height: 10, width: 10, x: 90, y: 45 },
      { height: 10, width: 10, x: 45, y: 90 },
      { height: 10, width: 10, x: 0, y: 45 },
    ]);

    test('rect inside the ring does not intersect', () => {
      expect(elementIntersectsRect(ringText, { height: 20, width: 20, x: 40, y: 40 }, contentCtmInverse)).toBe(false);
    });

    test('rect over a glyph intersects', () => {
      expect(elementIntersectsRect(ringText, { height: 10, width: 10, x: 48, y: 5 }, contentCtmInverse)).toBe(true);
    });

    test('empty text falls back to bbox overlap', () => {
      expect(elementIntersectsRect(makeText([]), { height: 20, width: 20, x: 40, y: 40 }, contentCtmInverse)).toBe(
        true,
      );
    });
  });

  test('non-geometry leaf falls back to bbox overlap', () => {
    const image = makeBoxElem('image', { height: 50, width: 50, x: 0, y: 0 });

    expect(elementIntersectsRect(image, { height: 5, width: 5, x: 10, y: 10 }, contentCtmInverse)).toBe(true);
  });

  test('element without geometry APIs does not intersect', () => {
    expect(
      elementIntersectsRect(
        document.createElementNS(SVG_NS, 'g'),
        { height: 5, width: 5, x: 0, y: 0 },
        contentCtmInverse,
      ),
    ).toBe(false);
  });
});
