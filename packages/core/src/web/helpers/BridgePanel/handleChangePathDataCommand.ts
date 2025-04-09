import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;
const { svgedit } = window;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export function handleChangePathDataCommand(
  element: SVGPathElement,
  d: string,
  batchCommand = new history.BatchCommand('Bridge Panel'),
): void {
  element.setAttribute('d', d);
  // to normalize & upperCase the path data
  element.setAttribute('d', svgedit.utilities.convertPath(element));

  const changes = { d };
  const command = new history.ChangeElementCommand(element, changes);

  batchCommand.addSubCommand(command);
  undoManager.addCommandToHistory(batchCommand);

  svgCanvas.selectOnly([element], true);
}
