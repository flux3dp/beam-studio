import React, { memo } from 'react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import type { CanvasDrawerMode } from '@core/app/stores/canvas/canvasStore';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import type { Props } from '@core/app/widgets/Drawer';
import Drawer from '@core/app/widgets/Drawer';

import { getDrawerContainer } from './utils';

type ToolBarDrawerProps = Omit<Props, 'getContainer' | 'isOpen' | 'setIsOpen'> & {
  mode: CanvasDrawerMode;
};

const ToolBarDrawer = memo(({ mode, ...props }: ToolBarDrawerProps) => {
  const { drawerMode, mode: canvasMode, setDrawerMode } = useCanvasStore();

  return (
    <Drawer
      getContainer={getDrawerContainer}
      isOpen={canvasMode === CanvasMode.Draw && drawerMode === mode}
      setIsOpen={(isOpen) => setDrawerMode(isOpen ? mode : 'none')}
      {...props}
    />
  );
});

export default ToolBarDrawer;
