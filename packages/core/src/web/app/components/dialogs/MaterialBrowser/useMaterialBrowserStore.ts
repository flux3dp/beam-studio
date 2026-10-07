import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

export const MATERIAL_BROWSER_DIALOG_ID = 'material-browser';

export type BrowserTab = 'favorites' | 'recents' | 'result' | (string & {});

export interface PresetEditorState {
  materialId?: string;
  mode: 'add' | 'edit';
  open: boolean;
  presetId?: string;
  variantId?: string;
}

const getDefaultState = () => ({
  activeTab: 'wood' as BrowserTab,
  detailMaterialId: null as null | string,
  module: LayerModule.LASER_UNIVERSAL as LayerModuleType,
  presetEditor: { mode: 'add', open: false } as PresetEditorState,
  query: '',
  selectedVariantId: null as null | string,
  /** When false (mobile modal variant), Apply only updates the config store */
  writeLayers: true,
});

export const useMaterialBrowserStore = create(
  combine(getDefaultState(), (set) => ({
    closeEditors: () => set({ presetEditor: { mode: 'add', open: false } }),
    openDetail: (materialId: null | string) => set({ detailMaterialId: materialId, selectedVariantId: null }),
    openPresetEditor: (state: Omit<PresetEditorState, 'open'>) => set({ presetEditor: { ...state, open: true } }),
    reset: (init: Partial<ReturnType<typeof getDefaultState>> = {}) => set({ ...getDefaultState(), ...init }),
    setActiveTab: (activeTab: BrowserTab) => set({ activeTab, query: '' }),
    setQuery: (query: string) => set({ query }),
    setSelectedVariantId: (selectedVariantId: null | string) => set({ selectedVariantId }),
  })),
);
