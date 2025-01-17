/* eslint-disable import/first */
const mockEmit = jest.fn();
jest.mock('helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    emit: mockEmit,
  }),
}));

import LayerPanelController from './LayerPanelController';

describe('test LayerPanelController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('test updateLayerPanel', () => {
    LayerPanelController.updateLayerPanel();
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'UPDATE_LAYER_PANEL');
  });

  test('test getSelectedLayers', () => {
    LayerPanelController.getSelectedLayers();
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'GET_SELECTED_LAYERS', {
      selectedLayers: [],
    });
  });

  test('test setSelectedLayers', () => {
    LayerPanelController.setSelectedLayers(['layer1', 'layer2']);
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'SET_SELECTED_LAYERS', ['layer1', 'layer2']);
  });
});
