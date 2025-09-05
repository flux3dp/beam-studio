import React, { memo, useMemo } from 'react';

import { pick } from 'remeda';
import { useShallow } from 'zustand/react/shallow';

import ZoomableTopBar, { type UndoRedoConfig } from '@core/app/components/common/ZoomableTopBar';

import { useStampMakerPanelStore } from '../../store';

interface Props {
  handleReset: () => void;
  handleZoomByScale: (scale: number) => void;
  zoomScale: number;
}

function UnmemorizedTopBar({ handleReset, handleZoomByScale, zoomScale }: Props): React.JSX.Element {
  const {
    history: { index, operations },
    redo,
    undo,
  } = useStampMakerPanelStore(useShallow(pick(['history', 'redo', 'undo'])));

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

const TopBar = memo(UnmemorizedTopBar);

export default TopBar;
