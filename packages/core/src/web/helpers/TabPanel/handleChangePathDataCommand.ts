import type { BatchCommand } from '@core/app/svgedit/history/history';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;
const { svgedit } = window;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

type HandleChangePathDataCommandParams = {
  batchCommand?: BatchCommand;
  d: string;
  element: SVGPathElement;
  subCommand?: IBatchCommand;
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

  svgCanvas.selectOnly([element], true);
}
