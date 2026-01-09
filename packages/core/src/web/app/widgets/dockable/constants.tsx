import 'dockview-react/dist/styles/dockview.css';

import type { FloatingGroupOptions } from 'dockview-react';
import { type AddPanelOptions, Orientation, type SerializedDockview } from 'dockview-react';

import LeftPanel from '@core/app/components/beambox/LeftPanel';
import RightPanelLayer from '@core/app/components/beambox/right-panel/RightPanelLayer';
import RightPanelObject from '@core/app/components/beambox/right-panel/RightPanelObject';
import RightPanelPath from '@core/app/components/beambox/right-panel/RightPanelPath';
import SvgEditor from '@core/app/components/beambox/svg-editor/RealSvgEditor';
import layoutConstants from '@core/app/constants/layout-constants';
import type { TDynamicPanelKey } from '@core/app/stores/editorLayoutStore';
import type { ILang } from '@core/interfaces/ILang';

export const rightPanelWidth = layoutConstants.rightPanelWidth;
export const maximumWidth = 520; // more than windows width * 2
export const minFloatingHeight = 200;
export const borderSize = 2;

export const components = {
  leftPanel: LeftPanel,
  rightPanelLayer: RightPanelLayer,
  rightPanelObject: RightPanelObject,
  rightPanelPath: RightPanelPath,
  svgEditor: SvgEditor,
};

export type TComponentKey = keyof typeof components;

export const titleMap: Partial<Record<TComponentKey, keyof ILang['beambox']['right_panel']['tabs']>> = {
  rightPanelLayer: 'layers',
  rightPanelObject: 'objects',
  rightPanelPath: 'path_edit',
};

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

window.defaultLayout = defaultLayout;
