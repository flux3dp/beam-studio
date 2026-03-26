import useLayerStore from '@core/app/stores/layer/layerStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import shortcuts from '@core/helpers/shortcuts';

import textActions from '../text/textactions';

import undoManager from './undoManager';

interface Options {
  checkActiveElement?: boolean;
  checkShortCutsScope?: boolean;
}

const getIsFocusingInput = (): boolean => {
  const textInput = document.getElementById('text') as HTMLInputElement;
  const activeElement = document.activeElement as HTMLElement;

  if (
    (activeElement === textInput && textActions.isEditing) ||
    ['input', 'textarea'].includes(activeElement?.tagName.toLowerCase())
  ) {
    return true;
  }

  return false;
};

const undo = ({ checkActiveElement = true, checkShortCutsScope = true }: Options = {}): void => {
  if (checkShortCutsScope && !shortcuts.isInBaseScope()) return;

  if (checkActiveElement) {
    const isFocusingInput = getIsFocusingInput();

    if (isFocusingInput) {
      try {
        document.execCommand('undo');
      } catch (error) {
        // execCommand may throw error in some browsers, just catch it to avoid breaking undo function
        console.warn('execCommand undo failed', error);
      }

      return;
    }
  }

  const res = undoManager.undo();

  if (res) {
    useLayerStore.getState().forceUpdate();
    currentFileManager.setHasUnsavedChanges(true);
  }
};

const redo = ({ checkActiveElement = true, checkShortCutsScope = true }: Options = {}): void => {
  if (checkShortCutsScope && !shortcuts.isInBaseScope()) return;

  if (checkActiveElement) {
    const isFocusingInput = getIsFocusingInput();

    if (isFocusingInput) {
      try {
        document.execCommand('redo');
      } catch (error) {
        // execCommand may throw error in some browsers, just catch it to avoid breaking redo function
        console.warn('execCommand redo failed', error);
      }

      return;
    }
  }

  const res = undoManager.redo();

  if (res) {
    useLayerStore.getState().forceUpdate();
    currentFileManager.setHasUnsavedChanges(true);
  }
};

export default {
  redo,
  undo,
};
