import layerManager from '@core/app/svgedit/layer/layerManager';

const checkPwmImages = (layerNames: string[]): boolean =>
  layerNames.some((layerName: string) => {
    const layer = layerManager.getLayerElementByName(layerName);

    if (!layer) {
      return false;
    }

    const images = layer.querySelectorAll('image[data-pwm="1"]');

    return images.length > 0;
  });

export default checkPwmImages;
