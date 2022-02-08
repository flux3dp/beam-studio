// eslint-disable-next-line import/no-extraneous-dependencies
import electron from 'electron';

import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import BeamFileHelper from 'helpers/beam-file-helper';
import FileExportHelper from 'helpers/file-export-helper';
import i18n from 'helpers/i18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IRecentMenuUpdater } from 'interfaces/IRecentMenuUpdater';

import fs from './fileSystem';
import storage from './storage';

let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

const { Menu, MenuItem } = electron.remote;

const recentMenuUpdater = {
  update() {
    const recentFiles = storage.get('recent_files') || [];
    const recentMenu = Menu.getApplicationMenu().items.filter((i) => i.id === '_file')[0].submenu.items.filter((i) => i.id === 'RECENT')[0].submenu;
    recentMenu.items = [];
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
              let fileName;
              if (window.os === 'Windows') {
                fileName = filePath.split('\\');
              } else {
                fileName = filePath.split('/');
              }
              Alert.popUp({
                id: 'load-recent',
                message: i18n.lang.beambox.popup.loading_image,
              });
              fileName = fileName[fileName.length - 1];
              fileName = fileName.slice(0, fileName.lastIndexOf('.')).replace(':', '/');
              svgCanvas.setLatestImportFileName(fileName);
              svgCanvas.currentFilePath = filePath;
              svgCanvas.updateRecentFiles(filePath);
              try {
                svgCanvas.clearSelection();
                const fetchPath = filePath.split('/').map((seg) => encodeURIComponent(seg)).join('/');
                if (filePath.endsWith('beam')) {
                  const resp = await fetch(fetchPath);
                  const blob = await resp.blob();
                  await BeamFileHelper.readBeam(blob as File);
                } else if (filePath.endsWith('bvg')) {
                  const resp = await fetch(fetchPath);
                  const blob = await resp.blob();
                  svgEditor.importBvg(blob);
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

export default recentMenuUpdater as IRecentMenuUpdater;
