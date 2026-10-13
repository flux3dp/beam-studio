const mockGetObjectLayer = jest.fn();
const mockGetData = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getObjectLayer: (...args: unknown[]) => mockGetObjectLayer(...args),
}));
jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (...args: unknown[]) => mockGetData(...args),
}));

import { getStlEngravingParams } from './engravingParams';

describe('getStlEngravingParams', () => {
  const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  let data: Record<string, unknown>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetObjectLayer.mockReturnValue({ elem: layer, title: 'layer' });
    data = {};
    mockGetData.mockImplementation((_layer: Element, key: string) => data[key]);
  });

  test('reads the parameters of the object layer', () => {
    data = { stlLayerSpacing: 0.05, stlMinLayerSpacing: 0.02, stlMode: 'line', stlPointSpacing: 0.04, stlSolid: true };

    expect(getStlEngravingParams(elem)).toEqual({
      layerSpacing: 0.05,
      minLayerSpacing: 0.02,
      mode: 'line',
      pointSpacing: 0.04,
      solid: true,
    });
    expect(mockGetObjectLayer).toHaveBeenCalledWith(elem);
    expect(mockGetData).toHaveBeenCalledWith(layer, 'stlMode');
  });

  test('falls back to the defaults: dot mode, fixed spacing, not solid', () => {
    data = { stlLayerSpacing: 0, stlMinLayerSpacing: 0, stlPointSpacing: Number.NaN };

    expect(getStlEngravingParams(elem)).toEqual({
      layerSpacing: 0.04,
      minLayerSpacing: null,
      mode: 'dot',
      pointSpacing: 0.03,
      solid: false,
    });
  });

  test('an object outside any layer gets the defaults', () => {
    mockGetObjectLayer.mockReturnValue(null);

    expect(getStlEngravingParams(elem).mode).toBe('dot');
    expect(mockGetData).toHaveBeenCalledWith(null, 'stlMode');
  });
});
