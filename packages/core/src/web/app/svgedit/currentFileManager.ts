import TopBarController from '@core/app/components/beambox/TopBar/contexts/TopBarController';
import autoSaveHelper from '@core/helpers/auto-save-helper';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getOS } from '@core/helpers/getOS';
import type { IFile } from '@core/interfaces/IMyCloud';

class CurrentFileManager {
  isCloudFile = false;
  private name: null | string = null;
  private path: null | string = null;
  private hasUnsavedChanges = false;

  getName = (): null | string => this.name;

  getPath = (): null | string => this.path;

  getHasUnsavedChanges = (): boolean => this.hasUnsavedChanges;

  setHasUnsavedChanges = (val: boolean, shouldClearTimeEst = true) => {
    this.hasUnsavedChanges = val;
    TopBarController.setHasUnsavedChange(val);

    if (shouldClearTimeEst) {
      const timeEstimationButtonEventEmitter = eventEmitterFactory.createEventEmitter('time-estimation-button');

      timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);
    }

    autoSaveHelper.toggleAutoSave(val);
  };

  updateTitle = () => {
    TopBarController.updateTitle(this.name || '', this.isCloudFile);
  };

  extractFileName = (filepath: string) => {
    const splitPath = filepath.split(getOS() === 'Windows' ? '\\' : '/');
    const fileName = splitPath[splitPath.length - 1];

    return fileName.slice(0, fileName.lastIndexOf('.')).replace(':', '/');
  };

  setFileName = (fileName: string, opts: { clearPath?: boolean; extractFromPath?: boolean } = {}) => {
    const { clearPath = false, extractFromPath = false } = opts;
    const name = extractFromPath ? this.extractFileName(fileName) : fileName;

    this.name = name;

    if (clearPath && !this.isCloudFile) this.path = null;

    this.updateTitle();
  };

  setLocalFile = (filepath: string) => {
    const fileName = this.extractFileName(filepath);

    this.name = fileName;
    this.path = filepath;
    this.isCloudFile = false;
    this.updateTitle();
  };

  setCloudFile = (file: IFile) => {
    this.name = file.name;
    this.path = file.uuid;
    this.isCloudFile = true;
    this.updateTitle();
  };

  setCloudUUID = (uuid: null | string) => {
    this.path = uuid;
    this.isCloudFile = !!uuid;
    // update cloud icon
    this.updateTitle();
  };

  clear = () => {
    this.name = null;
    this.path = null;
    this.isCloudFile = false;
    this.updateTitle();
    this.setHasUnsavedChanges(false);
  };
}

// Singleton
const currentFileManager = new CurrentFileManager();

export default currentFileManager;
