// Add this import at the top of the file
import path from 'path';

import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import progressCaller from '@core/app/actions/progress-caller';
import tabController from '@core/app/actions/tabController';
import { TabConstants, TabEvents } from '@core/app/constants/ipcEvents';
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
  | { filePath: string; type: 'open' }
  | { filePath: string; type: 'recent' }
  // Add a new type for opening files from a path
  | { key: ExampleFileKey; type: 'example' };

const id = 'import-file-in-another-tab';

export const checkTabCount = (): boolean => {
  if (isWeb()) {
    return true;
  } else {
    const tabs = tabController.getAllTabs();

    if (tabs.length < TabConstants.maxTab) {
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
      const filePath = fileSystem.getPathForFile(importingFile.data);

      if (!filePath) {
        progressCaller.popById(id);
        throw new Error('Failed to load file path');
      }

      data = {
        data: {
          name: importingFile.data.name,
          path: filePath,
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
  // TODO: this function cannot handle svg file correctly, which `type` equals ''
  match(importingFile)
    .with({ type: 'normal' }, async (importingFile) => {
      await svgEditor.handleFile(importingFile.data);
    })
    .with({ type: 'path' }, async (importingFile) => {
      const data = importingFile.data;
      const fileContent = fileSystem.readFile(data.path);
      const file = new File([fileContent], data.name, data);

      (file as any).path = data.path;

      await svgEditor.handleFile(file);
    })
    .with({ type: 'cloud' }, async (importingFile) => {
      await cloudFile.openFile(importingFile.file);
    })
    .with({ type: 'recent' }, async (importingFile) => {
      await recentMenuUpdater.openRecentFiles(importingFile.filePath);
    })
    .with({ type: 'example' }, async (importingFile) => {
      await loadExampleFile(importingFile.key);
    })
    .with({ type: 'open' }, async (importingFile) => {
      const { filePath } = importingFile;
      const fileName = path.basename(filePath);
      const fileContent = fileSystem.readFile(filePath);

      if (fileContent) {
        const file = new File([fileContent], fileName);

        // Storing the path on the file object is useful for other parts of the app
        (file as any).path = filePath;
        await svgEditor.handleFile(file);
      }
    });
};
