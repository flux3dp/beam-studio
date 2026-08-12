import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { initMaterialStore } from '@core/app/stores/materialStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { materialCatalogCache } from '@core/helpers/api/material-catalog/materialCatalogCache';
import { initMaterialApply, resolveLayerMaterialRef } from '@core/helpers/materials/material-apply';

import { useMaterialBrowserStore } from './useMaterialBrowserStore';

import MaterialBrowser from './index';

const DIALOG_ID = 'material-browser';

export interface ShowMaterialBrowserOptions {
  module: LayerModuleType;
  /** false for the mobile modal ConfigPanel variant: Apply only stages store values */
  writeLayers?: boolean;
}

export const showMaterialBrowser = ({ module, writeLayers = true }: ShowMaterialBrowserOptions): void => {
  if (isIdExist(DIALOG_ID)) return;

  // First-activation migration + postPresetChange override, before any browser state is read
  initMaterialStore();
  initMaterialApply();

  // Open focused on the currently applied material (R2)
  const currentLayerName = useLayerStore.getState().selectedLayers[0];
  const currentLayer = currentLayerName ? layerManager.getLayerElementByName(currentLayerName) : null;
  const currentRef = currentLayer ? resolveLayerMaterialRef(currentLayer) : null;

  useMaterialBrowserStore.getState().reset({
    activeTab: currentRef?.material.category ?? 'wood',
    // Variants open through their parent's detail view with the variant pre-selected
    detailMaterialId: currentRef ? (currentRef.material.parentId ?? currentRef.material.id) : null,
    module,
    selectedVariantId: currentRef?.material.parentId ? currentRef.material.id : null,
    writeLayers,
  });

  // Non-blocking background refresh (silent failure per contract)
  materialCatalogCache.refresh();

  addDialogComponent(DIALOG_ID, <MaterialBrowser onClose={() => popDialogById(DIALOG_ID)} />);
};
