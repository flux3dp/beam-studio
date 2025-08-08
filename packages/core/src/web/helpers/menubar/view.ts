import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import workareaManager from '@core/app/svgedit/workarea';
import updateLayerColor from '@core/helpers/color/updateLayerColor';

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

const updateZoomWithWindow = (value: boolean): void => {
  if (value) {
    window.removeEventListener('resize', workareaManager.resetView);
    window.addEventListener('resize', workareaManager.resetView);
  } else {
    window.removeEventListener('resize', workareaManager.resetView);
  }
};
const initZoomWithWindow = (): void => {
  updateZoomWithWindow(useGlobalPreferenceStore.getState().zoom_with_window);
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

const updateAntiAliasing = (value: boolean): void => {
  const svgContent = document.getElementById('svgcontent');

  if (!svgContent) return;

  svgContent.style.shapeRendering = value ? '' : 'optimizeSpeed';
};

const toggleAntiAliasing = (): boolean => {
  const { 'anti-aliasing': value, set } = useGlobalPreferenceStore.getState();
  const newValue = !value;

  set('anti-aliasing', newValue);

  return newValue;
};

const initAntiAliasing = (): void => {
  updateAntiAliasing(useGlobalPreferenceStore.getState()['anti-aliasing']);
  useGlobalPreferenceStore.subscribe((state) => state['anti-aliasing'], updateAntiAliasing);
};

export default {
  initAntiAliasing,
  toggleAntiAliasing,
  toggleGrid,
  toggleLayerColor,
  toggleRulers,
  toggleZoomWithWindow,
};
