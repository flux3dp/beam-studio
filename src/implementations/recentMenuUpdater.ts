import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import BeamFileHelper from 'helpers/beam-file-helper';
import currentFileManager from 'app/svgedit/currentFileManager';
import FileExportHelper from 'helpers/file-export-helper';
import i18n from 'helpers/i18n';
import importBvg from 'app/svgedit/operations/import/importBvg';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IRecentMenuUpdater } from 'interfaces/IRecentMenuUpdater';

import communicator from './communicator';
import fs from './fileSystem';
import storage from './storage';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const update = () => {
  communicator.send('UPDATE_RECENT_FILES_MENU');
};

communicator.on('OPEN_RECENT_FILES', async (evt, filePath: string) => {
  const res = await FileExportHelper.toggleUnsavedChangedDialog();
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
        type: AlertConstants.SHOW_POPUP_ERROR,
        message: i18n.lang.topmenu.file.path_not_exit,
      });
      storage.set(
        'recent_files',
        storage.get('recent_files', false).filter((path) => path !== filePath)
      );
      update();
    }
  }
});

export default {
  update,
} as IRecentMenuUpdater;
