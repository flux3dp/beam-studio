import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';

import useStampStore from './useStampStore';

/**
 * Exports the current stamp to the canvas.
 * Chunk 1: wiring only — produces an empty batch. Chunk 2 adds the engrave + outline layers.
 */
export const exportToCanvas = async (): Promise<void> => {
  const { parsed, state } = useStampStore.getState();

  if (!parsed || !state) throw new Error('No template selected');

  const batchCmd = new history.BatchCommand('Export Stamp');

  if (!batchCmd.isEmpty()) undoManager.addCommandToHistory(batchCmd);
};
