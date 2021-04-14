import beamFileHelper from 'helpers/beam-file-helper';
import storage from 'helpers/storage-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IConfig } from 'interfaces/IAutosave';

const fs = requireNode('fs');
const fsPromises = fs.promises;
const path = requireNode('path');

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

let autoSaveInterval = null;
let editingValue: IConfig = null;

const init = () => {
  if (!storage.isExisting('auto-save-config')) {
    useDefaultConfig();
  }
  editingValue = storage.get('auto-save-config');
};

const useDefaultConfig = async () => {
  const getDefaultPath = () => {
    const electron = requireNode('electron');
    try {
      return path.join(electron.remote.app.getPath('documents'), 'Beam Studio', 'auto-save');
    } catch (err) {
      console.error('Unable to get documents path', err);
    }
    try {
      return electron.remote.app.getPath('userData');
    } catch (err) {
      console.error('Unable to get userData path', err);
    }
    return null;
  }

  const directory = getDefaultPath();
  const defaultConfig = {
    enabled: true,
    directory,
    fileNumber: 5,
    timeInterval: 10,
  };
  await fs.mkdirSync(directory, {
    recursive: true,
  });
  storage.set('auto-save-config', defaultConfig);
};

const getConfig = () => {
  return storage.get('auto-save-config') as IConfig;
};

const setConfig = (config: IConfig) => {
  storage.set('auto-save-config', config);
};

init();

const toggleAutoSave = (start: boolean = false) => {
  if (start) {
    const config = storage.get('auto-save-config');
    const { enabled } = config;
    if (enabled && !autoSaveInterval) {
      startAutoSave();
    }
  } else {
    stopAutoSave();
  }
};

const startAutoSave = () => {
  const config = storage.get('auto-save-config');
  if (config) {
    const { directory, fileNumber, timeInterval } = config;
    console.log('auto save service started');
    autoSaveInterval = setInterval(async () => {
      console.log('auto save triggered');
      const svgString = svgCanvas.getSvgString();
      const imageSource = await svgCanvas.getImageSource();
      for (let i = fileNumber - 1; i >= 1; i--) {
        const from = path.join(directory, `beam-studio auto-save-${i}.beam`);
        if (fs.existsSync(from)) {
          const to = path.join(directory, `beam-studio auto-save-${i + 1}.beam`);
          await fsPromises.rename(from, to);
        }
      }
      const target = path.join(directory, 'beam-studio auto-save-1.beam');
      beamFileHelper.saveBeam(target, svgString, imageSource);
    }, timeInterval * 60 * 1000);
  }
};

const stopAutoSave = () => {
  console.log('auto save service stopped due to file saved');
  clearInterval(autoSaveInterval);
}

export default {
  useDefaultConfig,
  getConfig,
  setConfig,
  toggleAutoSave,
  startAutoSave,
  stopAutoSave,
};
