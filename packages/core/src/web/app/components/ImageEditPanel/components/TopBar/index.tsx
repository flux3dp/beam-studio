import React, { memo, useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import type { UndoRedoConfig } from '@core/app/components/common/ZoomableTopBar';
import ZoomableTopBar from '@core/app/components/common/ZoomableTopBar';

import { useImageEditPanelStore } from '../../store';

interface Props {
  handleReset: () => void;
  handleZoomByScale: (scale: number) => void;
  zoomScale: number;
}

function TopBar({ handleReset, handleZoomByScale, zoomScale }: Props): React.JSX.Element {
  const {
    history: { index, operations },
    redo,
    undo,
  } = useImageEditPanelStore(useShallow((s) => ({ history: s.history, redo: s.redo, undo: s.undo })));

  const undoRedoConfig: UndoRedoConfig = useMemo(
    () => ({ onRedo: redo, onUndo: undo, redoable: index < operations.length, undoable: index > 0 }),
    [index, operations.length, redo, undo],
  );

  return (
    <ZoomableTopBar
      handleReset={handleReset}
      handleZoomByScale={handleZoomByScale}
      undoRedo={undoRedoConfig}
      zoomScale={zoomScale}
    />
  );
}

const MemorizedTopBar = memo(TopBar);

export default MemorizedTopBar;
