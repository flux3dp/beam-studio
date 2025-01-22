import alertCaller from '@core/app/actions/alert-caller';
import { promarkModels } from '@core/app/actions/beambox/constant';
import alertConstants from '@core/app/constants/alert-constants';
import LayerModule from '@core/app/constants/layer-module/layer-modules';
import defaultPresets from '@core/app/constants/presets';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getPromarkInfo } from '@core/helpers/device/promark/promark-info';
import i18n from '@core/helpers/i18n';
import type { Preset, PresetModel } from '@core/interfaces/ILayerConfig';

import dialog from '@app/implementations/dialog';
import storage from '@app/implementations/storage';

const migrateStorage = () => {
  const defaultKeys = Object.keys(defaultPresets);
  let presets: Preset[] = storage.get('presets');

  if (presets) {
    const existingKeys = new Set<string>();

    presets = presets.filter((c) => {
      if (!c.isDefault) {
        return true;
      }

      existingKeys.add(c.key);

      return !!defaultPresets[c.key];
    });
    defaultKeys.forEach((key, idx) => {
      if (!existingKeys.has(key)) {
        let inserIdx = -1;

        if (idx > 0) {
          const prevKey = defaultKeys[idx - 1];

          inserIdx = presets.findIndex((p) => p.key === prevKey && p.isDefault);
        }

        const newPreset = { hide: false, isDefault: true, key };

        presets.splice(inserIdx + 1, 0, newPreset);
      }
    });
  } else {
    const customizedLaserConfigs = storage.get('customizedLaserConfigs');

    // For version <= 2.3.9, maybe we can remove this in the future
    if (customizedLaserConfigs) {
      presets = [...customizedLaserConfigs];

      const defaultLaserConfigsInUse = storage.get('defaultLaserConfigsInUse') || {};

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
      presets = presets.filter((c) => !(c.isDefault && !defaultPresets[c.key]));
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

  storage.set('presets', presets);

  return presets;
};

// default + customized
let allPresets: Preset[];
const getAllPresets = (): Preset[] => allPresets;

let presetsCache: {
  [model in PresetModel]?: {
    [module in LayerModule]?: Preset[];
  };
} = {};
const initPresets = (migrate = false) => {
  if (!allPresets) {
    if (migrate) {
      allPresets = migrateStorage();
    } else {
      allPresets = storage.get('presets') || migrateStorage();
    }

    // translate name
    const unit = storage.get('default-units') || 'mm';
    const LANG = i18n.lang.beambox.right_panel.laser_panel;

    allPresets.forEach((preset) => {
      if (preset.isDefault && preset.key) {
        const { key } = preset;
        const translated = LANG.dropdown[unit][key];

        preset.name = translated || key;
      }
    });
  }
};

const clearPresetsCache = () => {
  presetsCache = {};
};

const reloadPresets = (migrate = false): void => {
  allPresets = null;
  clearPresetsCache();
  initPresets(migrate);
};

const getPresetModel = (model: PresetModel): PresetModel => {
  if (!promarkModels.has(model)) {
    return model;
  }

  const info = getPromarkInfo();

  return `fpm1_${info.laserType}_${info.watt}` as PresetModel;
};

const getDefaultPreset = (
  key: string,
  model: PresetModel,
  layerModule: LayerModule = LayerModule.LASER_UNIVERSAL,
): null | Preset => {
  const presetModel = getPresetModel(model);

  return (
    defaultPresets[key]?.[presetModel]?.[layerModule] ||
    defaultPresets[key]?.[presetModel]?.[LayerModule.LASER_UNIVERSAL] ||
    null
  );
};

const modelHasPreset = (model: WorkAreaModel, key: string): boolean => !!defaultPresets[key]?.[getPresetModel(model)];

const getPresetsList = (model: WorkAreaModel, layerModule: LayerModule = LayerModule.LASER_UNIVERSAL): Preset[] => {
  const presetModel = getPresetModel(model);

  if (presetsCache[presetModel]?.[layerModule]) {
    return presetsCache[presetModel][layerModule];
  }

  const res =
    allPresets
      ?.map((preset) => {
        const { hide, isDefault, key, module } = preset;

        if (hide) {
          return null;
        }

        if (isDefault) {
          const defaultPreset = getDefaultPreset(key, presetModel, layerModule);

          if (defaultPreset) {
            return { ...defaultPreset, ...preset };
          }

          return null;
        }

        if ((module === LayerModule.PRINTER) !== (layerModule === LayerModule.PRINTER)) {
          return null;
        }

        return preset;
      })
      .filter((e) => e) || [];

  if (!presetsCache[presetModel]) {
    presetsCache[presetModel] = {};
  }

  presetsCache[presetModel][layerModule] = res;

  return res;
};

const savePreset = (preset: Preset): void => {
  allPresets.push(preset);
  storage.set('presets', allPresets);
  clearPresetsCache();
};

const savePresetList = (presets: Preset[]): void => {
  allPresets = presets;
  storage.set('presets', allPresets);
  clearPresetsCache();
};

const resetPresetList = (): void => {
  const defaultKeys = Object.keys(defaultPresets);
  const newPresets = [...defaultKeys.map((key) => ({ hide: false, isDefault: true, key }))];

  storage.set('presets', newPresets);
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
            const configString = evt.target.result as string;
            const newConfigs = JSON.parse(configString);
            const { customizedLaserConfigs, defaultLaserConfigsInUse, presets } = newConfigs;

            if (presets) {
              storage.set('presets', presets);
            } else if (customizedLaserConfigs && defaultLaserConfigsInUse) {
              // For version <= 2.3.9
              const configNames = new Set(
                customizedLaserConfigs.filter((config) => !config.isDefault).map((config) => config.name),
              );
              let currentConfig = storage.get('customizedLaserConfigs') || [];

              if (typeof currentConfig === 'string') {
                currentConfig = JSON.parse(currentConfig);
              }

              for (let i = 0; i < currentConfig.length; i += 1) {
                const config = currentConfig[i];

                if (!config.isDefault && !configNames.has(config.name)) {
                  customizedLaserConfigs.push(config);
                }
              }
              storage.set('customizedLaserConfigs', customizedLaserConfigs);
              storage.set('defaultLaserConfigsInUse', defaultLaserConfigsInUse);
              storage.removeAt('presets');
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

const exportPresets = async (presets?: Preset[]): Promise<void> => {
  const isLinux = window.os === 'Linux';
  const getContent = () => {
    const laserConfig = {
      presets: presets ?? (storage.get('presets') as Preset[]),
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
        name: window.os === 'MacOS' ? 'JSON (*.json)' : 'JSON',
      },
      {
        extensions: ['*'],
        name: i18n.lang.topmenu.file.all_files,
      },
    ],
  );
};

initPresets(true);

export default {
  exportPresets,
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
