import { create } from 'zustand';
import { combine, subscribeWithSelector } from 'zustand/middleware';

import alertCaller from '@core/app/actions/alert-caller';
import { MY_MATERIALS_ID, RECENTS_LIMIT } from '@core/app/constants/material-catalog/constants';
import { getStorage, setStorage } from '@core/app/stores/storageStore';
import { getMaterialDisplayName, getPresetDisplayName } from '@core/helpers/api/material-catalog/utils';
import i18n from '@core/helpers/i18n';
import { isMaterialBrowserActive } from '@core/helpers/materials/isMaterialBrowserActive';
import type { Material, MaterialPreset, PresetModuleKey, PresetScopeKey } from '@core/interfaces/IMaterial';

import { convertLegacyPresets } from './migration';
import type { MaterialLibraryExport, MaterialStore, MaterialStoreState } from './types';
import { generateUserId, toUserData, withChildren } from './utils';

const getInitialState = (): MaterialStoreState => {
  const userData = getStorage('materials');

  return {
    disabledPresetIds: userData?.disabledPresetIds ?? [],
    favorites: getStorage('material-favorites') ?? [],
    migratedFromPresets: userData?.migratedFromPresets ?? false,
    presetAdditions: userData?.presetAdditions ?? {},
    presetOverrides: userData?.presetOverrides ?? {},
    recents: getStorage('material-recents') ?? [],
    userMaterials: userData?.userMaterials ?? [],
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
      /** Locates a user preset: embedded in a user material, or in a catalog material's additions */
      const findUserPreset = (
        materialId: string,
        presetId: string,
      ): null | { location: 'additions' | 'materials'; preset: MaterialPreset } => {
        const { presetAdditions, userMaterials } = get();
        const material = userMaterials.find(({ id }) => id === materialId);
        const preset = (material ? material.presets : presetAdditions[materialId])?.find(({ id }) => id === presetId);

        return preset ? { location: material ? 'materials' : 'additions', preset } : null;
      };
      /** State slices with the preset filtered out of its owning container */
      const detachPreset = (materialId: string, presetId: string, location: 'additions' | 'materials') => {
        const { presetAdditions, userMaterials } = get();

        return location === 'materials'
          ? {
              presetAdditions,
              userMaterials: userMaterials.map((material) =>
                material.id === materialId
                  ? { ...material, presets: material.presets.filter(({ id }) => id !== presetId) }
                  : material,
              ),
            }
          : {
              presetAdditions: {
                ...presetAdditions,
                [materialId]: presetAdditions[materialId].filter(({ id }) => id !== presetId),
              },
              userMaterials,
            };
      };

      const actions: Omit<MaterialStore, keyof MaterialStoreState> = {
        addMaterial: (material) => {
          apply({ userMaterials: [...get().userMaterials, material] });
        },
        addPreset: (materialId, preset) => {
          const { presetAdditions, userMaterials } = get();

          if (userMaterials.some(({ id }) => id === materialId)) {
            apply({
              userMaterials: userMaterials.map((material) =>
                material.id === materialId ? { ...material, presets: [...material.presets, preset] } : material,
              ),
            });
          } else {
            // Catalog material: user presets attach via the additions map
            apply({
              presetAdditions: {
                ...presetAdditions,
                [materialId]: [...(presetAdditions[materialId] ?? []), preset],
              },
            });
          }
        },
        deleteMaterial: (materialId) => {
          const { favorites, recents, userMaterials } = get();
          const removedIds = new Set(withChildren(materialId, userMaterials).map(({ id }) => id));

          apply({
            favorites: favorites.filter((id) => !removedIds.has(id)),
            recents: recents.filter(({ materialId: id }) => !removedIds.has(id)),
            userMaterials: userMaterials.filter(({ id }) => !removedIds.has(id)),
          });
          setStorage('material-favorites', get().favorites);
          setStorage('material-recents', get().recents);
        },
        deletePreset: (materialId, presetId) => {
          const found = findUserPreset(materialId, presetId);

          if (!found) return;

          apply({
            ...detachPreset(materialId, presetId, found.location),
            disabledPresetIds: get().disabledPresetIds.filter((id) => id !== presetId),
          });
        },
        duplicateMaterial: (source, variants = []) => {
          const cloneMaterial = (material: Material, parentId?: string): Material => ({
            ...structuredClone(material),
            id: generateUserId('user_mat'),
            name: getMaterialDisplayName(material),
            nameKey: undefined,
            ...(parentId !== undefined && { parentId }),
            presets: material.presets.map((preset) => ({
              ...structuredClone(preset),
              id: generateUserId(),
              legacyKey: undefined,
              name: getPresetDisplayName(preset),
              nameKey: undefined,
              origin: 'user' as const,
            })),
            shopLinks: undefined,
            source: 'user' as const,
          });

          const parentCopy = cloneMaterial(source);
          const variantCopies = variants.map((variant) => cloneMaterial(variant, parentCopy.id));

          apply({ userMaterials: [...get().userMaterials, parentCopy, ...variantCopies] });

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
          const { disabledPresetIds, presetAdditions, presetOverrides, userMaterials } = get();

          return {
            disabledPresetIds,
            presetAdditions,
            presetOverrides,
            type: 'flux-material-library',
            userMaterials,
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
          // Merge the imported bucket into the existing one (skip name collisions)
          const existingBucket = state.userMaterials.find(({ id }) => id === MY_MATERIALS_ID);
          const importedBucket = remapped.find(({ id }) => id === MY_MATERIALS_ID);
          let userMaterials = [...state.userMaterials];

          for (const material of remapped) {
            if (material.id === MY_MATERIALS_ID && existingBucket) continue;

            userMaterials.push(material);
          }

          if (existingBucket && importedBucket) {
            const existingNames = new Set(existingBucket.presets.map((preset) => getPresetDisplayName(preset)));
            const newPresets = importedBucket.presets.filter(
              (preset) => !existingNames.has(getPresetDisplayName(preset)),
            );

            userMaterials = userMaterials.map((material) =>
              material.id === MY_MATERIALS_ID
                ? { ...material, presets: [...material.presets, ...newPresets] }
                : material,
            );
          }

          // Additions: concat per material, regenerating colliding preset ids
          const existingPresetIds = new Set(
            Object.values(state.presetAdditions).flatMap((presets) => presets.map(({ id }) => id)),
          );
          const presetAdditions = { ...state.presetAdditions };

          for (const [materialId, presets] of Object.entries(data.presetAdditions ?? {})) {
            const deduped = presets.map((preset) =>
              existingPresetIds.has(preset.id) ? { ...preset, id: generateUserId() } : preset,
            );

            presetAdditions[materialId] = [...(presetAdditions[materialId] ?? []), ...deduped];
          }

          apply({
            disabledPresetIds: [...new Set([...state.disabledPresetIds, ...(data.disabledPresetIds ?? [])])],
            presetAdditions,
            presetOverrides: { ...state.presetOverrides, ...(data.presetOverrides ?? {}) },
            userMaterials,
          });
        },
        movePreset: (materialId, presetId, targetMaterialId) => {
          if (materialId === targetMaterialId) return;

          const found = findUserPreset(materialId, presetId);

          if (!found) return;

          if (targetMaterialId === MY_MATERIALS_ID) actions.ensureBucket();

          // Detach from the source container, then attach to the target
          const { presetAdditions, userMaterials } = detachPreset(materialId, presetId, found.location);

          if (userMaterials.some(({ id }) => id === targetMaterialId)) {
            apply({
              presetAdditions,
              userMaterials: userMaterials.map((material) =>
                material.id === targetMaterialId
                  ? { ...material, presets: [...material.presets, found.preset] }
                  : material,
              ),
            });
          } else {
            apply({
              presetAdditions: {
                ...presetAdditions,
                [targetMaterialId]: [...(presetAdditions[targetMaterialId] ?? []), found.preset],
              },
              userMaterials,
            });
          }
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
        updatePreset: (materialId, presetId, scope, moduleKey, { name, ...values }) => {
          const found = findUserPreset(materialId, presetId);

          if (found) {
            const { location, preset } = found;

            if (name !== undefined) preset.name = name;

            // Write back to the cell this context resolves from ([scope][module] → … → ['*']['*']);
            // any other cell would stay shadowed by a more specific one and the edit looks lost
            const cells: Array<[PresetScopeKey, PresetModuleKey]> = [
              [scope, moduleKey],
              [scope, '*'],
              ['*', moduleKey],
              ['*', '*'],
            ];
            const [scopeKey, cellKey] = cells.find(([s, m]) => preset.settings[s]?.[m]) ?? [scope, moduleKey];

            preset.settings = { ...preset.settings, [scopeKey]: { ...preset.settings[scopeKey], [cellKey]: values } };

            // Mutated in place; respread the owning material/map so memoized consumers
            // (e.g. MaterialDetail's rows keyed on the material object) see a new reference
            apply(
              location === 'materials'
                ? {
                    userMaterials: get().userMaterials.map((material) =>
                      material.id === materialId ? { ...material } : material,
                    ),
                  }
                : { presetAdditions: { ...get().presetAdditions } },
            );

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
