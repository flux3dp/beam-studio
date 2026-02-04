import history from '@core/app/svgedit/history/history';
import findDefs from '@core/app/svgedit/utils/findDef';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import undoManager from '../../../history/undoManager';
import { clipboardCore } from '../singleton';

import { updateSymbolStyle } from './updateSymbolStyle';

const { svgedit } = window;

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const pasteRef = async (
  useElement: SVGUseElement,
  { addToHistory = true, parentCmd }: { addToHistory?: boolean; parentCmd?: IBatchCommand } = {},
): Promise<void> => {
  const batchCmd = new history.BatchCommand('Paste Ref');
  const drawing = svgCanvas.getCurrentDrawing();
  const symbolId = svgedit.utilities.getHref(useElement);
  const refElement = clipboardCore.getRefFromClipboard(symbolId)!;
  const copiedRef = refElement.cloneNode(true) as SVGSymbolElement;

  copiedRef.id = (drawing as any).getNextId();
  copiedRef.setAttribute('data-image-symbol', `${copiedRef.id}_image`);
  updateSymbolStyle(copiedRef, refElement.id);

  const defs = findDefs();

  defs.appendChild(copiedRef);
  batchCmd.addSubCommand(new history.InsertElementCommand(copiedRef));
  useElement.setAttribute('xlink:href', `#${copiedRef.id}`);

  const imageSymbol = await symbolMaker.makeImageSymbol(copiedRef);

  if (imageSymbol) {
    batchCmd.addSubCommand(new history.InsertElementCommand(imageSymbol));
    useElement.setAttribute('xlink:href', `#${imageSymbol.id}`);
    // Re-render to apply color, scale, etc.
    await symbolMaker.reRenderImageSymbol(useElement);
  }

  if (parentCmd) {
    parentCmd.addSubCommand(batchCmd);
  } else if (addToHistory) {
    undoManager.addCommandToHistory(batchCmd);
  }

  updateElementColor(useElement);
};

export const handlePastedRef = async (copy: SVGGElement, opts: { parentCmd?: IBatchCommand } = {}): Promise<void> => {
  const promises = Array.of<Promise<void>>();
  const uses = Array.from(copy.querySelectorAll('use'));

  if (copy.tagName === 'use') {
    uses.push(copy as SVGUseElement);
  }

  uses.forEach((use: SVGUseElement) => {
    clipboardCore.addRefToClipboard(use);
    promises.push(pasteRef(use, { parentCmd: opts?.parentCmd }));
  });

  const passThroughObjects = Array.from(copy.querySelectorAll('[data-pass-through]')) as SVGGElement[];

  if (copy.getAttribute('data-pass-through')) passThroughObjects.push(copy);

  passThroughObjects.forEach((element: SVGGElement) => {
    const clipPath = element.querySelector(':scope > clipPath');

    if (clipPath) {
      (element.childNodes as NodeListOf<SVGGraphicsElement>).forEach((child: SVGGraphicsElement) => {
        if (child.getAttribute('clip-path')?.startsWith('url')) {
          child.setAttribute('clip-path', `url(#${clipPath.id})`);
        }
      });
    }
  });

  const textPathGroups = Array.from(copy.querySelectorAll('[data-textpath-g="1"]')) as SVGGElement[];

  if (copy.getAttribute('data-textpath-g') === '1') textPathGroups.push(copy);

  textPathGroups.forEach((element: SVGGElement) => {
    const newTextPath = element.querySelector('textPath');
    const newPath = element.querySelector('path');

    newTextPath?.setAttribute('href', `#${newPath?.id}`);
  });

  await Promise.allSettled(promises);
};
