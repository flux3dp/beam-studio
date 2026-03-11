import type { DockviewGroupPanel, DockviewGroupPanelApi, DockviewPanelApi, Position } from 'dockview-react';
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
  defaultLayout,
  drawerContainerId,
  fixedGroupIds,
  fixedPanelIds,
  minFloatingHeight,
  panelConfigs,
  rightPanelWidth,
} from './constants';
import styles from './DockViewLayout.module.scss';

let api: DockviewApi | null = null;
let cachedLayout: SerializedDockview | string = '';
let disableSaveLayout: boolean | null = null;
let disableNewFloatingPanel = false;
let keepSizeInfo:
  | null
  | (Record<string, FloatingGroupOptions> & {
      movedPanel: DockviewPanelApi;
      position?: Position;
      targetGroup?: DockviewGroupPanel;
    }) = null;
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

    option = { height: bbox.height, width: bbox.width, x: bbox.left, y: bbox.top };
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
    setGroupVisible(!isPathPreviewMode, fixedGroupIds);
    beamboxGlobalInteraction.onCanvasModeChange(isPathPreviewMode);
  },
);

// ===== move panel =====
export const setMovedPanel = (panel: DockviewPanelApi | null) => {
  if (panel) {
    keepSizeInfo = { movedPanel: panel };
    api!.panels.forEach((p) => {
      if (fixedPanelIds.includes(p.id)) return;

      keepSizeInfo![p.id] = getPanelPosition(p.api);
    });
  } else {
    keepSizeInfo = null;
  }
};

const forceSize = (group: DockviewGroupPanelApi, size?: { height?: number; width?: number }) => {
  if (group.location.type === 'floating') return;

  // Note: setSize may change other panels' sizes; use strict constraints to prevent unexpected size changes
  const constraints = {
    maximumHeight: 9007199254740991,
    maximumWidth: 520,
    minimumHeight: 100,
    minimumWidth: 260,
  };

  if (size?.width) {
    const width = Math.max(Math.min(size.width, 520), 260);

    constraints.maximumWidth = constraints.minimumWidth = width;
  }

  if (size?.height) {
    constraints.maximumHeight = constraints.minimumHeight = size.height;
  }

  group.setConstraints(constraints);

  if (size) group.setSize(size);
};

const restoreSize = () => {
  if (!api || !keepSizeInfo) return;

  disableSaveLayout = true;
  try {
    api.groups.forEach((group) => {
      if (fixedGroupIds.includes(group.id)) return;

      forceSize(group.api, keepSizeInfo![group.panels[0].id]);
    });

    const movedGroup = keepSizeInfo.movedPanel.group;

    if (movedGroup.panels[1] && movedGroup.panels[0].id === keepSizeInfo.movedPanel.id) {
      // Moved into old group, set group size according to second panel instead of moved panel
      forceSize(movedGroup.api, keepSizeInfo[movedGroup.panels[1].id]);
    } else if (keepSizeInfo.targetGroup && !fixedGroupIds.includes(keepSizeInfo.targetGroup.id)) {
      // Split with dynamic group
      const refPanel = keepSizeInfo.targetGroup.panels[0];
      const refSize = keepSizeInfo[refPanel.id];

      if (['bottom', 'top'].includes(keepSizeInfo.position!)) {
        const size = { height: (refSize.height ?? 0) / 2, width: refSize.width };

        forceSize(movedGroup.api, size);
        forceSize(keepSizeInfo.targetGroup.api, size);
      } else if (['left', 'right'].includes(keepSizeInfo.position!)) {
        forceSize(movedGroup.api, {
          height: refSize.height,
          width: keepSizeInfo[keepSizeInfo.movedPanel.id].width,
        });
        forceSize(keepSizeInfo.targetGroup.api, { height: refSize.height, width: refSize.width });
      }
    }

    api.layout(window.innerWidth, window.innerHeight - layoutConstants.topBarHeight, true);

    api.groups.forEach(async (group) => {
      if (fixedGroupIds.includes(group.id)) return;

      forceSize(group.api);
    });
    api.layout(window.innerWidth, window.innerHeight - layoutConstants.topBarHeight, true);
  } finally {
    keepSizeInfo = null;
    disableSaveLayout = false;
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

export const loadLayout = (type: 'cached' | 'default' | 'storage' | 'tutorial') => {
  if (!api) return;

  let layout: SerializedDockview | string = defaultLayout;

  try {
    if (type === 'storage') {
      layout = storage.get('dockviewLayout');
    } else if (type === 'cached') {
      layout = cachedLayout;
    } else {
      cachedLayout = storage.get('dockviewLayout');
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

    if (type !== 'tutorial') {
      disableSaveLayout = false;
    }
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
    if (keepSizeInfo) {
      keepSizeInfo.targetGroup = e.group;
      keepSizeInfo.position = e.position;
    }

    // Prevent addFloatingGroup if already handled as normal drop
    disableNewFloatingPanel = true;
    setTimeout(() => {
      disableNewFloatingPanel = false;
    }, 300);
  });

  loadLayout('storage');
};

export const disableDockview = () => {
  api = null;
};
