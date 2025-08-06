import history from '@core/app/svgedit/history/history';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import undoManager from '../../../history/undoManager';

import { copyElements } from './copy';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const cutElements = async (elems: Element[]): Promise<void> => {
  const batchCommand = new history.BatchCommand('Cut Elements');

  await copyElements(elems);

  const command = deleteElements(elems, true);

  if (command && !command.isEmpty()) {
    batchCommand.addSubCommand(command);
    undoManager.addCommandToHistory(batchCommand);
  }
};

export const cutSelectedElements = async (): Promise<void> => {
  const selectedElements = svgCanvas.getSelectedWithoutTempGroup();

  await cutElements(selectedElements);
};
