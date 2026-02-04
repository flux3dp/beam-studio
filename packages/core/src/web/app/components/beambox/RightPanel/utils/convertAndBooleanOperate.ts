import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { doBooleanOperationOnSelected } from '@core/app/svgedit/operations/booleanOperation';
import { convertElementsToPathInTempGroup } from '@core/helpers/convertElementsToPathInTempGroup';

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

  doBooleanOperationOnSelected(operation, { parentCmd: parentCommand });
  undoManager.addCommandToHistory(parentCommand);
};
