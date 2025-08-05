import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import workareaManager from '@core/app/svgedit/workarea';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
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

const updateUseLayerColor = (): void => {
  const layers = Array.from(document.querySelectorAll('g.layer'));

  layers.forEach((layer) => {
    updateLayerColor(layer as SVGGElement);
  });
};
const initUseLayerColor = (): void => {
  useGlobalPreferenceStore.subscribe((state) => state.use_layer_color, updateUseLayerColor);
};

initUseLayerColor();

const toggleLayerColor = (): boolean => {
  const { set, use_layer_color: value } = useGlobalPreferenceStore.getState();
  const newValue = !value;

  set('use_layer_color', newValue);

  return newValue;
};

const toggleGrid = (): boolean => {
  const { set, show_grids: value } = useGlobalPreferenceStore.getState();
  const newVal = !value;

  set('show_grids', newVal);

  return newVal;
};

const toggleRulers = (): boolean => {
  const { set, show_rulers: value } = useGlobalPreferenceStore.getState();
  const newVal = !value;

  set('show_rulers', newVal);

  return newVal;
};

const updateZoomWithWindow = (): void => {
  const zoomWithWindow = useGlobalPreferenceStore.getState()['zoom_with_window'];

  if (zoomWithWindow) {
    window.removeEventListener('resize', workareaManager.resetView);
    window.addEventListener('resize', workareaManager.resetView);
  } else {
    window.removeEventListener('resize', workareaManager.resetView);
  }
};
const initZoomWithWindow = (): void => {
  updateZoomWithWindow();
  useGlobalPreferenceStore.subscribe((state) => state['zoom_with_window'], updateZoomWithWindow);
};

initZoomWithWindow();

const toggleZoomWithWindow = (): boolean => {
  workareaManager.resetView();

  const { set, zoom_with_window: value } = useGlobalPreferenceStore.getState();
  const newValue = !value;

  set('zoom_with_window', newValue);

  return newValue;
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
