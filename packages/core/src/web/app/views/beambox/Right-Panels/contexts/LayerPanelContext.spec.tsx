import React, { useContext } from 'react';
import { act, render } from '@testing-library/react';

import eventEmitterFactory from 'helpers/eventEmitterFactory';

import { LayerPanelContextProvider, LayerPanelContext } from './LayerPanelContext';

const mockForceUpdate = jest.fn();
jest.mock('helpers/use-force-update', () => () => mockForceUpdate);

const mockDoLayersContainsVector = jest.fn();
jest.mock(
  'helpers/layer/check-vector',
  () =>
    (...args) =>
      mockDoLayersContainsVector(...args)
);

const mockGetLayerElementByName = jest.fn();
jest.mock('helpers/layer/layer-helper', () => ({
  getLayerElementByName: (...args) => mockGetLayerElementByName(...args),
}));

const MockChild = () => {
  const { selectedLayers } = useContext(LayerPanelContext);
  return <div>{JSON.stringify(selectedLayers)}</div>;
};

describe('test LayerPanelContext', () => {
  it('should render correctly', async () => {
    const layerPanelEventEmitter = eventEmitterFactory.createEventEmitter('layer-panel');
    const { container, unmount } = render(
      <LayerPanelContextProvider>
        <MockChild />
      </LayerPanelContextProvider>
    );
    expect(layerPanelEventEmitter.eventNames().length).toBe(5);
    expect(mockDoLayersContainsVector).toBeCalledTimes(2);
    expect(mockDoLayersContainsVector).toHaveBeenLastCalledWith([]);

    layerPanelEventEmitter.emit('UPDATE_LAYER_PANEL');
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
    await act(async () => {
      layerPanelEventEmitter.emit('SET_SELECTED_LAYERS', ['layer1', 'layer3']);
    });

    expect(container.textContent).toBe('["layer1","layer3"]');
    expect(mockDoLayersContainsVector).toBeCalledTimes(3);
    expect(mockDoLayersContainsVector).toHaveBeenLastCalledWith(['layer1', 'layer3']);

    await act(async () => {
      layerPanelEventEmitter.emit('CHECK_VECTOR');
    });
    expect(mockDoLayersContainsVector).toBeCalledTimes(4);
    expect(mockDoLayersContainsVector).toHaveBeenLastCalledWith(['layer1', 'layer3']);

    const response = {
      selectedLayers: [],
    };
    layerPanelEventEmitter.emit('GET_SELECTED_LAYERS', response);
    expect(response.selectedLayers).toEqual(['layer1', 'layer3']);

    unmount();
    expect(layerPanelEventEmitter.eventNames().length).toBe(0);
  });
});
