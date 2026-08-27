const mockIsInnerEngravingActive = jest.fn();

jest.mock('@core/helpers/innerEngraving', () => ({
  isInnerEngravingActive: () => mockIsInnerEngravingActive(),
}));

const mockReleaseSelector = jest.fn();
const mockRequestSelector = jest.fn(() => ({ show: jest.fn() }));

jest.mock('../selector', () => ({
  __esModule: true,
  default: {
    getSelectorManager: () => ({
      releaseSelector: mockReleaseSelector,
      requestSelector: mockRequestSelector,
    }),
  },
}));

jest.mock('../utils/getBBox', () => ({
  getBBox: () => ({ height: 10, width: 10, x: 0, y: 0 }),
}));

jest.mock('@core/app/stores/layer/layerStore', () => jest.fn());
jest.mock('@core/helpers/color/updateElementColor', () => jest.fn());
jest.mock('@core/helpers/layer/layer-helper', () => ({}));
jest.mock('../history/history', () => ({}));
jest.mock('../layer/layerManager', () => ({}));

import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { SelectionManager } from './SelectionManager';

const createElement = (id: string): SVGRectElement => {
  const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

  elem.id = id;

  return elem;
};

describe('SelectionManager single selection in inner engraving', () => {
  const call = jest.fn();
  const collectAlignPoints = jest.fn();
  const addSvgElementFromJson = jest.fn();
  let manager: SelectionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsInnerEngravingActive.mockReturnValue(false);
    manager = new SelectionManager();
    manager.init({ addSvgElementFromJson, call, collectAlignPoints } as unknown as ISVGCanvas, {} as ISVGEditor);
  });

  it('replaces an existing selection when another element is added in 3D mode', () => {
    mockIsInnerEngravingActive.mockReturnValue(true);

    const first = createElement('first');
    const second = createElement('second');

    manager.addToSelection([first]);
    manager.addToSelection([second]);

    expect(manager.getSelectedElements()).toEqual([second]);
    expect(mockReleaseSelector).toHaveBeenCalledWith(first);
    expect(call).toHaveBeenLastCalledWith('selected', [second]);
  });

  it('reduces marquee selection to one object without creating a temporary group in 3D mode', () => {
    mockIsInnerEngravingActive.mockReturnValue(true);

    const first = createElement('first');
    const second = createElement('second');

    manager.multiSelect([first, second]);

    expect(manager.getSelectedElements()).toEqual([second]);
    expect(manager.isMultiSelecting).toBe(false);
    expect(addSvgElementFromJson).not.toHaveBeenCalled();
  });

  it('collapses a selection that existed before entering 3D mode', () => {
    const first = createElement('first');
    const second = createElement('second');

    manager.setSelectedElements([first, second]);
    mockIsInnerEngravingActive.mockReturnValue(true);
    manager.tempGroupSelectedElements();

    expect(manager.getSelectedElements()).toEqual([second]);
    expect(addSvgElementFromJson).not.toHaveBeenCalled();
  });

  it('keeps additive selection unchanged in 2D mode', () => {
    const first = createElement('first');
    const second = createElement('second');

    manager.addToSelection([first]);
    manager.addToSelection([second]);

    expect(manager.getSelectedElements()).toHaveLength(2);
    expect(manager.getSelectedElements()).toEqual(expect.arrayContaining([first, second]));
  });
});
