import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import grid from '@core/app/actions/canvas/grid';
import workareaManager from '@core/app/svgedit/workarea';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const updateAntiAliasing = (on: boolean): void => {
  const svgContent = document.getElementById('svgcontent');

  if (svgContent) {
    svgContent.style.shapeRendering = on ? '' : 'optimizeSpeed';
  }
};

const toggleLayerColor = (): boolean => {
  const isUsingLayerColor = !svgCanvas.isUsingLayerColor;

  svgCanvas.isUsingLayerColor = isUsingLayerColor;
  BeamboxPreference.write('use_layer_color', isUsingLayerColor);

  const layers = Array.from(document.querySelectorAll('g.layer'));

  layers.forEach((layer) => {
    updateLayerColor(layer as SVGGElement);
  });

  return isUsingLayerColor;
};

const toggleGrid = (): boolean => {
  const newVal = !BeamboxPreference.read('show_grids');

  BeamboxPreference.write('show_grids', newVal);
  grid.toggleGrids();

  return newVal;
};

const toggleRulers = (): boolean => {
  const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
  const shouldShowRulers = !BeamboxPreference.read('show_rulers');

  BeamboxPreference.write('show_rulers', shouldShowRulers);
  canvasEventEmitter.emit('update-ruler');

  return shouldShowRulers;
};

const toggleZoomWithWindow = (): boolean => {
  workareaManager.resetView();

  const zoomWithWindow = !BeamboxPreference.read('zoom_with_window');

  if (zoomWithWindow) {
    window.removeEventListener('resize', workareaManager.resetView);
    window.addEventListener('resize', workareaManager.resetView);
  } else {
    window.removeEventListener('resize', workareaManager.resetView);
  }

  BeamboxPreference.write('zoom_with_window', zoomWithWindow);

  return zoomWithWindow;
};

const toggleAntiAliasing = (): boolean => {
  const newValue = !BeamboxPreference.read('anti-aliasing');

  updateAntiAliasing(newValue);
  BeamboxPreference.write('anti-aliasing', newValue);

  return newValue;
};

export default {
  toggleAntiAliasing,
  toggleGrid,
  toggleLayerColor,
  toggleRulers,
  toggleZoomWithWindow,
  updateAntiAliasing,
};
