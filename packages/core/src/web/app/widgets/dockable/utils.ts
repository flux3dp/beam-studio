import type { DockviewGroupPanel, DockviewPanelApi } from 'dockview-react';
import {
  type DockviewApi,
  type DockviewReadyEvent,
  type FloatingGroupOptions,
  type SerializedDockview,
} from 'dockview-react';

import beamboxGlobalInteraction from '@core/app/actions/beambox/beambox-global-interaction';
import tabController from '@core/app/actions/tabController';
import { CanvasMode } from '@core/app/constants/canvasMode';
import layoutConstants from '@core/app/constants/layout-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import type { TDynamicPanelKey } from '@core/app/stores/dockableStore';
import { defaultDockableState, useDockableStore } from '@core/app/stores/dockableStore';
import workareaManager from '@core/app/svgedit/workarea';
import storage from '@core/implementations/storage';

import {
  borderSize,
  defaultLayout,
  drawerContainerId,
  minFloatingHeight,
  panelConfigs,
  rightPanelWidth,
} from './constants';
import styles from './DockViewLayout.module.scss';

let api: DockviewApi | null = null;
let disableSaveLayout: boolean | null = null;
let disableNewFloatingPanel = false;
let keepSize: null | {
  panel: DockviewPanelApi;
  size: { height?: number; width?: number };
} = null;
const restoreInfo: Partial<Record<TDynamicPanelKey, FloatingGroupOptions & { parentGroup: string }>> = {};
let floatingInsetInfo: Array<{ element: HTMLElement; inset: string }> = [];

// ===== Drawer =====
export const getDrawerContainer = () => document.getElementById(drawerContainerId)!;

const updateDrawerPosition = () => {
  const refPosition = useDockableStore.getState().drawerRef?.style.left;

  getDrawerContainer().style.left = `calc(${refPosition ?? 0} + 51px)`;
};

const observer = new MutationObserver(() => updateDrawerPosition());

useDockableStore.subscribe(
  (state) => state.drawerRef,
  (drawerRef) => {
    observer.disconnect();

    if (drawerRef) {
      updateDrawerPosition();
      observer.observe(drawerRef, { attributeFilter: ['style'] });
    }
  },
);

// ===== common =====
const getGroupPosition = (group: DockviewGroupPanel, isFloating: boolean): FloatingGroupOptions => {
  let option: FloatingGroupOptions | undefined = undefined;

  if (isFloating) {
    const floatingInfo = api!.toJSON().floatingGroups?.find((fg) => fg.data.id === group.id);

    if (floatingInfo) {
      option = {
        height: floatingInfo.position.height,
        position: floatingInfo.position,
        width: floatingInfo.position.width,
      };
    }
  }

  if (!option) {
    const bbox = group.element.getBoundingClientRect();

    option = { height: bbox.height + borderSize, width: bbox.width + borderSize, x: bbox.left, y: bbox.top };
  }

  return option;
};

const getPanelPosition = (panel: DockviewPanelApi): FloatingGroupOptions => {
  return getGroupPosition(panel.group, panel.location.type === 'floating');
};

// ===== show & hide =====
/**
 * If panel already exists, focus it.
 * Otherwise, do nothing.
 */
export const focusPanel = (panelId: TDynamicPanelKey): void => {
  if (!api) return;

  api.getPanel(panelId)?.focus();
};

/**
 * If panel already exists, focus it.
 * If panel was previously added and its old group exists, add panel to that group.
 * Otherwise, add floating panel to the layout.
 */
export const showPanel = (panelId: TDynamicPanelKey): void => {
  if (!api) return;

  const panel = api.getPanel(panelId);

  if (panel) {
    panel.focus();
    useDockableStore.setState({ [panelId]: true });

    return;
  }

  let newGroup = true;
  const config = structuredClone(panelConfigs[panelId]);

  if (restoreInfo[panelId] && api.getGroup(restoreInfo[panelId].parentGroup)) {
    newGroup = false;
    config.position = { referenceGroup: restoreInfo[panelId].parentGroup };
  }

  if (newGroup) {
    config.inactive = true;
    config.position = { referenceGroup: 'groupCanvas' }; // Temporary reference to main group
  }

  api.addPanel(config);
  useDockableStore.setState({ [panelId]: true });

  if (newGroup) {
    addFloatingPanel(panelId, restoreInfo[panelId] ?? config.defaultFloatingOption);
  }
};

/**
 * Remove panel from layout, and save its group and position info for restore when showing again.
 */
export const removePanel = (panelId: TDynamicPanelKey): void => {
  if (!api) return;

  const panel = api.getPanel(panelId);

  if (!panel) {
    useDockableStore.setState({ [panelId]: false });

    return;
  }

  restoreInfo[panelId] = { parentGroup: panel.group.id, ...getPanelPosition(panel.api) };
  api.removePanel(panel);
  useDockableStore.setState({ [panelId]: false });
};

export const togglePanel = (panelId: TDynamicPanelKey): void => {
  if (useDockableStore.getState()[panelId]) {
    removePanel(panelId);
  } else {
    showPanel(panelId);
  }
};

/**
 * Set visibility temporarily
 */
export const setGroupVisible = (isVisible: boolean, ignoredGroups: string[]): void => {
  if (!api) return;

  if (!isVisible) {
    // sometimes positions of floating groups change when other grid groups are set to invisible
    // so we need to record their positions and restore later
    disableSaveLayout = true;
    floatingInsetInfo = [];
    api.groups.forEach((group) => {
      if (group.api.location.type === 'floating') {
        const element = group.element.parentElement;

        if (element) {
          floatingInsetInfo.push({ element, inset: element.style.inset });
        }
      }
    });
  }

  api.groups.forEach((group) => {
    if (!ignoredGroups.includes(group.id)) group.api.setVisible(isVisible);
  });

  if (isVisible) {
    floatingInsetInfo.forEach(({ element, inset }) => {
      element.style.inset = inset;
    });
    disableSaveLayout = false;
  }
};

useCanvasStore.subscribe(
  (state) => state.mode === CanvasMode.PathPreview,
  (isPathPreviewMode) => {
    setGroupVisible(!isPathPreviewMode, ['groupTools', 'groupCanvas']);
    beamboxGlobalInteraction.onCanvasModeChange(isPathPreviewMode);
  },
);

// ===== move panel =====
export const setMovedPanel = (panel: DockviewPanelApi | null) => {
  if (panel) {
    const position = getPanelPosition(panel);

    keepSize = {
      panel,
      size: { height: position.height, width: position.width },
    };
  } else {
    keepSize = null;
  }
};

const restoreSize = () => {
  // Dock view may change panels' sizes when drag and drop or toggle floating, which is not desired
  // Try to roll back to original sizes
  if (keepSize) {
    keepSize.panel.setSize(keepSize.size);
    keepSize = null;
  }
};

// ===== floating panel =====
export const addFloatingPanel = (panelId: string, option: FloatingGroupOptions): void => {
  if (!api || disableNewFloatingPanel) return;

  const panel = api.getPanel(panelId);

  if (!panel) return;

  if (option?.y !== undefined) {
    option.y -= layoutConstants.topBarHeight;
  }

  api.addFloatingGroup(panel, option);
  useDockableStore.setState({ [panelId]: true });
};

export const addFloatingGroup = (groupId: string, option: FloatingGroupOptions): void => {
  if (!api || disableNewFloatingPanel) return;

  const group = api.getGroup(groupId)?.panels[0].group;

  if (!group) return;

  if (option?.y !== undefined) {
    option.y -= layoutConstants.topBarHeight;
  }

  api.addFloatingGroup(group, option);
};

// ==== layout =====
export const saveLayout = () => {
  if (!api || disableSaveLayout || !tabController.isFocused) return;

  restoreSize();

  const layout = api.toJSON();

  // Ensure floating panels have minimum width
  layout.floatingGroups?.forEach((fg) => {
    if (fg.position.width < rightPanelWidth) {
      fg.position.width = rightPanelWidth;
      api!.getGroup(fg.data.id)!.api.setSize({ width: rightPanelWidth });
    }

    if (fg.position.height < minFloatingHeight) {
      fg.position.height = minFloatingHeight;
      api!.getGroup(fg.data.id)!.api.setSize({ height: minFloatingHeight });
    }
  });

  const layoutStr = JSON.stringify(layout);

  storage.set('dockviewLayout', layoutStr);
};

export const loadLayout = (type: 'fallback' | 'storage' = 'storage') => {
  if (!api) return;

  let layout: SerializedDockview | string = defaultLayout;

  try {
    if (type === 'storage') {
      layout = storage.get('dockviewLayout');
    }

    // Desktop storage.get returns object, skip parsing
    if (typeof layout === 'string') {
      layout = JSON.parse(layout) as SerializedDockview;
    }
  } catch (e) {
    console.error('Failed to load layout', e);
    layout = defaultLayout;
  }

  try {
    disableSaveLayout = true;
    api.fromJSON(layout ?? defaultLayout);
    api.layout(window.innerWidth, window.innerHeight - layoutConstants.topBarHeight);
  } catch (e) {
    console.error('Failed to load layout', e);
  } finally {
    workareaManager.resetView();

    const panelTools = api.getPanel('panelTools');
    const newStore = structuredClone(defaultDockableState);

    if (panelTools) {
      panelTools.group.element.classList.add(styles.narrow);
      newStore.drawerRef = panelTools.group.element.parentElement!;
    }

    api.panels.forEach((panel) => {
      newStore[panel.id as TDynamicPanelKey] = true;
    });
    useDockableStore.setState(newStore);

    disableSaveLayout = false;
  }
};

// ===== api =====
export const onReady = (event: DockviewReadyEvent) => {
  api = event.api;

  // Setup custom behaviors
  api.onDidLayoutChange(saveLayout);
  api.onWillShowOverlay((e) => {
    const { group, kind, position } = e;

    // Disable most vertical grid
    if ((group?.locked || kind === 'edge') && ['bottom', 'top'].includes(position)) {
      e.preventDefault();
    }
  });
  api.onWillDrop((e) => {
    const { position } = e;

    if (keepSize) {
      if (['bottom', 'top'].includes(position)) {
        keepSize.size.width = undefined;
      } else if (['left', 'right'].includes(position)) {
        keepSize.size.height = undefined;
      } else {
        keepSize = null;
      }
    }

    // Prevent addFloatingGroup if already handled as normal drop
    disableNewFloatingPanel = true;
    setTimeout(() => {
      disableNewFloatingPanel = false;
    }, 300);
  });

  loadLayout();
};

export const disableDockview = () => {
  api = null;
};
