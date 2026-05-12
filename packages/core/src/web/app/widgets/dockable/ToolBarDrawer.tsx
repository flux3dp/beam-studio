import React, { memo, useCallback } from 'react';

import { pick } from 'remeda';
import { useShallow } from 'zustand/react/shallow';

import { CanvasMode } from '@core/app/constants/canvasMode';
import type { CanvasDrawerMode } from '@core/app/stores/canvas/canvasStore';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import type { Props } from '@core/app/widgets/Drawer';
import Drawer from '@core/app/widgets/Drawer';

import { getDrawerContainer } from './utils';

type ToolBarDrawerProps = Omit<Props, 'getContainer' | 'isOpen' | 'onClose'> & {
  mode: CanvasDrawerMode;
};

const ToolBarDrawer = memo(({ mode, ...props }: ToolBarDrawerProps) => {
  const {
    drawerMode,
    mode: canvasMode,
    setDrawerMode,
  } = useCanvasStore(useShallow(pick(['drawerMode', 'setDrawerMode', 'mode'])));
  const onClose = useCallback(() => setDrawerMode('none'), [setDrawerMode]);

  return (
    <Drawer
      getContainer={getDrawerContainer}
      isOpen={canvasMode === CanvasMode.Draw && drawerMode === mode}
      onClose={onClose}
      {...props}
    />
  );
});

export default ToolBarDrawer;
