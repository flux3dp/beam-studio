const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockWorkarea = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: { getState: () => ({ workarea: mockWorkarea() }) },
}));

const mockMultiSelect = jest.fn();

jest.mock('@core/app/svgedit/selection', () => ({
  multiSelect: (...args) => mockMultiSelect(...args),
}));

const mockAlertRead = jest.fn();
const mockAlertWrite = jest.fn();

jest.mock('@core/helpers/api/alert-config', () => ({
  read: (...args) => mockAlertRead(...args),
  write: (...args) => mockAlertWrite(...args),
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

import {
  checkObjectTilingItems,
  checkPathStitchingItems,
  confirmPathStitching,
  ensureObjectTilingFits,
  getLayerObjects,
  hasPathContent,
} from './galvoTiling';

const layer = (title: string, tiling: string, objects: Array<[number, number]>, attrs = '') =>
  `<g class="layer" data-module="12" data-galvoTiling="${tiling}" ${attrs}><title>${title}</title><defs></defs>${objects
    .map(([w, h], i) => `<rect id="${title}-${i}" data-w="${w * 10}" data-h="${h * 10}" />`)
    .join('')}</g>`;

describe('test galvoTiling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlertRead.mockReturnValue(false);
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
    expect(mockMultiSelect).toHaveBeenCalledWith([document.getElementById('L1-0')]);
  });

  describe('auto tiling', () => {
    const big = 'data-w="2000" data-h="100"';
    const autoLayer = (content: string, attrs = '') =>
      `<g class="layer" data-module="12" data-galvoTiling="auto" ${attrs}><title>A</title>${content}</g>`;

    test('checkObjectTilingItems lets an oversize object on an auto layer through', async () => {
      mount(autoLayer(`<rect id="r" ${big} />`));

      expect((await checkObjectTilingItems()).items).toEqual([]);
    });

    test('hasPathContent tells images from anything drawn as lines', () => {
      mount(
        autoLayer(
          `<image id="img" /><path id="p" /><g id="mixed"><image /><g><text>t</text></g></g><g id="images"><image /><title>x</title></g>` +
            `<use id="u-img" href="#s-img" /><use id="u-path" xlink:href="#s-path" /><use id="u-gone" href="#nowhere" />`,
        ) + `<defs><symbol id="s-img"><image /></symbol><symbol id="s-path"><g><polygon /></g></symbol></defs>`,
      );

      const has = (id: string) => hasPathContent(document.getElementById(id)!);

      expect(has('img')).toBe(false);
      expect(has('p')).toBe(true);
      expect(has('mixed')).toBe(true);
      expect(has('images')).toBe(false);
      expect(has('u-img')).toBe(false);
      expect(has('u-path')).toBe(true);
      expect(has('u-gone')).toBe(true);
    });

    test('checkPathStitchingItems finds oversize objects with paths on auto layers only', async () => {
      mount(
        autoLayer(
          `<rect id="big-path" ${big} /><image id="big-image" ${big} /><rect id="small-path" data-w="100" data-h="100" />` +
            `<rect id="at-field" data-w="1100" data-h="1100" /><g id="big-group" ${big}><image /><path /></g>`,
        ) +
          autoLayer(`<rect id="hidden" ${big} />`, 'display="none"') +
          autoLayer(`<rect id="no-repeat" ${big} />`, 'data-repeat="0"') +
          layer('G', 'grid', [[200, 10]]) +
          layer('O', 'object', [[200, 10]]),
      );

      const { field, items } = await checkPathStitchingItems();

      expect(field).toBe(110);
      expect(items.map((item) => item.id)).toEqual(['big-path', 'big-group']);
    });

    test('confirmPathStitching passes without asking when nothing is stitched', async () => {
      mount(autoLayer(`<image id="big-image" ${big} /><rect id="small" data-w="100" data-h="100" />`));

      expect(await confirmPathStitching()).toBe(true);
      expect(mockPopUp).not.toHaveBeenCalled();
    });

    test('confirmPathStitching passes without asking once skipped', async () => {
      mockAlertRead.mockReturnValue(true);
      mount(autoLayer(`<rect id="r" ${big} />`));

      expect(await confirmPathStitching()).toBe(true);
      expect(mockAlertRead).toHaveBeenCalledWith('skip-galvo-path-stitch-warning');
      expect(mockPopUp).not.toHaveBeenCalled();
    });

    test('confirmPathStitching goes on when the user continues', async () => {
      mount(autoLayer(`<rect id="r" ${big} />`));

      const result = confirmPathStitching();

      await Promise.resolve();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockPopUp).toHaveBeenCalledTimes(1);

      const { callbacks, checkbox, message, primaryButtonIndex } = mockPopUp.mock.calls[0][0];

      expect(message).toContain('110');
      expect(primaryButtonIndex).toBe(0);
      checkbox.callbacks();
      expect(mockAlertWrite).toHaveBeenCalledWith('skip-galvo-path-stitch-warning', true);
      callbacks[0]();
      expect(await result).toBe(true);
    });

    test.each([
      ['select', 1, true],
      ['cancel', 2, false],
    ])('confirmPathStitching stops on %s', async (_, index, selects) => {
      mount(autoLayer(`<rect id="r" ${big} />`));

      const result = confirmPathStitching();

      await new Promise((resolve) => setTimeout(resolve, 0));
      mockPopUp.mock.calls[0][0].callbacks[index]();
      expect(await result).toBe(false);
      expect(mockMultiSelect).toHaveBeenCalledTimes(selects ? 1 : 0);
      expect(mockAlertWrite).not.toHaveBeenCalled();
    });

    test('confirmPathStitching stops when the warning is dismissed', async () => {
      mount(autoLayer(`<rect id="r" ${big} />`));

      const result = confirmPathStitching();

      await new Promise((resolve) => setTimeout(resolve, 0));
      mockPopUp.mock.calls[0][0].onClose();
      expect(await result).toBe(false);
    });
  });
});
