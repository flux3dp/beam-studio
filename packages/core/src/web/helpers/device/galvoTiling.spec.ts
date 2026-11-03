const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockWorkarea = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: { getState: () => ({ workarea: mockWorkarea() }) },
}));

const mockSelectOnly = jest.fn();

jest.mock('@core/app/svgedit/selection', () => ({
  selectOnly: (...args) => mockSelectOnly(...args),
}));

const mockGetBBox = jest.fn();

jest.mock('@core/app/svgedit/utils/getBBox', () => ({
  getBBox: (...args) => mockGetBBox(...args),
}));

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (layer: Element, key: string) =>
    key === 'module' ? Number(layer.getAttribute('data-module')) : layer.getAttribute('data-galvoTiling') || 'grid',
}));

jest.mock('@core/helpers/layer-module/layer-module-helper', () => ({
  getLayersByModule: () => document.querySelectorAll('g.layer:not([display="none"]):not([data-repeat="0"])'),
}));

const mockGetGalvoConfig = jest.fn();

jest.mock('./galvoConfig', () => ({
  getGalvoConfig: (...args) => mockGetGalvoConfig(...args),
}));

import { checkObjectTilingItems, ensureObjectTilingFits, getLayerObjects } from './galvoTiling';

const layer = (title: string, tiling: string, objects: Array<[number, number]>, attrs = '') =>
  `<g class="layer" data-module="12" data-galvoTiling="${tiling}" ${attrs}><title>${title}</title><defs></defs>${objects
    .map(([w, h], i) => `<rect id="${title}-${i}" data-w="${w * 10}" data-h="${h * 10}" />`)
    .join('')}</g>`;

describe('test galvoTiling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWorkarea.mockReturnValue('fhx2galvo');
    mockGetGalvoConfig.mockResolvedValue({ workarea: 110 });
    // width and height in px (10 px = 1 mm), read from the element's own attributes
    mockGetBBox.mockImplementation((elem: Element) => ({
      height: Number(elem.getAttribute('data-h')),
      width: Number(elem.getAttribute('data-w')),
      x: 0,
      y: 0,
    }));
    document.body.innerHTML = '';
  });

  const mount = (content: string) => {
    document.body.innerHTML = `<svg><g id="svgcontent">${content}</g></svg>`;
    // the HTML parser lowercases attribute names, while the app's own (SVG) attributes keep their case
    document.querySelectorAll('[data-galvotiling]').forEach((elem) => {
      elem.setAttribute('data-galvoTiling', elem.getAttribute('data-galvotiling')!);
      elem.removeAttribute('data-galvotiling');
    });
  };

  test('does nothing outside HEXA G', async () => {
    mockWorkarea.mockReturnValue('fbb2');
    mount(layer('L1', 'object', [[200, 10]]));

    expect(await checkObjectTilingItems()).toEqual({ field: 0, items: [] });
    expect(mockGetGalvoConfig).not.toHaveBeenCalled();
  });

  test('finds objects wider or taller than the field', async () => {
    mount(
      layer('L1', 'object', [
        [111, 10],
        [10, 111],
        [110, 110],
        [110.001, 10],
      ]),
    );

    const { field, items } = await checkObjectTilingItems();

    expect(field).toBe(110);
    // exactly the field, and within the 0.001 mm tolerance of it, both pass
    expect(items.map((item) => item.id)).toEqual(['L1-0', 'L1-1']);
    expect(mockGetGalvoConfig).toHaveBeenCalledWith(12);
  });

  test('measures against the field of each layer head', async () => {
    mockGetGalvoConfig.mockResolvedValue({ workarea: 70 });
    mount(layer('L1', 'object', [[80, 10]]));

    const { field, items } = await checkObjectTilingItems();

    expect(field).toBe(70);
    expect(items).toHaveLength(1);
  });

  test('skips grid, hidden and empty layers', async () => {
    mount(
      layer('L1', 'grid', [[200, 10]]) +
        layer('L2', 'object', [[200, 10]], 'display="none"') +
        layer('L3', 'object', [[200, 10]], 'data-repeat="0"'),
    );

    expect((await checkObjectTilingItems()).items).toEqual([]);
  });

  test('counts objects a multi-selection has parked outside their layer', () => {
    mount(
      `${layer('L1', 'object', [[10, 10]])}<g data-tempgroup="true"><rect id="parked" data-original-layer="L1" /><rect id="other" data-original-layer="L2" /></g>`,
    );

    const objects = getLayerObjects(document.querySelector('g.layer') as SVGGElement);

    expect(objects.map((object) => object.id)).toEqual(['L1-0', 'parked']);
  });

  test('ensureObjectTilingFits lets a fitting task through', async () => {
    mount(layer('L1', 'object', [[100, 100]]));

    expect(await ensureObjectTilingFits()).toBe(true);
    expect(mockPopUp).not.toHaveBeenCalled();
  });

  test('ensureObjectTilingFits stops the task and offers to select the objects', async () => {
    mount(layer('L1', 'object', [[120, 10]]));

    expect(await ensureObjectTilingFits()).toBe(false);
    expect(mockPopUp).toHaveBeenCalledTimes(1);

    const { callbacks, message } = mockPopUp.mock.calls[0][0];

    expect(message).toContain('1');
    expect(message).toContain('110');
    callbacks();
    expect(mockSelectOnly).toHaveBeenCalledWith([document.getElementById('L1-0')], true);
  });
});
