import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { MATERIAL_CATEGORIES } from '@core/app/constants/material-catalog/constants';
import { initMaterialBrowser } from '@core/helpers/materials/material-apply';
import type { MaterialCategory } from '@core/interfaces/IMaterial';

import { useMaterialBrowserStore } from '../useMaterialBrowserStore';

import AddPresetFromLayerModal from './AddPresetFromLayerModal';
import MaterialEditorModal from './MaterialEditorModal';

const ADD_PRESET_ID = 'add-preset-from-layer';
const MATERIAL_EDITOR_ID = 'material-editor';

export const showAddPresetFromLayer = (options: { defaultMaterialId?: string } = {}): void => {
  if (isIdExist(ADD_PRESET_ID)) return;

  initMaterialBrowser();
  addDialogComponent(
    ADD_PRESET_ID,
    <AddPresetFromLayerModal
      defaultMaterialId={options.defaultMaterialId}
      onClose={() => popDialogById(ADD_PRESET_ID)}
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
