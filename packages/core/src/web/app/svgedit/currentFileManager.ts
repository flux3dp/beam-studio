import autoSaveHelper from 'helpers/auto-save-helper';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import TopBarController from 'app/views/beambox/TopBar/contexts/TopBarController';
import { IFile } from 'interfaces/IMyCloud';

class CurrentFileManager {
  isCloudFile = false;
  private name: string | null = null;
  private path: string | null = null;
  private hasUnsavedChanges = false;

  getName = (): string | null => this.name;

  getPath = (): string | null => this.path;

  getHasUnsavedChanges = (): boolean => this.hasUnsavedChanges;

  setHasUnsavedChanges = (val: boolean, shouldClearTimeEst = true) => {
    this.hasUnsavedChanges = val;
    TopBarController.setHasUnsavedChange(val);
    if (shouldClearTimeEst) {
      const timeEstimationButtonEventEmitter =
        eventEmitterFactory.createEventEmitter('time-estimation-button');
      timeEstimationButtonEventEmitter.emit('SET_ESTIMATED_TIME', null);
    }
    autoSaveHelper.toggleAutoSave(val);
  };

  updateTitle = () => {
    TopBarController.updateTitle(this.name, this.isCloudFile);
  };

  extractFileName = (filepath: string) => {
    const splitPath = filepath.split(window.os === 'Windows' ? '\\' : '/');
    const fileName = splitPath[splitPath.length - 1];
    return fileName.slice(0, fileName.lastIndexOf('.')).replace(':', '/');
  };

  setFileName = (
    fileName: string,
    opts: { extractFromPath?: boolean; clearPath?: boolean } = {}
  ) => {
    const { extractFromPath = false, clearPath = false } = opts;
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

  setCloudUUID = (uuid: string | null) => {
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
