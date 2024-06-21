// eslint-disable-next-line import/no-extraneous-dependencies
import { Menu, MenuItem } from '@electron/remote';

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

const recentMenuUpdater = {
  update() {
    const recentFiles = storage.get('recent_files') || [];
    const recentMenu = Menu.getApplicationMenu().items.filter((i) => i.id === '_file')[0].submenu.items.filter((i) => i.id === 'RECENT')[0].submenu;
    recentMenu.items = [];
    // @ts-expect-error clear is thought to be not existing but actually exist
    recentMenu.clear();
    recentFiles.forEach((filePath) => {
      let label = filePath;
      if (window.os !== 'Windows') {
        label = filePath.replace(':', '/');
      }
      recentMenu.append(new MenuItem({
        id: label,
        label,
        click: async () => {
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
                svgCanvas.setHasUnsavedChange(false);
              } finally {
                Alert.popById('load-recent');
              }
            } else {
              Alert.popUp({
                id: 'load-recent',
                type: AlertConstants.SHOW_POPUP_ERROR,
                message: i18n.lang.topmenu.file.path_not_exit,
              });
              storage.set('recent_files', storage.get('recent_files').filter((path) => path !== filePath));
              recentMenuUpdater.update();
            }
          }
        },
      }));
    });
    recentMenu.append(new MenuItem({ type: 'separator' }));
    recentMenu.append(new MenuItem({
      id: 'CLEAR_RECENT',
      label: i18n.lang.topmenu.file.clear_recent,
      click: () => {
        storage.set('recent_files', []);
        recentMenuUpdater.update();
      },
    }));
    Menu.setApplicationMenu(Menu.getApplicationMenu());
    if (window.os === 'Windows' && window.titlebar) {
      window.titlebar.updateMenu(Menu.getApplicationMenu());
    }
  },
};

communicator.on('NEW_APP_MENU', () => {
  recentMenuUpdater.update();
});

export default recentMenuUpdater as IRecentMenuUpdater;
