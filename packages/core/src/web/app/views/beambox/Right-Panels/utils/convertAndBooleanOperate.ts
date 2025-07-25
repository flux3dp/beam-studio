import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { convertElementsToPathInTempGroup } from '@core/helpers/convertElementsToPathInTempGroup';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export const convertAndBooleanOperate = async ({
  element,
  operation,
}: {
  element: SVGGElement;
  operation: 'diff' | 'intersect' | 'union' | 'xor';
}): Promise<void> => {
  const parentCommand = new history.BatchCommand(
    `${operation.charAt(0).toUpperCase() + operation.slice(1)} Selected Elements`,
  );

  await convertElementsToPathInTempGroup({ element, parentCommand });

  const command = svgCanvas.booleanOperationSelectedElements(operation, true);

  parentCommand.addSubCommand(command);
  undoManager.addCommandToHistory(parentCommand);
};
