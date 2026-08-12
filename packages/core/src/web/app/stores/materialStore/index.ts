import { create } from 'zustand';
import { combine, subscribeWithSelector } from 'zustand/middleware';

import alertCaller from '@core/app/actions/alert-caller';
import { MY_MATERIALS_ID, RECENTS_LIMIT } from '@core/app/constants/material-catalog/constants';
import { getStorage, setStorage } from '@core/app/stores/storageStore';
import { getMaterialDisplayName, getPresetDisplayName } from '@core/helpers/api/material-catalog/utils';
import i18n from '@core/helpers/i18n';
import { isMaterialBrowserActive } from '@core/helpers/materials/isMaterialBrowserActive';
import type { Material, PresetModuleKey, PresetScopeKey, UserPreset } from '@core/interfaces/IMaterial';

import { convertLegacyPresets } from './migration';
import type { MaterialLibraryExport, MaterialStore, MaterialStoreState } from './types';
import { generateUserId, toUserData, withChildren } from './utils';

const getInitialState = (): MaterialStoreState => {
  const userData = getStorage('materials');

  return {
    disabledPresetIds: userData?.disabledPresetIds ?? [],
    favorites: getStorage('material-favorites') ?? [],
    migratedFromPresets: userData?.migratedFromPresets ?? false,
    presetOverrides: userData?.presetOverrides ?? {},
    recents: getStorage('material-recents') ?? [],
    userMaterials: userData?.userMaterials ?? [],
    userPresets: userData?.userPresets ?? [],
  };
};

const createBucket = (): Material => ({
  category: 'other',
  id: MY_MATERIALS_ID,
  nameKey: 'my_materials',
  presets: [],
  source: 'user',
});

export const useMaterialStore = create(
  subscribeWithSelector(
    combine(getInitialState(), (set, get) => {
      const persistUserData = () => {
        try {
          setStorage('materials', toUserData(get()));
        } catch (error) {
          // Almost always a storage quota overrun (photo covers are stored as dataURLs).
          // Surface it: silently dropping the write looks like the edit saved until reload.
          console.error('Failed to persist material library:', error);
          alertCaller.popUpError({ message: i18n.lang.beambox.material_browser.storage_full });
        }
      };
      /** Applies a state patch, then persists the user-data slice */
      const apply = (patch: Partial<MaterialStoreState>) => {
        set(patch as MaterialStoreState);
        persistUserData();
      };
      const actions: Omit<MaterialStore, keyof MaterialStoreState> = {
        addMaterial: (material) => {
          apply({ userMaterials: [...get().userMaterials, material] });
        },
        addPreset: (materialId, preset) => {
          apply({ userPresets: [...get().userPresets, { ...preset, materialId }] });
        },
        deleteMaterial: (materialId) => {
          const { favorites, recents, userMaterials, userPresets } = get();
          const removedIds = new Set(withChildren(materialId, userMaterials).map(({ id }) => id));

          apply({
            favorites: favorites.filter((id) => !removedIds.has(id)),
            recents: recents.filter(({ materialId: id }) => !removedIds.has(id)),
            userMaterials: userMaterials.filter(({ id }) => !removedIds.has(id)),
            userPresets: userPresets.filter(({ materialId: id }) => !removedIds.has(id)),
          });
          setStorage('material-favorites', get().favorites);
          setStorage('material-recents', get().recents);
        },
        deletePreset: (presetId) => {
          apply({
            disabledPresetIds: get().disabledPresetIds.filter((id) => id !== presetId),
            userPresets: get().userPresets.filter(({ id }) => id !== presetId),
          });
        },
        duplicateMaterial: (source, variants = []) => {
          const presetCopies: UserPreset[] = [];
          const cloneMaterial = (material: Material, parentId?: string): Material => {
            const copy: Material = {
              ...structuredClone(material),
              id: generateUserId('user_mat'),
              name: getMaterialDisplayName(material),
              nameKey: undefined,
              ...(parentId !== undefined && { parentId }),
              presets: [],
              shopLinks: undefined,
              source: 'user' as const,
            };

            // Copy both the source's embedded catalog presets and its user additions
            presetCopies.push(
              ...[...material.presets, ...get().userPresets.filter(({ materialId }) => materialId === material.id)].map(
                (preset) => ({
                  ...structuredClone(preset),
                  id: generateUserId(),
                  legacyKey: undefined,
                  materialId: copy.id,
                  name: getPresetDisplayName(preset),
                  nameKey: undefined,
                  origin: 'user' as const,
                }),
              ),
            );

            return copy;
          };

          const parentCopy = cloneMaterial(source);
          const variantCopies = variants.map((variant) => cloneMaterial(variant, parentCopy.id));

          apply({
            userMaterials: [...get().userMaterials, parentCopy, ...variantCopies],
            userPresets: [...get().userPresets, ...presetCopies],
          });

          return parentCopy;
        },
        ensureBucket: () => {
          const existing = get().userMaterials.find(({ id }) => id === MY_MATERIALS_ID);

          if (existing) return existing;

          const bucket = createBucket();

          apply({ userMaterials: [...get().userMaterials, bucket] });

          return bucket;
        },
        getExportData: (): MaterialLibraryExport => {
          const { disabledPresetIds, presetOverrides, userMaterials, userPresets } = get();

          return {
            disabledPresetIds,
            presetOverrides,
            type: 'flux-material-library',
            userMaterials,
            userPresets,
            version: 1,
          };
        },
        importData: (data) => {
          const state = get();
          const existingIds = new Set(state.userMaterials.map(({ id }) => id));
          const idRemap = new Map<string, string>();
          const imported = (data.userMaterials ?? []).map((material) => {
            if (!existingIds.has(material.id) || material.id === MY_MATERIALS_ID) return material;

            const newId = generateUserId('user_mat');

            idRemap.set(material.id, newId);

            return { ...material, id: newId };
          });
          const remapped = imported.map((material) =>
            material.parentId && idRemap.has(material.parentId)
              ? { ...material, parentId: idRemap.get(material.parentId) }
              : material,
          );
          const hasBucket = existingIds.has(MY_MATERIALS_ID);
          const userMaterials = [
            ...state.userMaterials,
            ...remapped.filter(({ id }) => !(id === MY_MATERIALS_ID && hasBucket)),
          ];

          // Presets: re-point remapped owners, skip bucket name collisions, regenerate colliding ids
          const existingPresetIds = new Set(state.userPresets.map(({ id }) => id));
          const bucketNames = new Set(
            state.userPresets
              .filter(({ materialId }) => materialId === MY_MATERIALS_ID)
              .map((preset) => getPresetDisplayName(preset)),
          );
          const importedPresets = (data.userPresets ?? [])
            .map((preset) => ({ ...preset, materialId: idRemap.get(preset.materialId) ?? preset.materialId }))
            .filter(
              (preset) => !(preset.materialId === MY_MATERIALS_ID && bucketNames.has(getPresetDisplayName(preset))),
            )
            .map((preset) => (existingPresetIds.has(preset.id) ? { ...preset, id: generateUserId() } : preset));

          apply({
            disabledPresetIds: [...new Set([...state.disabledPresetIds, ...(data.disabledPresetIds ?? [])])],
            presetOverrides: { ...state.presetOverrides, ...(data.presetOverrides ?? {}) },
            userMaterials,
            userPresets: [...state.userPresets, ...importedPresets],
          });
        },
        movePreset: (presetId, targetMaterialId) => {
          const preset = get().userPresets.find(({ id }) => id === presetId);

          if (!preset || preset.materialId === targetMaterialId) return;

          if (targetMaterialId === MY_MATERIALS_ID) actions.ensureBucket();

          // Remove + append so the preset lands at the end of the target's list
          apply({
            userPresets: [
              ...get().userPresets.filter(({ id }) => id !== presetId),
              { ...preset, materialId: targetMaterialId },
            ],
          });
        },
        pushRecent: (materialId, presetId) => {
          const recents = [
            { materialId, presetId, timestamp: Date.now() },
            ...get().recents.filter((entry) => entry.materialId !== materialId || entry.presetId !== presetId),
          ].slice(0, RECENTS_LIMIT);

          set({ recents });
          setStorage('material-recents', recents);
        },
        restorePreset: (presetId) => {
          const { [presetId]: _removed, ...presetOverrides } = get().presetOverrides;

          apply({ presetOverrides });
        },
        toggleFavorite: (materialId) => {
          const { favorites } = get();
          const next = favorites.includes(materialId)
            ? favorites.filter((id) => id !== materialId)
            : [...favorites, materialId];

          set({ favorites: next });
          setStorage('material-favorites', next);
        },
        togglePresetDisabled: (presetId) => {
          const { disabledPresetIds } = get();

          apply({
            disabledPresetIds: disabledPresetIds.includes(presetId)
              ? disabledPresetIds.filter((id) => id !== presetId)
              : [...disabledPresetIds, presetId],
          });
        },
        updateMaterial: (materialId, patch) => {
          apply({
            userMaterials: get().userMaterials.map((material) =>
              material.id === materialId ? { ...material, ...patch } : material,
            ),
          });
        },
        updatePreset: (presetId, scope, moduleKey, { name, ...values }) => {
          const { userPresets } = get();
          const preset = userPresets.find(({ id }) => id === presetId);

          if (preset) {
            // Write back to the cell this context resolves from ([scope][module] → … → ['*']['*']);
            // any other cell would stay shadowed by a more specific one and the edit looks lost
            const cells: Array<[PresetScopeKey, PresetModuleKey]> = [
              [scope, moduleKey],
              [scope, '*'],
              ['*', moduleKey],
              ['*', '*'],
            ];
            const [scopeKey, cellKey] = cells.find(([s, m]) => preset.settings[s]?.[m]) ?? [scope, moduleKey];
            const updated: UserPreset = {
              ...preset,
              ...(name !== undefined && { name }),
              settings: { ...preset.settings, [scopeKey]: { ...preset.settings[scopeKey], [cellKey]: values } },
            };

            apply({ userPresets: userPresets.map((p) => (p.id === presetId ? updated : p)) });

            return;
          }

          // Not user content → catalog default → [Customized] overlay keyed by stable preset id
          const { presetOverrides } = get();
          const overlay = presetOverrides[presetId] ?? {};

          apply({
            presetOverrides: {
              ...presetOverrides,
              [presetId]: {
                ...overlay,
                [scope]: { ...overlay[scope], [moduleKey]: { ...values, ...(name !== undefined && { name }) } },
              },
            },
          });
        },
      };

      return actions;
    }),
  ),
);

let initialized = false;

/**
 * One-time init: runs the legacy-preset migration on first activation of the new UI.
 * Called from Material Browser entry points (never at import time, so tests and the
 * legacy UI never trigger it).
 */
export const initMaterialStore = (): void => {
  if (initialized || !isMaterialBrowserActive()) return;

  initialized = true;

  const state = useMaterialStore.getState();

  if (state.migratedFromPresets) return;

  const { bucketPresets, disabledPresetIds } = convertLegacyPresets(getStorage('presets'));

  if (bucketPresets.length > 0) {
    state.ensureBucket();
    bucketPresets.forEach((preset) => useMaterialStore.getState().addPreset(MY_MATERIALS_ID, preset));
  }

  disabledPresetIds.forEach((id) => {
    if (!useMaterialStore.getState().disabledPresetIds.includes(id)) {
      useMaterialStore.getState().togglePresetDisabled(id);
    }
  });

  // Flag flips even when there was nothing to migrate, so re-activation never re-runs
  useMaterialStore.setState({ migratedFromPresets: true });
  setStorage('materials', toUserData(useMaterialStore.getState()));
};

/** Test-only: allows re-running initMaterialStore after a store reset */
export const resetMaterialStoreInit = (): void => {
  initialized = false;
};
