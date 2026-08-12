import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { initMaterialStore } from '@core/app/stores/materialStore';
import { initMaterialApply } from '@core/helpers/materials/material-apply';

import AddPresetFromLayerModal from './AddPresetFromLayerModal';

const DIALOG_ID = 'add-preset-from-layer';

export const showAddPresetFromLayer = (options: { defaultMaterialId?: string; onSaved?: () => void } = {}): void => {
  if (isIdExist(DIALOG_ID)) return;

  initMaterialStore();
  initMaterialApply();
  addDialogComponent(
    DIALOG_ID,
    <AddPresetFromLayerModal
      defaultMaterialId={options.defaultMaterialId}
      onClose={() => popDialogById(DIALOG_ID)}
      onSaved={options.onSaved}
    />,
  );
};
