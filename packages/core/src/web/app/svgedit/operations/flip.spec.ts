const mockCall = jest.fn();
const mockGetSelectedElements = jest.fn();
const mockMoveElements = jest.fn();
const mockSetRotationAngle = jest.fn();
const mockAddCommandToHistory = jest.fn();
const mockRecalculateDimensions = jest.fn();

class FakeBatchCommand {
  subs: unknown[] = [];
  constructor(public name: string) {}
  addSubCommand = (cmd: unknown) => this.subs.push(cmd);
  isEmpty = () => this.subs.length === 0;
}

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: FakeBatchCommand,
  ChangeElementCommand: class {
    constructor(
      public elem: Element,
      public oldValues: Record<string, string>,
    ) {}
  },
}));
jest.mock('@core/app/svgedit/selection', () => ({ getSelectedElements: () => mockGetSelectedElements() }));
jest.mock('@core/app/svgedit/selector', () => ({
  getSelectorManager: () => ({ requestSelector: () => ({ resize: jest.fn(), show: jest.fn() }) }),
}));
jest.mock('@core/helpers/jimp-helper', () => ({ imageToUrl: jest.fn(), urlToImage: jest.fn() }));
jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb: any) => cb({ Canvas: { call: (...args: any[]) => mockCall(...args) } }),
}));
jest.mock('../history/undoManager', () => ({
  addCommandToHistory: (...args: any[]) => mockAddCommandToHistory(...args),
}));
jest.mock('../transform/recalculate', () => ({
  recalculateDimensions: (...args: any[]) => mockRecalculateDimensions(...args),
  setStartTransform: jest.fn(),
}));
jest.mock('../transform/rotation', () => ({
  getRotationAngle: (elem: Element) => Number(elem.getAttribute('data-angle') || 0),
  setRotationAngle: (...args: any[]) => mockSetRotationAngle(...args),
}));
// jsdom has no SVGTransformList; expose the element so the math mock can read its transform attribute.
jest.mock('../transform/transformlist', () => ({
  getTransformList: (elem: Element) => ({
    appendItem: jest.fn(),
    elem,
    insertItemBefore: jest.fn(),
    numberOfItems: elem.getAttribute('transform') ? 1 : 0,
  }),
}));
jest.mock('../utils/getBBox', () => ({
  getBBox: (elem: Element) => {
    const [x, y, width, height] = (elem.getAttribute('data-bbox') || '0 0 0 0').split(' ').map(Number);

    return { height, width, x, y };
  },
}));
jest.mock('./move', () => ({ moveElements: (...args: any[]) => mockMoveElements(...args) }));

import { flipSelectedElements } from './flip';

const translateMatrix = (e: number, f: number) => ({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e,
  f,
  inverse: () => translateMatrix(-e, -f),
});

const el = (tag: string, attrs: Record<string, string>, children: Element[] = []) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);

  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  children.forEach((c) => node.appendChild(c));

  return node;
};

describe('flipSelectedElements', () => {
  beforeAll(() => {
    (window as any).svgedit.math = {
      hasMatrixTransform: () => false,
      transformListToTransform: ({ elem }: { elem: Element }) => {
        const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(elem.getAttribute('transform') || '');

        return { matrix: translateMatrix(Number(m?.[1] ?? 0), Number(m?.[2] ?? 0)) };
      },
      transformPoint: (x: number, y: number, m: any) => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }),
    };

    const svgroot = el('svg', { id: 'svgroot' });

    (svgroot as any).createSVGTransform = () => ({ setScale: jest.fn(), setTranslate: jest.fn() });
    document.body.appendChild(svgroot);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRecalculateDimensions.mockReturnValue(null);
    mockMoveElements.mockReturnValue(null);
  });

  test('flips nested groups around the shared center, restores rotation, emits changed once', async () => {
    // Outer group centered at (100, 100). DOM order puts the rotated, translated inner group before the
    // sibling path, so the inner group's local center is on the stack when the sibling is reached.
    const inner = el('path', { 'data-bbox': '0 50 60 100', id: 'inner' });
    const innerGroup = el('g', { 'data-angle': '30', id: 'g1', transform: 'translate(50,0)' }, [inner]);
    const sibling = el('path', { 'data-bbox': '100 50 100 100', id: 'sibling' });
    const group = el('g', { 'data-bbox': '0 0 200 200', id: 'g0' }, [innerGroup, sibling]);

    mockGetSelectedElements.mockReturnValue([group]);

    await flipSelectedElements(-1, 1);

    // inner: center (100,100) in group coords → (50,100) in g1 coords; inner's own center is (30,100).
    expect(mockMoveElements).toHaveBeenCalledWith([40], [0], [inner], false, true);
    // sibling: uses the outer center (100,100), not g1's leaked (50,100); own center is (150,100).
    expect(mockMoveElements).toHaveBeenCalledWith([-100], [0], [sibling], false, true);

    // Rotated group: zeroed on entry and negated on exit, both recorded into the batch for redo.
    const batch = mockAddCommandToHistory.mock.calls[0][0];

    expect(mockSetRotationAngle).toHaveBeenCalledWith(innerGroup, 0, { parentCmd: batch });
    expect(mockSetRotationAngle).toHaveBeenCalledWith(innerGroup, -30, { parentCmd: batch });

    expect(mockCall).toHaveBeenCalledTimes(1);
    expect(mockCall).toHaveBeenCalledWith('changed', [group]);
  });
});
