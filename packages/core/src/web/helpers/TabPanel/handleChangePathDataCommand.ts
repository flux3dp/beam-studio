import type { BatchCommand } from '@core/app/svgedit/history/history';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import selectionManager from '@core/app/svgedit/selection';
import type { ICommand } from '@core/interfaces/IHistory';

const { svgedit } = window;

type HandleChangePathDataCommandParams = {
  batchCommand?: BatchCommand;
  d: string;
  element: SVGPathElement;
  subCommand?: ICommand;
};

export function handleChangePathDataCommand({
  batchCommand = new history.BatchCommand('Tab Panel'),
  d,
  element,
  subCommand,
}: HandleChangePathDataCommandParams): void {
  element.setAttribute('d', d);
  // to normalize & upperCase the path data
  element.setAttribute('d', svgedit.utilities.convertPath(element));

  const changes = { d };
  const command = new history.ChangeElementCommand(element, changes);

  if (subCommand) batchCommand.addSubCommand(subCommand);

  batchCommand.addSubCommand(command);
  undoManager.addCommandToHistory(batchCommand);

  selectionManager.selectOnly([element], true);
}
