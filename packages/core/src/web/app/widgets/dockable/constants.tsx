import 'dockview-react/dist/styles/dockview.css';

import type { FloatingGroupOptions } from 'dockview-react';
import { type AddPanelOptions, Orientation, type SerializedDockview } from 'dockview-react';

import LeftPanel from '@core/app/components/beambox/LeftPanel';
import LayerPanel from '@core/app/components/beambox/RightPanel/LayerPanel';
import ObjectPanel from '@core/app/components/beambox/RightPanel/ObjectPanel';
import PathEditPanel from '@core/app/components/beambox/RightPanel/PathEditPanel';
import SvgEditor from '@core/app/components/beambox/SvgEditor/RealSvgEditor';
import layoutConstants from '@core/app/constants/layout-constants';
import type { TDynamicPanelKey } from '@core/app/stores/dockableStore';

export const rightPanelWidth = layoutConstants.rightPanelWidth;
export const maximumWidth = 520; // more than windows width * 2
export const minFloatingHeight = 200;
export const borderSize = 2;

export const components = {
  leftPanel: LeftPanel,
  rightPanelLayer: () => <LayerPanel />,
  rightPanelObject: () => <ObjectPanel />,
  rightPanelPath: PathEditPanel,
  svgEditor: SvgEditor,
};

export type TComponentKey = keyof typeof components;

// Note: keep key and id consistent
type TAddPanelOptions = AddPanelOptions & {
  component: TComponentKey;
  defaultFloatingOption: FloatingGroupOptions;
  id: TDynamicPanelKey;
};
export const panelConfigs: Record<TDynamicPanelKey, TAddPanelOptions> = {
  panelLayerControls: {
    component: 'rightPanelLayer',
    defaultFloatingOption: { position: { right: 5, top: 5 } },
    id: 'panelLayerControls',
    maximumWidth,
    minimumWidth: rightPanelWidth,
  },
  panelObjectProperties: {
    component: 'rightPanelObject',
    defaultFloatingOption: { position: { right: 10, top: 25 } },
    id: 'panelObjectProperties',
    maximumWidth,
    minimumWidth: rightPanelWidth,
  },
  panelPathEdit: {
    component: 'rightPanelPath',
    defaultFloatingOption: { position: { right: 15, top: 45 } },
    id: 'panelPathEdit',
    maximumWidth,
    minimumWidth: rightPanelWidth,
  },
};

// Note: don't change id groupTools and groupCanvas
export const defaultLayout: SerializedDockview = {
  activeGroup: 'groupControls',
  grid: {
    height: 678,
    orientation: Orientation.HORIZONTAL,
    root: {
      data: [
        {
          data: {
            activeView: 'panelTools',
            hideHeader: true,
            id: 'groupTools',
            locked: true,
            views: ['panelTools'],
          },
          size: 50,
          type: 'leaf',
        },
        {
          data: {
            activeView: 'panelCanvas',
            hideHeader: true,
            id: 'groupCanvas',
            locked: true,
            views: ['panelCanvas'],
          },
          size: 1150,
          type: 'leaf',
        },
        {
          data: {
            activeView: 'panelLayerControls',
            id: 'groupControls',
            views: ['panelLayerControls', 'panelObjectProperties'],
          },
          size: 260,
          type: 'leaf',
        },
      ],
      size: 678,
      type: 'branch',
    },
    width: 1440,
  },
  panels: {
    panelCanvas: {
      contentComponent: 'svgEditor',
      id: 'panelCanvas',
      tabComponent: 'props.defaultTabComponent',
      title: 'panelCanvas',
    },
    panelLayerControls: {
      contentComponent: 'rightPanelLayer',
      id: 'panelLayerControls',
      maximumWidth: 520,
      minimumWidth: 260,
      tabComponent: 'props.defaultTabComponent',
      title: 'Layers',
    },
    panelObjectProperties: {
      contentComponent: 'rightPanelObject',
      id: 'panelObjectProperties',
      maximumWidth: 520,
      minimumWidth: 260,
      tabComponent: 'props.defaultTabComponent',
      title: 'Objects',
    },
    panelTools: {
      contentComponent: 'leftPanel',
      id: 'panelTools',
      maximumWidth: 50,
      minimumWidth: 50,
      tabComponent: 'props.defaultTabComponent',
      title: 'panelTools',
    },
  },
};

export const fixedPanelIds = ['panelTools', 'panelCanvas'];
export const fixedGroupIds = ['groupTools', 'groupCanvas'];

export const drawerContainerId = 'drawer-container';
