import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { useLayerStore } from '@core/app/stores/layer/layerStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { materialCatalogCache } from '@core/helpers/api/material-catalog/materialCatalogCache';
import { initMaterialBrowser, resolveLayerMaterialRef } from '@core/helpers/materials/material-apply';

import { MATERIAL_BROWSER_DIALOG_ID, useMaterialBrowserStore } from './useMaterialBrowserStore';

import MaterialBrowser from './index';

export interface ShowMaterialBrowserOptions {
  module: LayerModuleType;
  /** false for the mobile modal ConfigPanel variant: Apply only stages store values */
  writeLayers?: boolean;
}

/** Entry point for the dialog. Lives outside the dialog folder's import graph so nothing inside it imports upward. */
export const showMaterialBrowser = ({ module, writeLayers = true }: ShowMaterialBrowserOptions): void => {
  if (isIdExist(MATERIAL_BROWSER_DIALOG_ID)) return;

  // First-activation migration + postPresetChange override, before any browser state is read
  initMaterialBrowser();

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

  addDialogComponent(
    MATERIAL_BROWSER_DIALOG_ID,
    <MaterialBrowser onClose={() => popDialogById(MATERIAL_BROWSER_DIALOG_ID)} />,
  );
};
