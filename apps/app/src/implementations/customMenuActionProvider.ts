import windowLocationReload from '@core/app/actions/windowLocation';
import viewMenu from '@core/helpers/menubar/view';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { ICustomMenuActionProvider } from '@core/interfaces/ICustomMenuActionProvider';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { changeMenuItemChecked } from '../electron-menubar-helper';

import ElectronUpdater from './electron-updater';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export default {
  getCustomMenuActions() {
    return {
      ANTI_ALIASING: () => {
        const newValue = viewMenu.toggleAntiAliasing();

        changeMenuItemChecked(['ANTI_ALIASING'], newValue);
      },
      AUTO_ALIGN: () => {
        const toggleAutoAlign = svgCanvas.toggleAutoAlign();

        changeMenuItemChecked(['AUTO_ALIGN'], toggleAutoAlign);
      },
      RELOAD_APP: () => windowLocationReload(),
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
      SWITCH_VERSION: () => ElectronUpdater.switchVersion(),
      UPDATE_BS: () => ElectronUpdater.checkForUpdate(),
      ZOOM_WITH_WINDOW: () => {
        const zoomWithWindow = viewMenu.toggleZoomWithWindow();

        changeMenuItemChecked(['ZOOM_WITH_WINDOW'], zoomWithWindow);
      },
    };
  },
} as ICustomMenuActionProvider;
