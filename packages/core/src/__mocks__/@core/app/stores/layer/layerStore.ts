import type { LayerStoreActions, LayerStoreState } from '@core/app/stores/layer/layerStore';

export const mockCheckGradient = jest.fn();
export const mockCheckVector = jest.fn();
export const mockForceUpdate = jest.fn();
export const mockSetSelectedLayers = jest.fn();

const state = {
  hasGradient: false,
  hasVector: false,
  selectedLayers: ['layer1'],
};

const actions = {
  checkGradient: () => {
    const res = mockCheckGradient();

    state.hasGradient = res ?? false;
  },
  checkVector: () => {
    const res = mockCheckVector();

    state.hasVector = res ?? false;
  },
  forceUpdate: () => {
    mockForceUpdate();
  },
  setSelectedLayers: (selectedLayers: string[]) => {
    mockSetSelectedLayers(selectedLayers);
    state.selectedLayers = selectedLayers;
  },
};

export const useLayerStore = (
  selector?: (state: LayerStoreActions & LayerStoreState) => Partial<LayerStoreActions & LayerStoreState>,
) => {
  const allStates = { ...state, ...actions };

  return selector ? selector(allStates) : allStates;
};

useLayerStore.getState = () => ({ ...state, ...actions });
useLayerStore.setState = (newState: Partial<LayerStoreActions & LayerStoreState>) => {
  Object.assign(state, newState);
};

export default useLayerStore;
