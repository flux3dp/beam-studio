import history from '@core/app/svgedit/history/history';
import { moveElements } from '@core/app/svgedit/operations/move';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import undoManager from '../../../history/undoManager';

import { copyElements } from './copy';
import { pasteElements } from './paste';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

/**
 * Create deep DOM copies (clones) of all selected elements
 * @param dx dx of the cloned elements
 * @param dy dy of the cloned elements
 */
export const cloneElements = async (
  elements: Element[],
  dx: number | number[],
  dy: number | number[],
  {
    addToHistory = true,
    callChangOnMove = true,
    parentCmd,
    selectElement = true,
  }: { addToHistory?: boolean; callChangOnMove?: boolean; parentCmd?: IBatchCommand; selectElement?: boolean } = {},
): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  const batchCmd = new history.BatchCommand('Clone elements');

  await copyElements(elements);

  const pasteRes = await pasteElements({ isSubCmd: true, selectElement, type: 'inPlace' });

  if (!pasteRes) return null;

  const { cmd: pasteCommand, elems } = pasteRes;

  if (pasteCommand && !pasteCommand.isEmpty()) {
    batchCmd.addSubCommand(pasteCommand);
  }

  const moveCommand = moveElements(dx, dy, elems, false, !callChangOnMove);

  if (moveCommand && !moveCommand.isEmpty()) {
    batchCmd.addSubCommand(moveCommand);
  }

  if (!batchCmd.isEmpty()) {
    if (parentCmd) parentCmd.addSubCommand(batchCmd);
    else if (addToHistory) undoManager.addCommandToHistory(batchCmd);
  }

  return { cmd: batchCmd, elems };
};

/**
 * Create deep DOM copies (clones) of all selected elements
 * @param dx dx of the cloned elements
 * @param dy dy of the cloned elements
 */
export const cloneSelectedElements = async (
  dx: number | number[],
  dy: number | number[],
  options: {
    addToHistory?: boolean;
    callChangOnMove?: boolean;
    parentCmd?: IBatchCommand;
    selectElement?: boolean;
  } = {
    addToHistory: true,
    callChangOnMove: true,
    selectElement: true,
  },
): Promise<null | { cmd: IBatchCommand; elems: Element[] }> => {
  const selectedElems = svgCanvas.getSelectedWithoutTempGroup();
  const clonedResult = await cloneElements(selectedElems, dx, dy, options);

  svgCanvas.tempGroupSelectedElements();

  return clonedResult;
};
