import { popDialogById } from '@core/app/actions/dialog-controller';
import initState from '@core/app/components/beambox/RightPanel/ConfigPanel/initState';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { useLayerStore } from '@core/app/stores/layer/layerStore';
import { useMaterialStore } from '@core/app/stores/materialStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import type { ResolvedPresetRow } from '@core/helpers/api/material-catalog/selectors';
import { applyMaterialPreset, stageMaterialPreset } from '@core/helpers/materials/material-apply';

import { MATERIAL_BROWSER_DIALOG_ID, useMaterialBrowserStore } from '../useMaterialBrowserStore';

import { findTargetMaterial } from './materialTargetOptions';

/**
 * Apply a browser row to the selection and close the browser. Desktop writes the layers
 * inside one undoable batch; the mobile modal variant (writeLayers false) only stages the
 * values in the config store, where the modal's Save writes them later.
 */
export const applyPresetRow = (row: ResolvedPresetRow, module: LayerModuleType): void => {
  const material = findTargetMaterial(row.materialId, useMaterialStore.getState().userMaterials);

  if (!material) return;

  if (useMaterialBrowserStore.getState().writeLayers) {
    const batchCmd = new history.BatchCommand('Change layer preset');
    const layers = useLayerStore
      .getState()
      .selectedLayers.map((layerName) => layerManager.getLayerElementByName(layerName))
      .filter(Boolean) as Element[];

    applyMaterialPreset(material, row.preset, { batchCmd, layers });
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
    initState();
  } else {
    stageMaterialPreset(material, row.preset, row.values, module);
  }

  popDialogById(MATERIAL_BROWSER_DIALOG_ID);
};
