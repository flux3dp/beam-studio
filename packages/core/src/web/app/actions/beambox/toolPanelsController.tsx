import React from 'react';

import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import BeamboxGlobalInteraction from '@core/app/actions/beambox/beambox-global-interaction';
import ToolPanels from '@core/app/views/beambox/ToolPanels/ToolPanels';

export type ToolPanelType = 'gridArray' | 'nest' | 'offset' | 'unknown';

class ToolPanelsController {
  isVisible: boolean;

  type: ToolPanelType;

  data: { distance: { dx: number; dy: number }; rowcolumn: { column: number; row: number } };

  root: null | Root;

  constructor() {
    this.isVisible = false;
    this.type = 'unknown';
    this.data = {
      distance: {
        dx: 0,
        dy: 0,
      },
      rowcolumn: {
        column: 1,
        row: 1,
      },
    };
  }

  setVisibility = (isVisible) => {
    this.isVisible = isVisible;

    if (isVisible) {
      BeamboxGlobalInteraction.onObjectFocus();
    } else {
      BeamboxGlobalInteraction.onObjectBlur();
    }
  };

  setType = (type: ToolPanelType) => {
    this.type = type;
  };

  createRoot = () => {
    if (!this.root && document.getElementById('tool-panels-placeholder')) {
      this.root = createRoot(document.getElementById('tool-panels-placeholder'));
    }
  };

  render = () => {
    if (this.isVisible) {
      this.createRoot();
      this.root?.render(<ToolPanels data={this.data} type={this.type} unmount={this.unmount} />);
    } else {
      this.unmount();
    }
  };

  unmount = () => {
    this.isVisible = false;
    this.root?.unmount();
    this.root = null;
  };
}

const instance = new ToolPanelsController();

export default instance;
