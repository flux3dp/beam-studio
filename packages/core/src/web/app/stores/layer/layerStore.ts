import { pipe } from 'remeda';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { promarkModels } from '@core/app/actions/beambox/constant';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import layerManager from '@core/app/svgedit/layer/layerManager';
import doLayersContainsVector from '@core/helpers/layer/check-vector';

import { useDocumentStore } from '../documentStore';

export interface LayerStoreState {
  hasGradient: boolean;
  hasVector: boolean;
  selectedLayers: string[];
}

export interface LayerStoreActions {
  checkGradient: (workarea?: WorkAreaModel) => void;
  checkVector: () => void;
  forceUpdate: () => void;
  setSelectedLayers: (selectedLayers: string[], currentLayer?: string) => void;
}

export const useLayerStore = create(
  subscribeWithSelector<LayerStoreActions & LayerStoreState>((set, get) => ({
    checkGradient: (workarea: WorkAreaModel = useDocumentStore.getState().workarea) => {
      const { selectedLayers } = get();
      const isPromark = promarkModels.has(workarea);

      if (isPromark) {
        const newVal = selectedLayers.some((layerName: string) =>
          pipe(
            layerName,
            layerManager.getLayerElementByName,
            (layer) => layer?.querySelector('image[data-shading="true"]'),
            Boolean,
          ),
        );

        set({ hasGradient: newVal });
      }
    },
    // Computed state checks, expensive, should be called only when necessary
    checkVector: () => {
      const { selectedLayers } = get();
      const newVal = doLayersContainsVector(selectedLayers);

      set({ hasVector: newVal });
    },
    forceUpdate: () => {
      set((state) => ({ selectedLayers: [...state.selectedLayers] }));
      get().checkVector();
      get().checkGradient(useDocumentStore.getState().workarea);
    },
    hasGradient: false,
    hasVector: false,
    selectedLayers: [],

    setSelectedLayers: (newLayers: string[], currentLayer?: string) => {
      const { selectedLayers } = get();
      const oldCurrentLayer = layerManager.getCurrentLayerName();

      if (newLayers.length === 0) newLayers = [layerManager.getCurrentLayerName()];

      const newCurrentLayer = currentLayer || newLayers[0];

      if (newCurrentLayer && newCurrentLayer !== oldCurrentLayer) {
        layerManager.setCurrentLayer(newCurrentLayer);
      }

      // Lazy update - only update if actually different
      if (newLayers.length === selectedLayers.length && newLayers.every((name, i) => name === selectedLayers[i])) {
        return;
      }

      set({ selectedLayers: newLayers });

      // Auto-check states when selected layers change
      get().checkVector();
      get().checkGradient();
    },
  })),
);

useDocumentStore.subscribe(
  (state) => state.workarea,
  (workarea) => useLayerStore.getState().checkGradient(workarea),
);

export default useLayerStore;
