import useLayerStore from '@core/app/stores/layer/layerStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';

import undoManager from './undoManager';

const undo = (): void => {
  const res = undoManager.undo();

  if (res) {
    useLayerStore.getState().forceUpdate();
    currentFileManager.setHasUnsavedChanges(true);
  }
};

const redo = (): void => {
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
