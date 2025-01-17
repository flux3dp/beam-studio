import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import BeamboxGlobalInteraction from 'app/actions/beambox/beambox-global-interaction';
import ToolPanels from 'app/views/beambox/ToolPanels/ToolPanels';

export type ToolPanelType = 'unknown' | 'gridArray' | 'offset' | 'nest';

class ToolPanelsController {
  isVisible: boolean;

  type: ToolPanelType;

  data: { rowcolumn: { row: number; column: number }; distance: { dx: number; dy: number } };

  root: Root | null;

  constructor() {
    this.isVisible = false;
    this.type = 'unknown';
    this.data = {
      rowcolumn: {
        row: 1,
        column: 1,
      },
      distance: {
        dx: 0,
        dy: 0,
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
      this.root?.render(<ToolPanels type={this.type} data={this.data} unmount={this.unmount} />);
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
