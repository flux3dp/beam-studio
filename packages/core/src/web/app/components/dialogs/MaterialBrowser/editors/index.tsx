import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { MATERIAL_CATEGORIES } from '@core/app/constants/material-catalog/constants';
import { initMaterialBrowser } from '@core/helpers/materials/material-apply';
import type { PresetModel } from '@core/interfaces/ILayerConfig';
import type { MaterialCategory } from '@core/interfaces/IMaterial';

import { useMaterialBrowserStore } from '../useMaterialBrowserStore';

import AddPresetFromLayerModal from './AddPresetFromLayerModal';
import MaterialEditorModal from './MaterialEditorModal';
import MovePresetModal from './MovePresetModal';

const ADD_PRESET_ID = 'add-preset-from-layer';
const MATERIAL_EDITOR_ID = 'material-editor';
const MOVE_PRESET_ID = 'move-preset';

export const showAddPresetFromLayer = (
  options: { defaultMaterialId?: string; defaultVariantId?: string } = {},
): void => {
  if (isIdExist(ADD_PRESET_ID)) return;

  initMaterialBrowser();
  addDialogComponent(
    ADD_PRESET_ID,
    <AddPresetFromLayerModal
      defaultMaterialId={options.defaultMaterialId}
      defaultVariantId={options.defaultVariantId}
      onClose={() => popDialogById(ADD_PRESET_ID)}
    />,
  );
};

export const showMovePresetModal = (
  presetId: string,
  context: { model: PresetModel; module: LayerModuleType },
): void => {
  if (isIdExist(MOVE_PRESET_ID)) return;

  addDialogComponent(
    MOVE_PRESET_ID,
    <MovePresetModal
      model={context.model}
      module={context.module}
      onClose={() => popDialogById(MOVE_PRESET_ID)}
      presetId={presetId}
    />,
  );
};

export const showMaterialEditorModal = (options: { materialId?: string } = {}): void => {
  if (isIdExist(MATERIAL_EDITOR_ID)) return;

  initMaterialBrowser();

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
