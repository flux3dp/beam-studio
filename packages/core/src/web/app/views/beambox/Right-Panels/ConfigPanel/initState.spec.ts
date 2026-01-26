const mockGetState = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: {
    getState: mockGetState,
  },
}));

const mockGetLayerConfig = jest.fn();
const mockGetLayersConfig = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getLayerConfig: (...args) => mockGetLayerConfig(...args),
  getLayersConfig: (...args) => mockGetLayersConfig(...args),
}));

const mockGetCurrentLayerName = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getCurrentLayerName: (...args) => mockGetCurrentLayerName(...args),
}));

import useLayerStore from '@mocks/@core/app/stores/layer/layerStore';
import initState from './initState';

describe('test initState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockReturnValue({ update: mockUpdate });
  });

  test('initState with one layer', () => {
    mockGetLayerConfig.mockReturnValue('mock-layer-config');

    initState(['layer1']);

    expect(mockGetLayerConfig).toHaveBeenCalledWith('layer1');
    expect(mockUpdate).toHaveBeenCalledWith('mock-layer-config');
  });

  test('initState with multiple layers', () => {
    mockGetCurrentLayerName.mockReturnValue('layer1');
    mockGetLayersConfig.mockReturnValue('mock-layers-config');

    initState(['layer1', 'layer2']);

    expect(mockGetLayersConfig).toHaveBeenCalledWith(['layer1', 'layer2'], 'layer1');
    expect(mockUpdate).toHaveBeenCalledWith('mock-layers-config');
  });

  test('initState without arg', () => {
    useLayerStore.setState({ selectedLayers: ['layer3', 'layer4'] });
    mockGetCurrentLayerName.mockReturnValue('layer3');
    mockGetLayersConfig.mockReturnValue('mock-layers-config');

    initState();

    expect(mockGetLayersConfig).toHaveBeenCalledWith(['layer3', 'layer4'], 'layer3');
    expect(mockUpdate).toHaveBeenCalledWith('mock-layers-config');
  });

  test('when layers length is 0', () => {
    mockGetCurrentLayerName.mockReturnValue('layer3');
    mockGetLayerConfig.mockReturnValue('mock-layer-config');

    initState([]);

    expect(mockGetLayerConfig).toHaveBeenCalledWith('layer3');
    expect(mockUpdate).toHaveBeenCalledWith('mock-layer-config');
  });
});
