const mockSvgStringToCanvas = jest.fn();

jest.mock(
  './svgStringToCanvas',
  () =>
    (...args: any[]) =>
      mockSvgStringToCanvas(...args),
);

import NS from '@core/app/constants/namespaces';

import { buildStandaloneSvg, rasterizeStandaloneSvg } from './standaloneSvg';

const size = { height: 200, width: 100 };
const viewBox = { height: 40, width: 20, x: 5, y: -10 };

/** findDefs needs #svgcanvas to hang #svg_defs off, and creates the defs itself when absent. */
const setupCanvas = (defsContent = '<symbol id="s1"></symbol>') => {
  document.body.innerHTML = `
    <svg id="svgcanvas">
      <svg id="svg_defs"><defs id="canvas-defs">${defsContent}</defs></svg>
    </svg>`;
};

const parse = (svgString: string) => {
  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');

  expect(doc.querySelector('parsererror')).toBeNull();

  return doc.documentElement;
};

describe('buildStandaloneSvg', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupCanvas();
  });

  test('sets the size, the viewBox and the namespaces the isolated render needs', () => {
    const root = parse(buildStandaloneSvg({ content: [], size, viewBox }));

    expect(root.getAttribute('width')).toBe('100');
    expect(root.getAttribute('height')).toBe('200');
    expect(root.getAttribute('viewBox')).toBe('5 -10 20 40');
    expect(root.namespaceURI).toBe(NS.SVG);
    expect(root.getAttribute('xmlns:xlink')).toBe(NS.XLINK);
  });

  test('carries the canvas defs by default, so referenced symbols travel with the content', () => {
    const root = parse(buildStandaloneSvg({ content: ['<use href="#s1" />'], size, viewBox }));

    expect(root.querySelector('#canvas-defs #s1')).not.toBeNull();
    expect(root.querySelector('use')).not.toBeNull();
  });

  test('uses the given defs instead of the canvas ones', () => {
    const defs = document.createElementNS(NS.SVG, 'defs');

    defs.setAttribute('id', 'other-defs');

    const root = parse(buildStandaloneSvg({ content: [], defs, size, viewBox }));

    expect(root.querySelector('#other-defs')).not.toBeNull();
    expect(root.querySelector('#canvas-defs')).toBeNull();
  });

  test('omits defs entirely when passed false', () => {
    const root = parse(buildStandaloneSvg({ content: [], defs: false, size, viewBox }));

    expect(root.querySelector('defs')).toBeNull();
  });

  test('serializes elements with outerHTML and passes strings through, in order', () => {
    const rect = document.createElementNS(NS.SVG, 'rect');

    rect.setAttribute('id', 'r1');

    const root = parse(buildStandaloneSvg({ content: ['<circle id="c1" />', rect], defs: false, size, viewBox }));
    const ids = Array.from(root.children).map((child) => child.getAttribute('id'));

    expect(ids).toEqual(['c1', 'r1']);
  });

  test('skips empty entries so callers can pass optional markup inline', () => {
    const root = parse(
      buildStandaloneSvg({ content: [null, '', '<circle id="c1" />', undefined], defs: false, size, viewBox }),
    );

    expect(Array.from(root.children).map((child) => child.getAttribute('id'))).toEqual(['c1']);
  });

  test('places the font-face style before the content', () => {
    const root = parse(
      buildStandaloneSvg({
        content: ['<text id="t1">hi</text>'],
        defs: false,
        fontFaceCss: '<style>@font-face { font-family: "Foo"; }</style>',
        size,
        viewBox,
      }),
    );

    expect(root.children[0].tagName).toBe('style');
    expect(root.querySelector('style')!.textContent).toContain('@font-face');
  });
});

describe('rasterizeStandaloneSvg', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupCanvas();
    mockSvgStringToCanvas.mockResolvedValue('canvas');
  });

  test('renders at the svg size by default', async () => {
    await expect(rasterizeStandaloneSvg({ content: [], defs: false, size, viewBox })).resolves.toBe('canvas');
    expect(mockSvgStringToCanvas).toHaveBeenCalledWith(expect.stringContaining('viewBox="5 -10 20 40"'), 100, 200);
  });

  test('renders at the given size when it differs, leaving the svg size alone', async () => {
    await rasterizeStandaloneSvg({ content: [], defs: false, size, viewBox }, { height: 50, width: 25 });

    const [svgString, width, height] = mockSvgStringToCanvas.mock.calls[0];

    expect([width, height]).toEqual([25, 50]);
    // the drawing still describes itself at full size; the canvas scales it down
    expect(parse(svgString).getAttribute('width')).toBe('100');
  });
});
