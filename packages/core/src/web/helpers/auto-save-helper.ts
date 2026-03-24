import { sprintf } from 'sprintf-js';
import { shallow } from 'zustand/shallow';

import alertCaller from '@core/app/actions/alert-caller';
import tabController from '@core/app/actions/tabController';
import { SettingCategory, showSettingsModal } from '@core/app/components/settings';
import { getStorage, setStorage, useStorageStore } from '@core/app/stores/storageStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import { generateBeamBuffer } from '@core/helpers/file/export';
import { isAtPage } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import fs from '@core/implementations/fileSystem';
import type { AutoSaveConfig } from '@core/interfaces/AutoSaveConfig';

let autoSaveInterval: NodeJS.Timeout | undefined;

const AUTO_SAVE_CONFIG_STORAGE_KEY = 'auto-save-config';
const AUTO_SAVE_OLD_PREFIX = 'beam-studio auto-save-';
const AUTO_SAVE_NEW_PREFIX = 'beam-studio autosave-';

const getDefaultConfig = (): AutoSaveConfig => {
  const getDefaultPath = () => {
    try {
      return fs.join(fs.getPath('documents'), 'Beam Studio', 'auto-save');
    } catch (err) {
      console.error('Unable to get documents path', err);
    }
    try {
      return fs.getPath('userData');
    } catch (err) {
      console.error('Unable to get userData path', err);
    }

    return null;
  };

  return {
    directory: getDefaultPath()!,
    enabled: true,
    fileNumber: 5,
    timeInterval: 10,
  };
};

const getConfig = (): AutoSaveConfig => {
  return getStorage(AUTO_SAVE_CONFIG_STORAGE_KEY) ?? getDefaultConfig();
};

const setConfig = (config: AutoSaveConfig): void => {
  setStorage(AUTO_SAVE_CONFIG_STORAGE_KEY, config);
};

const getFilename = () => {
  const time = new Date().toISOString().split('.')[0].replace('T', ' ').replaceAll(':', '-');

  return `${AUTO_SAVE_NEW_PREFIX}${time}-${tabController.currentId}.beam`;
};

const applyDefaultConfig = async (): Promise<void> => {
  const defaultConfig = getDefaultConfig();
  const { directory } = defaultConfig;

  try {
    await fs.mkdir(directory, true);
  } catch (error) {
    console.error(`Failed to create auto-save directory '${directory}', auto-save disabled:`, error);
    defaultConfig.enabled = false;
  }

  // Create a dumb file to prompt mac permission
  const tempFilePath = fs.join(directory, getFilename());

  fs.writeStream(tempFilePath, 'a');
  setConfig(defaultConfig);
};

const init = (): void => {
  if (!getStorage(AUTO_SAVE_CONFIG_STORAGE_KEY)) {
    applyDefaultConfig();
  }
};

const startAutoSave = (): void => {
  const { timeInterval } = getConfig();

  console.log('auto save service started');
  autoSaveInterval = setInterval(
    async () => {
      if (isAtPage('editor')) {
        console.log('auto save triggered');

        const { directory, fileNumber } = getConfig();

        if (!fs.exists(directory)) {
          const { alert: tAlert, autosave: t } = i18n.lang;

          alertCaller.popUp({
            buttonLabels: [tAlert.close, t.open_settings],
            callbacks: [() => {}, () => showSettingsModal(SettingCategory.AUTOSAVE)],
            caption: t.path_not_correct,
            id: 'auto-save-directory-not-exist',
            message: sprintf(t.path_not_correct_desc, {
              autosave: i18n.lang.settings.groups.autosave,
              path: i18n.lang.settings.autosave_path,
              preferences: i18n.lang.topbar.menu.preferences,
            }),
            primaryButtonIndex: 1,
          });

          return;
        }

        const files = fs
          .readdirSync(directory)
          .filter((file) => file.startsWith(AUTO_SAVE_NEW_PREFIX) || file.startsWith(AUTO_SAVE_OLD_PREFIX))
          .sort((a, b) => {
            const aIsOld = a.startsWith(AUTO_SAVE_OLD_PREFIX);
            const bIsOld = b.startsWith(AUTO_SAVE_OLD_PREFIX);

            if (aIsOld && !bIsOld) {
              return -1;
            }

            if (!aIsOld && bIsOld) {
              return 1;
            }

            if (aIsOld && bIsOld) {
              return -a.localeCompare(b);
            }

            return a.localeCompare(b);
          });

        for (let i = 0; i <= files.length - fileNumber; i += 1) {
          const path = fs.join(directory, files[i]);

          try {
            if (fs.exists(path)) fs.delete(path);
          } catch {
            try {
              if (fs.exists(path)) fs.delete(path);
            } catch (error) {
              console.error(`Failed to delete auto-save file '${files[i]}', continue with next file`, error);
            }
          }
        }

        const target = fs.join(directory, getFilename());
        const buffer = await generateBeamBuffer();

        fs.writeStream(target, 'w', [buffer]);
      }
    },
    timeInterval * 60 * 1000,
  );
};

const stopAutoSave = (): void => {
  console.log('auto save service stopped');
  clearInterval(autoSaveInterval);
  autoSaveInterval = undefined;
};

const toggleAutoSave = (start = false): void => {
  if (isWeb()) {
    return;
  }

  if (start) {
    const config = getConfig();
    const { enabled } = config;

    if (enabled && !autoSaveInterval) {
      startAutoSave();
    }
  } else {
    stopAutoSave();
  }
};

useStorageStore.subscribe(
  (state) => [state[AUTO_SAVE_CONFIG_STORAGE_KEY]?.enabled, state[AUTO_SAVE_CONFIG_STORAGE_KEY]?.timeInterval],
  () => {
    if (currentFileManager.getHasUnsavedChanges()) {
      toggleAutoSave(false);
      toggleAutoSave(true);
    }
  },
  { equalityFn: shallow },
);

export default {
  applyDefaultConfig,
  getConfig,
  init,
  setConfig,
  toggleAutoSave,
};
