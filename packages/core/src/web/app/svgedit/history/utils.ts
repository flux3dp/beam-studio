import currentFileManager from 'app/svgedit/currentFileManager';
import LayerPanelController from 'app/views/beambox/Right-Panels/contexts/LayerPanelController';

import undoManager from './undoManager';

const undo = (): void => {
  const res = undoManager.undo();
  if (res) {
    LayerPanelController.updateLayerPanel();
    currentFileManager.setHasUnsavedChanges(true);
  }
};

const redo = (): void => {
  const res = undoManager.redo();
  if (res) {
    LayerPanelController.updateLayerPanel();
    currentFileManager.setHasUnsavedChanges(true);
  }
};

export default {
  undo,
  redo,
};
