/**
 * These specs run against the REAL paper.js instead of a fake, because every bug this file guards
 * against lives in the interaction with paper's boolean operations. Two environment shims are needed
 * for that, see the jest.mock('paper') and getComputedStyle notes below.
 */

// paper reads computed styles off nodes that are still owned by the DOMParser document created by
// importSVG. Browsers adopt those nodes into the main document, jsdom leaves defaultView null.
const originalGetComputedStyle = window.getComputedStyle.bind(window);

window.getComputedStyle = ((elem: Element, pseudo?: null | string) => {
  try {
    return originalGetComputedStyle(elem, pseudo || undefined) || ({ getPropertyValue: () => '' } as any);
  } catch {
    return { getPropertyValue: () => '' } as any;
  }
}) as typeof window.getComputedStyle;

// `import * as paper` goes through the ts-jest interop wrapper, which only copies own enumerable
// properties and so drops every class living on PaperScope.prototype. Webpack hands the raw export to
// the app, so re-expose the classes here to exercise the same code the app runs.
jest.mock('paper', () => {
  const core = require('paper/dist/paper-core.js');

  core.setup(new core.Size(1, 1));

  return {
    CompoundPath: core.CompoundPath,
    Group: core.Group,
    Item: core.Item,
    Matrix: core.Matrix,
    Path: core.Path,
    PathItem: core.PathItem,
    Point: core.Point,
    Project: core.Project,
    Rectangle: core.Rectangle,
    Shape: core.Shape,
  };
});

jest.mock('@core/helpers/svg-editor-helper', () => {
  class MockMatrix {
    constructor(
      public a = 1,
      public b = 0,
      public c = 0,
      public d = 1,
      public e = 0,
      public f = 0,
    ) {}

    multiply(o: MockMatrix) {
      return new MockMatrix(
        this.a * o.a + this.c * o.b,
        this.b * o.a + this.d * o.b,
        this.a * o.c + this.c * o.d,
        this.b * o.c + this.d * o.d,
        this.a * o.e + this.c * o.f + this.e,
        this.b * o.e + this.d * o.f + this.f,
      );
    }

    inverse() {
      const det = this.a * this.d - this.b * this.c;

      return new MockMatrix(
        this.d / det,
        -this.b / det,
        -this.c / det,
        this.a / det,
        (this.c * this.f - this.d * this.e) / det,
        (this.b * this.e - this.a * this.f) / det,
      );
    }
  }

  const parse = (str: string) => {
    const regex = /(matrix|translate|scale)\s*\(([^)]*)\)/g;
    let result = new MockMatrix();
    let match;

    while ((match = regex.exec(str))) {
      const v = match[2]
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number);

      if (match[1] === 'matrix') result = result.multiply(new MockMatrix(v[0], v[1], v[2], v[3], v[4], v[5]));
      else if (match[1] === 'translate') result = result.multiply(new MockMatrix(1, 0, 0, 1, v[0], v[1] || 0));
      else result = result.multiply(new MockMatrix(v[0], 0, 0, v.length > 1 ? v[1] : v[0], 0, 0));
    }

    return result;
  };

  return {
    getSVGAsync: (cb: any) =>
      cb({
        Canvas: {
          calcElemFilledInfo: (elem: Element) => {
            const fill = elem.getAttribute('fill') || '#000000';
            const filled = !['#fff', '#ffffff', 'none'].includes(fill.toLowerCase());

            return { isAllFilled: filled, isAnyFilled: filled };
          },
          findDefs: () => document.querySelector('#svg_defs'),
          getTransformList: (elem: Element) => ({ elem, numberOfItems: elem.getAttribute('transform') ? 1 : 0 }),
          getUrlFromAttr: (attr: null | string) => attr?.match(/url\((["']?)(.*?)\1\)/)?.[2] ?? null,
          transformListToTransform: (tlist: any) => ({
            matrix: tlist ? parse(tlist.elem.getAttribute('transform') || '') : new MockMatrix(),
          }),
        },
      }),
  };
});

import convertClipPath from './convertClipPath';

const paper = require('paper/dist/paper-core.js');

/** Circle centered on the origin, radius 45 */
const CIRCLE = 'm45,0a45,45 0 1 1 -90,0a45,45 0 1 1 90,0z';
/**
 * Squiggle running along the rim of CIRCLE, starting and ending exactly on it. Its last curve is
 * degenerate (start point === end point) and pokes outside, which used to defeat paper's splitter.
 */
const TAIL =
  'm-78.2,-30.38c1.07,0.05 2.22,0.2 3.2,0.38c3,-0.54 8.02,-0.69 6.7,1.71c-1.32,2.4 3.48,2.4 2.4,0c-1.08,-2.4 2.9,-1.51 5.9,-1.71c3,0.2 7.96,0.77 6.67,-1.63c-1.29,-2.4 3.51,-2.4 2.4,0c-1.11,2.4 2.93,2.17 5.93,1.63c3,0.54 7.8,1.76 6.46,-0.64c-1.34,-2.4 3.46,-2.4 2.4,0c-1.06,2.4 3.14,0.99 6.14,0.64c3,0.35 7.33,-0.65 6.2,1.75c-1.12,2.4 3.68,2.4 2.4,0c-1.27,-2.4 3.4,-1.52 6.4,-1.75c1.05,0.08 2.31,-0.03 3.44,-0.11c2.12,-0.14 0,0 0,0';

const buildDom = ({ clipPath = `<path d="${CIRCLE}"/>`, clipPathAttrs = '', content = '' }) => {
  document.body.innerHTML = `<svg id="svgroot" xmlns="http://www.w3.org/2000/svg">
    <svg id="svgcontent">
      <defs id="svg_defs">
        <clipPath id="def1" ${clipPathAttrs}>${clipPath}</clipPath>
      </defs>
      <g class="layer">
        <g transform="scale(10, 10)"><g transform="translate(45, 45)">${content}</g></g>
      </g>
    </svg>
  </svg>`;
};

const getResultPaths = () => Array.from(document.querySelectorAll<SVGPathElement>('#svgcontent g.layer path'));

/** Walks every rendered subpath and reports how far it gets from the origin */
const getMaxRadius = () => {
  let maxRadius = 0;

  getResultPaths().forEach((elem) => {
    const item = paper.PathItem.create(elem.getAttribute('d') || '');
    const subPaths = item.children?.length ? item.children : [item];

    subPaths.forEach((subPath: any) => {
      for (let i = 0; i <= 2000; i += 1) {
        const point = subPath.getPointAt((subPath.length * i) / 2000);

        if (point) maxRadius = Math.max(maxRadius, Math.hypot(point.x, point.y));
      }
    });
  });

  return maxRadius;
};

const getTotalLength = () =>
  getResultPaths().reduce((total, elem) => {
    const item = paper.PathItem.create(elem.getAttribute('d') || '');
    const subPaths = item.children?.length ? item.children : [item];

    return total + subPaths.reduce((sum: number, subPath: any) => sum + subPath.length, 0);
  }, 0);

describe('convertClipPath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should leave the document untouched when nothing is clipped', async () => {
    buildDom({ content: `<path id="target" d="${CIRCLE}" fill="none" stroke="#000000"/>` });

    const before = document.body.innerHTML;

    await convertClipPath();
    expect(document.body.innerHTML).toBe(before);
  });

  describe('unfilled paths', () => {
    const clipped = (d: string) =>
      `<g clip-path="url(#def1)"><path id="target" d="${d}" fill="none" stroke="#000000" stroke-width="0.1"/></g>`;

    test('should keep a subpath that runs along the clip outline as it is', async () => {
      buildDom({ content: clipped(CIRCLE) });
      await convertClipPath();

      const [path] = getResultPaths();

      // Coincident with the clip path, so no boolean operation should have touched it
      expect(path.getAttribute('d')).toBe(CIRCLE);
      expect(path.getAttribute('id')).toBe('target');
      expect(document.querySelector('#svgcontent [clip-path]')).toBeNull();
    });

    test('should clip a compound path without dropping it', async () => {
      buildDom({ content: clipped(CIRCLE + TAIL) });
      await convertClipPath();

      const [path] = getResultPaths();

      // Regression: paper inserts the trace:false result next to its source, and a CompoundPath
      // parent absorbs its children, which used to hand back an empty item and wipe out the element
      expect(path.getAttribute('d')).toBeTruthy();
      // Regression: a fresh CompoundPath carries the paper defaults and exported an invisible path
      expect(path.getAttribute('stroke')).toBe('#000000');
      expect(path.getAttribute('stroke-width')).toBe('0.1');
    });

    test('should not let clipped geometry escape the clip path', async () => {
      buildDom({ content: clipped(CIRCLE + TAIL) });
      await convertClipPath();

      // Regression: paper's splitBoolean skips a split when two crossings share a curve, which left
      // the tail sticking out to radius 45.74. 45.02 is the bezier approximation of CIRCLE itself.
      expect(getMaxRadius()).toBeLessThan(45.02);
      // full circle (282.74) + the part of the tail that really is inside (90.27)
      expect(getTotalLength()).toBeCloseTo(373.05, 1);
    });

    test('should cut a line crossing the clip outline', async () => {
      buildDom({ content: clipped('M-60,0 L60,0') });
      await convertClipPath();
      expect(getResultPaths()[0].getAttribute('d')).toBe('M-45,0h90');
    });

    test('should remove an element lying completely outside the clip path', async () => {
      buildDom({ content: clipped('M200,200 L300,300') });
      await convertClipPath();
      expect(getResultPaths()).toHaveLength(0);
    });
  });

  describe('filled paths', () => {
    test('should cut a filled rect down to the clipped area', async () => {
      buildDom({
        clipPath: '<rect x="0" y="0" width="100" height="100"/>',
        content: `<g clip-path="url(#def1)"><path id="target" d="M50,50 H150 V150 H50 Z" fill="#000000"/></g>`,
      });
      await convertClipPath();

      const item = paper.PathItem.create(getResultPaths()[0].getAttribute('d'));

      expect(item.bounds.toString()).toBe(new paper.Rectangle(50, 50, 50, 50).toString());
    });
  });

  describe('clip path resolution', () => {
    test('should clip an element that carries the clip-path itself', async () => {
      buildDom({
        clipPath: '<rect x="0" y="0" width="100" height="100"/>',
        content: `<path id="target" d="M-50,50 L150,50" fill="none" stroke="#000" clip-path="url(#def1)"/>`,
      });
      await convertClipPath();
      // Regression: clip() replaces elements through their parent, and the clone it works on used to
      // be detached, so replaceWith was a no-op and the element came back unclipped
      expect(getResultPaths()[0].getAttribute('d')).toBe('M0,50h100');
    });

    test('should follow the transform of the clipped element itself', async () => {
      buildDom({
        clipPath: '<rect x="0" y="0" width="100" height="100"/>',
        // clip-path is resolved in the space established by the element's own transform, so the
        // visible result has to be the 0-100 box shifted by the translate
        content: `<path id="target" transform="translate(1000, 0)" d="M-50,50 L150,50" fill="none" stroke="#000"
          clip-path="url(#def1)"/>`,
      });
      await convertClipPath();
      expect(paper.PathItem.create(getResultPaths()[0].getAttribute('d')).bounds.x).toBeCloseTo(1000, 6);
    });

    test('should resolve a clip path whose content is wrapped in a group', async () => {
      buildDom({
        clipPath: '<g><rect x="0" y="0" width="100" height="100"/></g>',
        content: `<g clip-path="url(#def1)"><path id="target" d="M-50,50 L150,50" fill="none" stroke="#000"/></g>`,
      });
      await convertClipPath();
      expect(getResultPaths()[0].getAttribute('d')).toBe('M0,50h100');
    });

    test('should leave the element unclipped when the clip path cannot be resolved', async () => {
      buildDom({
        clipPath: '<rect x="0" y="0" width="1" height="1"/>',
        clipPathAttrs: 'clipPathUnits="objectBoundingBox"',
        content: `<g clip-path="url(#def1)"><path id="target" d="M-50,50 L150,50" fill="none" stroke="#000"/></g>`,
      });
      await convertClipPath();

      const [path] = getResultPaths();

      // objectBoundingBox units would shrink the clip path to a 1x1 box next to the origin, dropping
      // the reference is far better than clipping the element away
      expect(path.getAttribute('d')).toBe('M-50,50 L150,50');
      expect(document.querySelector('#svgcontent [clip-path]')).toBeNull();
    });
  });

  test('should restore the original document on revert', async () => {
    buildDom({
      content: `<g clip-path="url(#def1)"><path id="target" d="${CIRCLE + TAIL}" fill="none" stroke="#000000"/></g>`,
    });

    const before = document.body.innerHTML;
    const revert = await convertClipPath();

    expect(document.body.innerHTML).not.toBe(before);
    revert();
    expect(document.body.innerHTML).toBe(before);
  });
});
