import history from '@core/app/svgedit/history/history';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import selectionManager from '@core/app/svgedit/selection';

import undoManager from '../../../history/undoManager';

import { copyElements } from './copy';

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
  const selectedElements = selectionManager.getSelectedElements(true);

  await cutElements(selectedElements);
};
