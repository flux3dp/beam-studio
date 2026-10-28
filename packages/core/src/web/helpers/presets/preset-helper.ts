import { useEffect } from 'react';

import { shallow } from 'zustand/shallow';

import alertCaller from '@core/app/actions/alert-caller';
import { promarkModels } from '@core/app/actions/beambox/constant';
import alertConstants from '@core/app/constants/alert-constants';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { inchLabels, presetNames } from '@core/app/constants/presetNames';
import defaultPresets from '@core/app/constants/presets';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { getStorage, removeFromStorage, setStorage, useStorageStore } from '@core/app/stores/storageStore';
import { isInnerEngravingActive } from '@core/helpers/addOn/innerEngraving';
import { getPromarkInfo } from '@core/helpers/device/promark/promark-info';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';
import useForceUpdate from '@core/helpers/use-force-update';
import dialog from '@core/implementations/dialog';
import type { Preset, PresetModel } from '@core/interfaces/ILayerConfig';

const eventEmitter = eventEmitterFactory.createEventEmitter('presets');

const migrateStorage = () => {
  const defaultKeys = Object.keys(defaultPresets);
  let presets: Preset[] = getStorage('presets');

  if (presets) {
    const existingKeys = new Set<string>();

    presets = presets.filter((c) => {
      if (!c.isDefault) {
        return true;
      }

      existingKeys.add(c.key!);

      return Boolean(defaultPresets[c.key!]);
    });
    defaultKeys.forEach((key, idx) => {
      if (!existingKeys.has(key)) {
        let insertIndex = -1;

        if (idx > 0) {
          const prevKey = defaultKeys[idx - 1];

          insertIndex = presets.findIndex((p) => p.key === prevKey && p.isDefault);
        }

        const newPreset = { hide: false, isDefault: true, key };

        presets.splice(insertIndex + 1, 0, newPreset);
      }
    });
  } else {
    const customizedLaserConfigs = getStorage('customizedLaserConfigs');

    // For version <= 2.3.9, maybe we can remove this in the future
    if (customizedLaserConfigs) {
      presets = [...customizedLaserConfigs];

      const defaultLaserConfigsInUse = getStorage('defaultLaserConfigsInUse') || {};

      defaultKeys.forEach((key, idx) => {
        if (!defaultLaserConfigsInUse[key]) {
          const hide = defaultLaserConfigsInUse[key] === false;
          let inserIdx = -1;

          if (idx > 0) {
            const prevKey = defaultKeys[idx - 1];

            inserIdx = presets.findIndex((p) => p.key === prevKey && p.isDefault);
          }

          const newPreset = { hide, isDefault: true, key };

          presets.splice(inserIdx + 1, 0, newPreset);
        }
      });
      presets = presets.filter((c) => !(c.isDefault && !defaultPresets[c.key!]));
      presets.forEach((p, idx) => {
        const { hide, isDefault, key } = p;

        if (isDefault) {
          presets[idx] = { hide: !!hide, isDefault, key };
        }
      });
    } else {
      presets = defaultKeys.map((key) => ({ hide: false, isDefault: true, key }));
    }
  }

  setStorage('presets', presets);

  return presets;
};

/** `<material> - <thickness> <preset>`, e.g. "Wood - 3mm Cutting"; unknown keys fall back to the key. */
export const getPresetName = (key: string, unit: 'inches' | 'mm'): string => {
  const def = presetNames[key];

  if (!def) return key;

  const { materials, presets } = i18n.lang.beambox.right_panel.laser_panel.dropdown;
  const thickness = def.thicknessMm && (unit === 'inches' ? inchLabels[def.thicknessMm] : `${def.thicknessMm}mm`);
  const detail = [thickness, def.preset && presets[def.preset]].filter(Boolean).join(' ');
  const material = materials[def.material];

  return detail ? `${material} - ${detail}` : material;
};

// default + customized
let allPresets: Preset[] | undefined;

export const getAllPresets = (): Preset[] => allPresets!;

let presetsCache: {
  [model in PresetModel]?: {
    [module in LayerModuleType]?: Preset[];
  };
} = {};
const initPresets = (migrate = false) => {
  if (!allPresets) {
    if (migrate) {
      allPresets = migrateStorage();
    } else {
      allPresets = getStorage('presets') || migrateStorage();
    }

    const unit = getStorage('default-units') || 'mm';

    allPresets!.forEach((preset) => {
      if (preset.isDefault && preset.key) preset.name = getPresetName(preset.key, unit);
    });
  }
};

const clearPresetsCache = () => {
  presetsCache = {};
};

const reloadPresets = (migrate = false): void => {
  allPresets = undefined; // clear the array
  clearPresetsCache();
  initPresets(migrate);
  eventEmitter.emit('reload');
};

export const initStorageListeners = () => {
  useStorageStore.subscribe(
    (state) => [state.presets, state['default-units'], state['active-lang']],
    () => reloadPresets(),
    { equalityFn: shallow },
  );
};
initStorageListeners();

export const getPresetModel = (model: PresetModel): PresetModel => {
  if (promarkModels.has(model)) {
    // 3D objects are dotted or traced through slices: none of the 2D UV presets fit them
    if (isInnerEngravingActive()) return 'fpm1_inner_engraving';

    const info = getPromarkInfo();

    return `fpm1_${info.laserType}_${info.watt}` as PresetModel;
  }

  if (model === 'fhx2rf') {
    const value = useCanvasStore.getState().watt;

    return `fhx2rf_${value}` as PresetModel;
  }

  return model;
};

export const getDefaultPreset = (
  key: string,
  model: PresetModel,
  layerModule: LayerModuleType = LayerModule.LASER_UNIVERSAL,
): null | Preset => {
  const presetModel = getPresetModel(model);

  return defaultPresets[key]?.[presetModel]?.[layerModule] || null;
};

export const modelHasPreset = (model: WorkAreaModel, key: string): boolean =>
  Boolean(defaultPresets[key]?.[getPresetModel(model)]);

export const getPresetsList = (
  model: WorkAreaModel,
  layerModule: LayerModuleType = LayerModule.LASER_UNIVERSAL,
): Preset[] => {
  const presetModel = getPresetModel(model);

  if (presetsCache[presetModel]?.[layerModule]) {
    return presetsCache[presetModel][layerModule];
  }

  const res =
    allPresets
      ?.map((preset) => {
        const { hide, isDefault, key, module: presetModule } = preset;

        if (hide) return null;

        if (isDefault) {
          const defaultPreset = getDefaultPreset(key!, presetModel, layerModule);

          if (defaultPreset) return { ...defaultPreset, ...preset };

          return null;
        }

        if (printingModules.has(presetModule!) && layerModule !== presetModule) {
          return null;
        }

        return preset;
      })
      .filter(Boolean) || [];

  if (!presetsCache[presetModel]) {
    presetsCache[presetModel] = {};
  }

  presetsCache[presetModel][layerModule] = res;

  return res;
};

export const savePreset = (preset: Preset): void => {
  allPresets!.push(preset);
  setStorage('presets', allPresets!);
  clearPresetsCache();
};

export const savePresetList = (presets: Preset[]): void => {
  allPresets = presets;
  setStorage('presets', allPresets);
  clearPresetsCache();
};

export const resetPresetList = (): void => {
  const defaultKeys = Object.keys(defaultPresets);
  const newPresets = [...defaultKeys.map((key) => ({ hide: false, isDefault: true, key }))];

  setStorage('presets', newPresets);
  reloadPresets();
};

export const importPresets = async (file?: Blob): Promise<boolean> => {
  const fileBlob =
    file ??
    (await dialog.getFileFromDialog({
      filters: [{ extensions: ['json', 'JSON'], name: 'JSON' }],
    }));

  if (fileBlob) {
    const res = await new Promise<boolean>((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        message: i18n.lang.beambox.right_panel.laser_panel.preset_management.sure_to_import_presets,
        onConfirm: () => {
          const reader = new FileReader();

          reader.onloadend = (evt) => {
            const configString = evt.target!.result as string;
            const newConfigs = JSON.parse(configString);
            const { customizedLaserConfigs, defaultLaserConfigsInUse, presets } = newConfigs as any;

            if (presets) {
              setStorage('presets', presets);
            } else if (customizedLaserConfigs && defaultLaserConfigsInUse) {
              // For version <= 2.3.9
              const configNames = new Set(
                customizedLaserConfigs.filter((config: any) => !config.isDefault).map((config: any) => config.name),
              );
              let currentConfig = getStorage('customizedLaserConfigs') || [];

              if (typeof currentConfig === 'string') {
                currentConfig = JSON.parse(currentConfig);
              }

              for (let i = 0; i < currentConfig.length; i += 1) {
                const config = currentConfig[i];

                if (!config.isDefault && !configNames.has(config.name)) {
                  customizedLaserConfigs.push(config);
                }
              }
              setStorage('customizedLaserConfigs', customizedLaserConfigs);
              setStorage('defaultLaserConfigsInUse', defaultLaserConfigsInUse);
              removeFromStorage('presets');
            }

            reloadPresets(true);
            resolve(true);
          };
          reader.readAsText(fileBlob);
        },
      });
    });

    return res;
  }

  return false;
};

export const exportPresets = async (presets?: Preset[]): Promise<void> => {
  const isLinux = getOS() === 'Linux';
  const getContent = () => {
    const laserConfig = {
      presets: presets ?? (getStorage('presets') as Preset[]),
    };

    return JSON.stringify(laserConfig);
  };

  await dialog.writeFileDialog(
    getContent,
    i18n.lang.beambox.right_panel.laser_panel.preset_management.export_preset_title,
    isLinux ? '.json' : '',
    [
      {
        extensions: ['json'],
        name: getOS() === 'MacOS' ? 'JSON (*.json)' : 'JSON',
      },
      {
        extensions: ['*'],
        name: i18n.lang.topmenu.file.all_files,
      },
    ],
  );
};

initPresets(true);

export const usePresetList = (model: WorkAreaModel, layerModule: LayerModuleType = LayerModule.LASER_UNIVERSAL) => {
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    eventEmitter.on('reload', forceUpdate);

    return () => {
      eventEmitter.off('reload', forceUpdate);
    };
  }, [forceUpdate]);

  return getPresetsList(model, layerModule);
};

export default {
  getAllPresets,
  getDefaultPreset,
  getPresetModel,
  getPresetsList,
  importPresets,
  modelHasPreset,
  reloadPresets,
  resetPresetList,
  savePreset,
  savePresetList,
};
