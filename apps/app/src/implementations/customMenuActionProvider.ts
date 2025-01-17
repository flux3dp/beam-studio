import viewMenu from 'helpers/menubar/view';
import windowLocationReload from 'app/actions/windowLocation';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { ICustomMenuActionProvider } from 'interfaces/ICustomMenuActionProvider';

import ElectronUpdater from './electron-updater';
import { changeMenuItemChecked } from '../electron-menubar-helper';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export default {
  getCustomMenuActions() {
    return {
      RELOAD_APP: () => windowLocationReload(),
      SWITCH_VERSION: () => ElectronUpdater.switchVersion(),
      UPDATE_BS: () => ElectronUpdater.checkForUpdate(),
      ALIGN_TO_EDGES: () => {
        const isBezierPathAlignToEdge = svgCanvas.toggleBezierPathAlignToEdge();
        changeMenuItemChecked(['ALIGN_TO_EDGES'], isBezierPathAlignToEdge);
      },
      ANTI_ALIASING: () => {
        const newValue = viewMenu.toggleAntiAliasing();
        changeMenuItemChecked(['ANTI_ALIASING'], newValue);
      },
      SHOW_GRIDS: () => {
        const showGrid = viewMenu.toggleGrid();
        changeMenuItemChecked(['SHOW_GRIDS'], showGrid);
      },
      SHOW_LAYER_COLOR: () => {
        const isUsingLayerColor = viewMenu.toggleLayerColor();
        changeMenuItemChecked(['SHOW_LAYER_COLOR'], isUsingLayerColor);
      },
      SHOW_RULERS: () => {
        const shouldShowRulers = viewMenu.toggleRulers();
        changeMenuItemChecked(['SHOW_RULERS'], shouldShowRulers);
      },
      ZOOM_WITH_WINDOW: () => {
        const zoomWithWindow = viewMenu.toggleZoomWithWindow();
        changeMenuItemChecked(['ZOOM_WITH_WINDOW'], zoomWithWindow);
      },
    };
  },
} as ICustomMenuActionProvider;
