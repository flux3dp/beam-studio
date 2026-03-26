import useLayerStore from '@core/app/stores/layer/layerStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import shortcuts, { isFocusingOnInputs } from '@core/helpers/shortcuts';
import type { HistoryActionOptions, IBatchCommand, ICommand } from '@core/interfaces/IHistory';

import undoManager from './undoManager';

interface Options {
  checkFocus?: boolean;
  checkShortCutsScope?: boolean;
}

const undo = ({ checkFocus = true, checkShortCutsScope = true }: Options = {}): void => {
  if (checkShortCutsScope && !shortcuts.isInBaseScope()) return;

  if (checkFocus && isFocusingOnInputs()) {
    try {
      document.execCommand('undo');
    } catch (error) {
      // execCommand may throw error in some browsers, just catch it to avoid breaking undo function
      console.warn('execCommand undo failed', error);
    }

    return;
  }

  const res = undoManager.undo();

  if (res) {
    useLayerStore.getState().forceUpdate();
    currentFileManager.setHasUnsavedChanges(true);
  }
};

const redo = ({ checkFocus = true, checkShortCutsScope = true }: Options = {}): void => {
  if (checkShortCutsScope && !shortcuts.isInBaseScope()) return;

  if (checkFocus && isFocusingOnInputs()) {
    try {
      document.execCommand('redo');
    } catch (error) {
      // execCommand may throw error in some browsers, just catch it to avoid breaking redo function
      console.warn('execCommand redo failed', error);
    }

    return;
  }

  const res = undoManager.redo();

  if (res) {
    useLayerStore.getState().forceUpdate();
    currentFileManager.setHasUnsavedChanges(true);
  }
};

export const handleHistoryActionOptions = (
  cmd: ICommand,
  { addToHistory = true, parentCmd }: HistoryActionOptions = {},
) => {
  if (!cmd) return;

  if ((cmd as IBatchCommand).isEmpty && (cmd as IBatchCommand).isEmpty()) return;

  if (parentCmd) parentCmd.addSubCommand(cmd);
  else if (addToHistory) undoManager.addCommandToHistory(cmd);
};

export default {
  redo,
  undo,
};
