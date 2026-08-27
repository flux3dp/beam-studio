import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type { Layer } from '@core/app/svgedit/layer/layer';

export interface LayerStoreState {
  /** Name of the layer receiving new elements; mirrors the DOM */
  currentLayerName: null | string;
  hasGradient: boolean;
  hasVector: boolean;
  /** All layers, bottom to top */
  layers: Layer[];
  selectedLayers: string[];
}

/**
 * Passive state container for layer data.
 *
 * All writes go through layerManager (@core/app/svgedit/layer/layerManager) — never call
 * useLayerStore.setState from anywhere else. React components subscribe with selectors;
 * imperative reads via useLayerStore.getState() are fine.
 */
export const useLayerStore = create(
  subscribeWithSelector<LayerStoreState>(() => ({
    currentLayerName: null,
    hasGradient: false,
    hasVector: false,
    layers: [],
    selectedLayers: [],
  })),
);

export default useLayerStore;
