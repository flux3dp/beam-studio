import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { clipboardCore } from '../singleton';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export const copyElements = async (elems: Element[]): Promise<void> => clipboardCore.copyElements(elems);

export const copySelectedElements = async (): Promise<void> => {
  const selectedElems = svgCanvas.getSelectedWithoutTempGroup();

  await copyElements(selectedElems);
  svgCanvas.tempGroupSelectedElements();
};
