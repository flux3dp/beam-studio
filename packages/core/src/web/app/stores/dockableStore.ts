import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type TDynamicPanelKey = 'panelLayerControls' | 'panelObjectProperties' | 'panelPathEdit';

type TPanelVisibility = {
  [key in TDynamicPanelKey]: boolean;
};

export type TDockableState = TPanelVisibility & {
  drawerRef: HTMLElement | null;
};

export const defaultDockableState: TDockableState = {
  drawerRef: null,
  panelLayerControls: false,
  panelObjectProperties: false,
  panelPathEdit: false,
};

export const useDockableStore = create(
  subscribeWithSelector<TDockableState>(() => structuredClone(defaultDockableState)),
);
