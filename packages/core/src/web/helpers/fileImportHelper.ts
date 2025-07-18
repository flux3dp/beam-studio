import alertCaller from '@core/app/actions/alert-caller';
import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import progressCaller from '@core/app/actions/progress-caller';
import tabController from '@core/app/actions/tabController';
import tabConstants, { TabEvents } from '@core/app/constants/tabConstants';
import cloudFile from '@core/helpers/api/cloudFile';
import { hashMap } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import type { ExampleFileKey } from '@core/helpers/menubar/exampleFiles';
import { loadExampleFile } from '@core/helpers/menubar/exampleFiles';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import communicator from '@core/implementations/communicator';
import fileSystem from '@core/implementations/fileSystem';
import recentMenuUpdater from '@core/implementations/recentMenuUpdater';
import type { IFile } from '@core/interfaces/IMyCloud';

let svgEditor: ISVGEditor;

getSVGAsync((globalSVG) => {
  svgEditor = globalSVG.Editor;
});

type FileMeta = {
  name: string;
  path: string;
  type: string;
};

export type FileData =
  | { data: File; type: 'normal' }
  | { data: FileMeta; type: 'path' }
  | { file: IFile; type: 'cloud' }
  | { filePath: string; type: 'recent' }
  | { key: ExampleFileKey; type: 'example' };

const id = 'import-file-in-another-tab';

export const checkTabCount = (): boolean => {
  if (isWeb()) {
    return true;
  } else {
    const tabs = tabController.getAllTabs();

    if (tabs.length < tabConstants.maxTab) {
      return true;
    }

    alertCaller.popUp({ message: i18n.lang.beambox.popup.reach_tab_count_limit });

    return false;
  }
};

export const setFileInAnotherTab = async (importingFile: FileData): Promise<void> => {
  if (isWeb()) {
    window.importingFile = importingFile;
    window.location.hash = hashMap.editor;
  } else {
    if (!checkTabCount()) return;

    progressCaller.openNonstopProgress({ id });

    let data = importingFile;

    if (importingFile.type === 'normal') {
      const path = fileSystem.getPathForFile(importingFile.data);

      if (!path) {
        progressCaller.popById(id);
        throw new Error('Failed to load file path');
      }

      data = {
        data: {
          name: importingFile.data.name,
          path,
          type: importingFile.data.type,
        },
        type: 'path',
      };
    }

    const currentTabIds = tabController.getAllTabs().map((tab) => tab.id);
    const handler = () => {
      tabController.offBlurred(handler);
      progressCaller.popById(id);

      const targetTab = tabController.getAllTabs().find((tab) => !currentTabIds.includes(tab.id));

      if (targetTab) {
        communicator.send(TabEvents.ImportFileInTab, data);
      }
    };

    tabController.onBlurred(handler);
    tabController.addNewTab();
  }
};

export const importFileInCurrentTab = async (importingFile: FileData): Promise<void> => {
  if (importingFile.type === 'normal') {
    await svgEditor.handleFile(importingFile.data);
  } else if (importingFile.type === 'path') {
    const data = importingFile.data;
    const fileContent = fileSystem.readFile(data.path);
    const file = new File([fileContent], data.name, data);

    (file as any).path = data.path;

    await svgEditor.handleFile(file);
  } else if (importingFile.type === 'cloud') {
    await cloudFile.openFile(importingFile.file);
  } else if (importingFile.type === 'recent') {
    await recentMenuUpdater.openRecentFiles(importingFile.filePath);
  } else if (importingFile.type === 'example') {
    await loadExampleFile(importingFile.key);
  }
};
