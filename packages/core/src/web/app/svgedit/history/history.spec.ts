const mockGetTransformList = jest.fn();

window.svgedit.transformlist = {
  getTransformList: mockGetTransformList,
  removeElementFromListMap: jest.fn(),
};
window.svgedit.utilities = {
  getRotationAngleFromTransformList: (tlist: any) => {
    for (let i = 0; i < (tlist?.numberOfItems ?? 0); i += 1) {
      const xform = tlist.getItem(i);

      if (xform.type === 4) return xform.angle;
    }

    return 0;
  },
};

import { ChangeElementCommand } from './history';

const makeTlist = (items: Array<{ angle?: number; type: number }>) => ({
  getItem: (i: number) => items[i],
  numberOfItems: items.length,
});

describe('ChangeElementCommand transform relocation', () => {
  beforeAll(() => {
    (SVGElement.prototype as any).getBBox = () => ({ height: 10, width: 10, x: 10, y: 20 });
  });

  const makeElem = (transform: string) => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    elem.setAttribute('transform', transform);
    elem.setAttribute('font-family', 'NewFont');

    return elem;
  };

  test('keeps scale matrix on rotated element when undoing a non-transform attribute', () => {
    const transform = 'rotate(30 10 10) matrix(2 0 0 2 0 0)';
    const elem = makeElem(transform);

    mockGetTransformList.mockReturnValue(makeTlist([{ angle: 30, type: 4 }, { type: 1 }]));

    const cmd = new ChangeElementCommand(elem, { 'font-family': 'OldFont' });

    cmd.unapply();

    expect(elem.getAttribute('font-family')).toBe('OldFont');
    expect(elem.getAttribute('transform')).toBe(transform);
  });

  test('still re-centers a pure rotational transform', () => {
    const elem = makeElem('rotate(30 10 10)');

    mockGetTransformList.mockReturnValue(makeTlist([{ angle: 30, type: 4 }]));

    const cmd = new ChangeElementCommand(elem, { 'font-family': 'OldFont' });

    cmd.unapply();

    expect(elem.getAttribute('transform')).toBe('rotate(30 15, 25)');
  });
});
