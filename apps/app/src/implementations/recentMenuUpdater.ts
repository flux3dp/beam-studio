import Alert from '@core/app/actions/alert-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import { MenuEvents } from '@core/app/constants/ipcEvents';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import importBvg from '@core/app/svgedit/operations/import/importBvg';
import BeamFileHelper from '@core/helpers/beam-file-helper';
import { toggleUnsavedChangedDialog } from '@core/helpers/file/export';
import { setFileInAnotherTab } from '@core/helpers/fileImportHelper';
import { isAtPage } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IRecentMenuUpdater } from '@core/interfaces/IRecentMenuUpdater';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import communicator from './communicator';
import fs from './fileSystem';
import storage from './storage';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const update = () => {
  communicator.send(MenuEvents.UpdateRecentFilesMenu);
};

const openRecentFiles = async (filePath: string): Promise<void> => {
  if (isAtPage('welcome')) {
    setFileInAnotherTab({ filePath, type: 'recent' });

    return;
  }

  const res = await toggleUnsavedChangedDialog();

  if (res) {
    if (fs.exists(filePath)) {
      Alert.popUp({
        id: 'load-recent',
        message: i18n.lang.beambox.popup.loading_image,
      });
      currentFileManager.setLocalFile(filePath);
      svgCanvas.updateRecentFiles(filePath);
      try {
        svgCanvas.clearSelection();

        const fetchPath = filePath.replaceAll('#', '%23');

        if (filePath.endsWith('beam')) {
          const resp = await fetch(fetchPath);
          const blob = await resp.blob();

          await BeamFileHelper.readBeam(blob as File);
        } else if (filePath.endsWith('bvg')) {
          const resp = await fetch(fetchPath);
          const blob = await resp.blob();

          importBvg(blob);
        }

        currentFileManager.setHasUnsavedChanges(false);
      } finally {
        Alert.popById('load-recent');
      }
    } else {
      Alert.popUp({
        id: 'load-recent',
        message: i18n.lang.topmenu.file.path_not_exit,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
      storage.set(
        'recent_files',
        storage.get('recent_files').filter((path: string) => path !== filePath),
      );
      update();
    }
  }
};

communicator.on(MenuEvents.OpenRecentFiles, async (_evt: any, filePath: string) => openRecentFiles(filePath));

export default {
  openRecentFiles,
  update,
} as IRecentMenuUpdater;
