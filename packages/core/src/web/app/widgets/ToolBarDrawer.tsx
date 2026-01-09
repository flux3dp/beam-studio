import { memo } from 'react';

import type { CanvasDrawerMode } from '@core/app/stores/canvas/canvasStore';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import type { Props } from '@core/app/widgets/Drawer';
import Drawer from '@core/app/widgets/Drawer';

const getContainer = () => document.getElementById('drawer-container')!;

type ToolBarDrawerProps = Omit<Props, 'getContainer' | 'isOpen' | 'setIsOpen'> & {
  mode: CanvasDrawerMode;
};

// Handle position with Dockable Layout
const ToolBarDrawer = memo(({ mode, ...props }: ToolBarDrawerProps) => {
  const { drawerMode, setDrawerMode } = useCanvasStore();

  return (
    <Drawer
      getContainer={getContainer}
      isOpen={drawerMode === mode}
      setIsOpen={(isOpen) => setDrawerMode(isOpen ? mode : 'none')}
      {...props}
    />
  );
});

export default ToolBarDrawer;
