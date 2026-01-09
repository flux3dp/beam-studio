import { generateBeamBuffer } from '@core/helpers/file/export';
import isWeb from '@core/helpers/is-web';
import fs from '@core/implementations/fileSystem';
import storage from '@core/implementations/storage';
import type { AutoSaveConfig } from '@core/interfaces/AutoSaveConfig';

let autoSaveInterval: NodeJS.Timeout | undefined;

const AUTO_SAVE_CONFIG_STORAGE_KEY = 'auto-save-config';
const AUTO_SAVE_OLD_PREFIX = 'beam-studio auto-save-';
const AUTO_SAVE_NEW_PREFIX = 'beam-studio autosave-';

const getConfig = (): AutoSaveConfig => storage.get(AUTO_SAVE_CONFIG_STORAGE_KEY) as AutoSaveConfig;

const setConfig = (config: AutoSaveConfig): void => {
  storage.set(AUTO_SAVE_CONFIG_STORAGE_KEY, config);
};

const getFilename = () => {
  const time = new Date().toISOString().split('.')[0].replace('T', ' ').replaceAll(':', '-');

  return `${AUTO_SAVE_NEW_PREFIX}${time}.beam`;
};

const useDefaultConfig = async (): Promise<void> => {
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

  const directory = getDefaultPath()!;
  const defaultConfig = {
    directory,
    enabled: true,
    fileNumber: 5,
    timeInterval: 10,
  };

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
  if (!storage.isExisting(AUTO_SAVE_CONFIG_STORAGE_KEY)) {
    // Rename after fixing eslint of Setting-General.tsx
    // eslint-disable-next-line hooks/rules-of-hooks
    useDefaultConfig();
  }
};

const startAutoSave = (): void => {
  const config = getConfig();

  if (config) {
    const { directory, fileNumber, timeInterval } = config;

    console.log('auto save service started');
    autoSaveInterval = setInterval(
      async () => {
        if (window.location.hash === '#/studio/beambox') {
          console.log('auto save triggered');

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
            fs.delete(fs.join(directory, files[i]));
          }

          const target = fs.join(directory, getFilename());
          const buffer = await generateBeamBuffer();

          fs.writeStream(target, 'w', [buffer]);
        }
      },
      timeInterval * 60 * 1000,
    );
  }
};

const stopAutoSave = (): void => {
  console.log('auto save service stopped due to file saved');
  clearInterval(autoSaveInterval);
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

export default {
  getConfig,
  init,
  setConfig,
  toggleAutoSave,
  useDefaultConfig,
};
