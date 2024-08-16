import viewMenu from 'helpers/menubar/view';
import windowLocationReload from 'app/actions/windowLocation';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { ICustomMenuActionProvider } from 'interfaces/ICustomMenuActionProvider';

import ElectronUpdater from './electron-updater';
import { updateCheckbox } from '../electron-menubar-helper';

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
        updateCheckbox(['_view', 'ALIGN_TO_EDGES'], isBezierPathAlignToEdge);
      },
      ANTI_ALIASING: () => {
        const newValue = viewMenu.toggleAntiAliasing();
        updateCheckbox(['_view', 'ANTI_ALIASING'], newValue);
      },
      SHOW_GRIDS: () => {
        const showGrid = viewMenu.toggleGrid();
        updateCheckbox(['_view', 'SHOW_GRIDS'], showGrid);
      },
      SHOW_LAYER_COLOR: () => {
        const isUsingLayerColor = viewMenu.toggleLayerColor();
        updateCheckbox(['_view', 'SHOW_LAYER_COLOR'], isUsingLayerColor);
      },
      SHOW_RULERS: () => {
        const shouldShowRulers = viewMenu.toggleRulers();
        updateCheckbox(['_view', 'SHOW_RULERS'], shouldShowRulers);
      },
      ZOOM_WITH_WINDOW: () => {
        const zoomWithWindow = viewMenu.toggleZoomWithWindow();
        updateCheckbox(['_view', 'ZOOM_WITH_WINDOW'], zoomWithWindow);
      },
    };
  },
} as ICustomMenuActionProvider;
