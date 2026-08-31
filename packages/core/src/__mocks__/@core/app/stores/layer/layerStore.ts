import type { LayerStoreState } from '@core/app/stores/layer/layerStore';

const state: LayerStoreState = {
  currentLayerName: 'layer1',
  hasGradient: false,
  hasVector: false,
  layers: [],
  selectedLayers: ['layer1'],
};

export const useLayerStore = (selector?: (state: LayerStoreState) => Partial<LayerStoreState>) => {
  return selector ? selector({ ...state }) : { ...state };
};

useLayerStore.getState = () => ({ ...state });
useLayerStore.setState = (newState: Partial<LayerStoreState>) => {
  Object.assign(state, newState);
};
useLayerStore.subscribe = jest.fn();
