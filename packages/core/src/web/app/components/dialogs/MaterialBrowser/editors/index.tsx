import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { MATERIAL_CATEGORIES } from '@core/app/constants/material-catalog/constants';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { initMaterialStore } from '@core/app/stores/materialStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { materialCatalogCache } from '@core/helpers/api/material-catalog/materialCatalogCache';
import { initMaterialApply, resolveLayerMaterialRef } from '@core/helpers/materials/material-apply';
import type { MaterialCategory } from '@core/interfaces/IMaterial';

import { useMaterialBrowserStore } from '../useMaterialBrowserStore';

import MaterialBrowser from '../index';
import AddPresetFromLayerModal from './AddPresetFromLayerModal';
import MaterialEditorModal from './MaterialEditorModal';

const BROWSER_ID = 'material-browser';
const ADD_PRESET_ID = 'add-preset-from-layer';
const MATERIAL_EDITOR_ID = 'material-editor';

export interface ShowMaterialBrowserOptions {
  module: LayerModuleType;
  /** false for the mobile modal ConfigPanel variant: Apply only stages store values */
  writeLayers?: boolean;
}

export const showMaterialBrowser = ({ module, writeLayers = true }: ShowMaterialBrowserOptions): void => {
  if (isIdExist(BROWSER_ID)) return;

  // First-activation migration + postPresetChange override, before any browser state is read
  initMaterialStore();
  initMaterialApply();

  // Open focused on the currently applied material (R2)
  const currentLayerName = useLayerStore.getState().selectedLayers[0];
  const currentLayer = currentLayerName ? layerManager.getLayerElementByName(currentLayerName) : null;
  const currentRef = currentLayer ? resolveLayerMaterialRef(currentLayer) : null;

  useMaterialBrowserStore.getState().reset({
    activeTab: currentRef?.material.category ?? 'wood',
    detailMaterialId: currentRef?.material.id ?? null,
    module,
    selectedVariantId: currentRef?.preset.variantId ?? null,
    writeLayers,
  });

  // Non-blocking background refresh (silent failure per contract)
  materialCatalogCache.refresh();

  addDialogComponent(BROWSER_ID, <MaterialBrowser onClose={() => popDialogById(BROWSER_ID)} />);
};

export const showAddPresetFromLayer = (options: { defaultMaterialId?: string; onSaved?: () => void } = {}): void => {
  if (isIdExist(ADD_PRESET_ID)) return;

  initMaterialStore();
  initMaterialApply();
  addDialogComponent(
    ADD_PRESET_ID,
    <AddPresetFromLayerModal
      defaultMaterialId={options.defaultMaterialId}
      onClose={() => popDialogById(ADD_PRESET_ID)}
      onSaved={options.onSaved}
    />,
  );
};

export const showMaterialEditorModal = (options: { materialId?: string } = {}): void => {
  if (isIdExist(MATERIAL_EDITOR_ID)) return;

  initMaterialStore();

  // New materials default to the browser's current category tab (favorites/recents → none)
  const { activeTab, setActiveTab } = useMaterialBrowserStore.getState();
  const defaultCategory = (MATERIAL_CATEGORIES as string[]).includes(activeTab)
    ? (activeTab as MaterialCategory)
    : undefined;

  addDialogComponent(
    MATERIAL_EDITOR_ID,
    <MaterialEditorModal
      defaultCategory={defaultCategory}
      materialId={options.materialId}
      onClose={() => popDialogById(MATERIAL_EDITOR_ID)}
      onCreated={(material) => setActiveTab(material.category)}
    />,
  );
};
