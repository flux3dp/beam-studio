import React, { useCallback } from 'react';

import { pick } from 'remeda';
import { useShallow } from 'zustand/shallow';

import { ElementPanelProvider } from '@core/app/contexts/ElementPanelContext';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { getDrawerContainer as getDockableDrawerContainer } from '@core/app/widgets/dockable/utils';

import ElementPanelContent from './ElementPanelContent';
import { importElementToCanvas } from './utils/importElement';

const ElementPanel = () => {
  const { drawerMode, setDrawerMode } = useCanvasStore(useShallow(pick(['drawerMode', 'setDrawerMode'])));
  const onClose = useCallback(() => setDrawerMode('none'), [setDrawerMode]);

  return (
    <ElementPanelProvider
      onClose={onClose}
      onElementSelect={importElementToCanvas}
      open={drawerMode === 'element-panel'}
    >
      <ElementPanelContent getDrawerContainer={getDockableDrawerContainer} />
    </ElementPanelProvider>
  );
};

export default ElementPanel;
