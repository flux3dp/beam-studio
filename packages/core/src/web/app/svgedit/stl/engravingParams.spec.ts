const mockChangeSelectedAttribute = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback: (svg: unknown) => void) =>
    callback({ Canvas: { changeSelectedAttribute: (...args: unknown[]) => mockChangeSelectedAttribute(...args) } }),
}));

import { getStlEngravingParams, setStlEngravingParam } from './engravingParams';

describe('engravingParams', () => {
  beforeEach(() => jest.clearAllMocks());

  test('reads adaptive layer height only from a positive opt-in value', () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    expect(getStlEngravingParams(elem).minLayerHeight).toBeNull();

    elem.setAttribute('data-stl-min-layer-height', '0.025');
    expect(getStlEngravingParams(elem).minLayerHeight).toBe(0.025);

    elem.setAttribute('data-stl-min-layer-height', '0');
    expect(getStlEngravingParams(elem).minLayerHeight).toBeNull();
  });

  test('writes the backend attribute through the undo-aware canvas API', () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    setStlEngravingParam(elem, 'data-stl-min-layer-height', 0.025);

    expect(mockChangeSelectedAttribute).toHaveBeenCalledWith('data-stl-min-layer-height', 0.025, [elem]);
  });
});
