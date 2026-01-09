import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type TDynamicPanelKey = 'panelLayerControls' | 'panelObjectProperties' | 'panelPathEdit';

export type TPanelVisibilityState = { [key in TDynamicPanelKey]: boolean };

export const defaultPanelVisibilityState: TPanelVisibilityState = {
  panelLayerControls: false,
  panelObjectProperties: false,
  panelPathEdit: false,
};

export const usePanelVisibilityStore = create(
  subscribeWithSelector<TPanelVisibilityState>(() => structuredClone(defaultPanelVisibilityState)),
);
