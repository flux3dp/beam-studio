import windowLocationReload from '@core/app/actions/windowLocation';
import viewMenu from '@core/helpers/menubar/view';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { ICustomMenuActionProvider } from '@core/interfaces/ICustomMenuActionProvider';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import ElectronUpdater from './electron-updater';
import menu from './menu';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export default {
  getCustomMenuActions() {
    return {
      ANTI_ALIASING: () => {
        const newValue = viewMenu.toggleAntiAliasing();

        menu.changeMenuItemStatus(['ANTI_ALIASING'], 'checked', newValue);
      },
      AUTO_ALIGN: () => {
        const toggleAutoAlign = svgCanvas.toggleAutoAlign();

        menu.changeMenuItemStatus(['AUTO_ALIGN'], 'checked', toggleAutoAlign);
      },
      RELOAD_APP: () => windowLocationReload(),
      SHOW_GRIDS: () => {
        const showGrid = viewMenu.toggleGrid();

        menu.changeMenuItemStatus(['SHOW_GRIDS'], 'checked', showGrid);
      },
      SHOW_LAYER_COLOR: () => {
        const isUsingLayerColor = viewMenu.toggleLayerColor();

        menu.changeMenuItemStatus(['SHOW_LAYER_COLOR'], 'checked', isUsingLayerColor);
      },
      SHOW_RULERS: () => {
        const shouldShowRulers = viewMenu.toggleRulers();

        menu.changeMenuItemStatus(['SHOW_RULERS'], 'checked', shouldShowRulers);
      },
      SWITCH_VERSION: () => ElectronUpdater.switchVersion(),
      UPDATE_BS: () => ElectronUpdater.checkForUpdate(),
      ZOOM_WITH_WINDOW: () => {
        const zoomWithWindow = viewMenu.toggleZoomWithWindow();

        menu.changeMenuItemStatus(['ZOOM_WITH_WINDOW'], 'checked', zoomWithWindow);
      },
    };
  },
} as ICustomMenuActionProvider;
