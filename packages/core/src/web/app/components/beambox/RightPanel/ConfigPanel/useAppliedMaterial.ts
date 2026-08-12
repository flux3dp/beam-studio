import { useMemo } from 'react';

import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useMaterialStore } from '@core/app/stores/materialStore';
import { resolveMaterialRef, resolveWithOverlay } from '@core/helpers/materials/material-apply';
import { getPresetModel } from '@core/helpers/presets/preset-helper';
import type { ConfigKey } from '@core/interfaces/ILayerConfig';
import type { Material, MaterialPreset } from '@core/interfaces/IMaterial';

export interface AppliedMaterial {
  isModified: boolean;
  material: Material;
  preset: MaterialPreset;
}

export interface AppliedMaterialState {
  applied: AppliedMaterial | null;
  isVarious: boolean;
}

/**
 * Derives the layer panel chip state from the config store: the applied material/preset
 * (via presetId/configName refs), mixed-multi-selection, and whether the layer's live
 * parameters have diverged from the applied preset ("modified" dot).
 */
export const useAppliedMaterial = (): AppliedMaterialState => {
  // Subscribe to the store object itself — selecting `getState()` would return a fresh
  // object per call and trip useSyncExternalStore's unstable-snapshot loop detection.
  const state = useConfigPanelStore();
  const workarea = useDocumentStore((s) => s.workarea);
  // Subscribe so customized overlays / user edits re-derive the chip
  const presetOverrides = useMaterialStore((s) => s.presetOverrides);
  const userMaterials = useMaterialStore((s) => s.userMaterials);
  const userPresets = useMaterialStore((s) => s.userPresets);

  return useMemo(() => {
    const { configName, diode, ink, multipass, power, presetId, repeat, speed, zStep } = state;
    // Same field list as the legacy dropdownValue "Various" check
    const isVarious = [speed, power, ink, repeat, diode, zStep, configName, multipass].some(
      (item) => item?.hasMultiValue,
    );

    if (isVarious) return { applied: null, isVarious: true };

    // Optional access: the meta refs may be absent on states hydrated before this feature
    const ref = resolveMaterialRef({ configName: configName?.value, presetId: presetId?.value });

    if (!ref) return { applied: null, isVarious: false };

    const module = state.module.value as LayerModuleType;
    const values = resolveWithOverlay(ref.preset, getPresetModel(workarea), module);

    if (!values) return { applied: null, isVarious: false };

    const { dpiOverrides: _dpiOverrides, ...compareValues } = values;
    const isModified = Object.entries(compareValues).some(([key, value]) => {
      const item = state[key as ConfigKey];

      return item !== undefined && item.value !== undefined && item.value !== value;
    });

    return {
      applied: { isModified, material: ref.material, preset: ref.preset },
      isVarious: false,
    };
    // presetOverrides / userMaterials / userPresets are read inside resolveMaterialRef
    // and resolveWithOverlay via the store — kept as deps so edits re-derive the chip.
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [state, workarea, presetOverrides, userMaterials, userPresets]);
};
