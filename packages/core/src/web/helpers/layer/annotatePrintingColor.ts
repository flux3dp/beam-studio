import type { PrintingColors } from '@core/app/constants/color-constants';
import { colorMap } from '@core/app/constants/color-constants';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

import { getData } from './layer-config-helper';
import { getAllLayerNames, getLayerElementByName } from './layer-helper';

/**
 * Annotates the printing color of a layer for 4c printing single color layers.
 * @returns A function to revert the annotation.
 */
export const annotatePrintingColor = (): (() => void) => {
  const allLayerNames = getAllLayerNames();
  const annotatedElments: Element[] = [];

  allLayerNames.forEach((layerName) => {
    const layer = getLayerElementByName(layerName);

    if (!layer || layer.getAttribute('display') === 'none') return;

    const fullColor = getData(layer, 'fullcolor');

    if (fullColor) return;

    const layerModule = getData(layer, 'module');

    if (layerModule !== LayerModule.PRINTER_4C) return;

    const color = getData(layer, 'color');
    const colorShortName = colorMap[color as PrintingColors];

    if (!colorShortName) return;

    layer.querySelectorAll('image').forEach((image) => {
      image.setAttribute('data-color', colorShortName);
      annotatedElments.push(image);
    });
  });

  const revert = () => {
    annotatedElments.forEach((element) => {
      element.removeAttribute('data-color');
    });
  };

  return revert;
};

export default annotatePrintingColor;
