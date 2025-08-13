import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { clipboardCore } from '../singleton';
import { useClipboardStore } from '../useClipboardStore';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export const copyElements = async (elems: Element[]): Promise<void> => {
  await clipboardCore.copyElements(elems);

  const initialSignature = elems.map((el) => el.outerHTML.replace(/\s*id="[^"]*"/g, '')).join('');

  useClipboardStore.getState().reset(initialSignature);
};

export const copySelectedElements = async (): Promise<void> => {
  const selectedElems = svgCanvas.getSelectedWithoutTempGroup();

  await copyElements(selectedElems);

  svgCanvas.tempGroupSelectedElements();
};
