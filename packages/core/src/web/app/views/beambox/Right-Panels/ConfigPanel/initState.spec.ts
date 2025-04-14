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

const mockGetCurrentDrawing = jest.fn();
const mockGetCurrentLayerName = jest.fn();
const mockCanvas = {
  getCurrentDrawing: mockGetCurrentDrawing,
};
const mockDrawing = {
  getCurrentLayerName: mockGetCurrentLayerName,
};

mockGetCurrentDrawing.mockImplementation(() => mockDrawing);

const mockGetSVGAsync = jest.fn().mockImplementation((callback) => callback({ Canvas: mockCanvas }));

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (...args) => mockGetSVGAsync(...args),
}));

const mockLayerPanelController = {
  getSelectedLayers: jest.fn(),
};

jest.mock('../contexts/LayerPanelController', () => mockLayerPanelController);

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
    mockLayerPanelController.getSelectedLayers.mockReturnValue(['layer3', 'layer4']);
    mockGetCurrentLayerName.mockReturnValue('layer3');
    mockGetLayersConfig.mockReturnValue('mock-layers-config');

    initState();

    expect(mockGetLayersConfig).toHaveBeenCalledWith(['layer3', 'layer4'], 'layer3');
    expect(mockUpdate).toHaveBeenCalledWith('mock-layers-config');
  });
});
