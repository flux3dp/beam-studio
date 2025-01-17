import { getLayerElementByName } from 'helpers/layer/layer-helper';

const checkPwmImages = (layerNames: string[]): boolean => layerNames.some((layerName: string) => {
  const layer = getLayerElementByName(layerName);
  if (!layer) return false;
  const images = layer.querySelectorAll('image[data-pwm="1"]');
  return images.length > 0;
});

export default checkPwmImages;
