import { create } from 'zustand';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import selectionManager from '@core/app/svgedit/selection';
import dialog from '@core/implementations/dialog';

/**
 * Dev-only: an fcode file opened from disk that Path Preview shows instead of
 * converting the canvas. Cleared when the preview closes.
 */
export interface ExternalFcode {
  buffer: ArrayBuffer;
  name: string;
}

interface ExternalFcodeStore {
  clear: () => void;
  file: ExternalFcode | null;
}

export const useExternalFcodeStore = create<ExternalFcodeStore>((set) => ({
  clear: () => set({ file: null }),
  file: null,
}));

/** Pick an .fc file and preview it, entering Path Preview if it is not open yet. */
export const openExternalFcode = async (): Promise<void> => {
  const file = await dialog.getFileFromDialog({ filters: [{ extensions: ['fc'], name: 'FCode' }] });

  if (!file) return;

  // the Electron dialog names the File by its full path
  const name = ((file as File).name ?? 'task.fc').split(/[\\/]/).pop()!;

  useExternalFcodeStore.setState({ file: { buffer: await file.arrayBuffer(), name } });

  const { mode, togglePathPreview } = useCanvasStore.getState();

  if (mode !== CanvasMode.PathPreview) {
    selectionManager.clearSelection();
    togglePathPreview();
  }
};
