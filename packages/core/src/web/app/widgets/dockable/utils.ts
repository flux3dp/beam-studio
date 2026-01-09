import type { AddGroupOptions, GroupPanelViewState, GroupviewPanelState, SerializedGridObject } from 'dockview-react';
import {
  type DockviewApi,
  type DockviewReadyEvent,
  type FloatingGroupOptions,
  type SerializedDockview,
} from 'dockview-react';

import tabController from '@core/app/actions/tabController';
import { moveEditorOut } from '@core/app/components/beambox/svg-editor/RealSvgEditor';
import layoutConstants from '@core/app/constants/layout-constants';
import type { TDynamicPanelKey } from '@core/app/stores/editorLayoutStore';
import { defaultPanelVisibilityState, usePanelVisibilityStore } from '@core/app/stores/editorLayoutStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import workareaManager from '@core/app/svgedit/workarea';
import type { TComponentKey } from '@core/app/widgets/dockable/constants';
import {
  borderSize,
  defaultLayout,
  minFloatingHeight,
  panelConfigs,
  rightPanelWidth,
  titleMap,
} from '@core/app/widgets/dockable/constants';
import i18n from '@core/helpers/i18n';
import { uniqueId } from '@core/helpers/react-contextmenu/helpers';
import storage from '@core/implementations/storage';

import styles from './DockViewLayout.module.scss';

let api: DockviewApi | null = null;
let isMobile: boolean | null = null;
let disableSaveLayout: boolean | null = null;
let disableNewFloatingPanel = false;
let virtualShift = false;
let cachedLayout: null | string = null;

type TRestoreInfo = FloatingGroupOptions & { parentGroup: string };

const restoreInfo: Partial<Record<TDynamicPanelKey, TRestoreInfo>> = {};
let floatingInsetInfo: Array<{ element: HTMLElement; inset: string }> = [];

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

export const setIsMobile = (mobile: boolean): void => {
  if (!api || isMobile === mobile) return;

  isMobile = mobile;
  setGroupVisible(!isMobile, ['groupCanvas']);
};

export const focusPanel = (panelId: TDynamicPanelKey): void => {
  if (!api || isMobile) return;

  const panel = api.getPanel(panelId);

  if (panel) {
    panel.focus();
  }
};

export const showPanel = (panelId: TDynamicPanelKey): void => {
  if (!api || isMobile) return;

  const panel = api.getPanel(panelId);

  if (panel) {
    panel.focus();
    usePanelVisibilityStore.setState({ [panelId]: true });

    return;
  }

  let newGroup = true;
  const config = structuredClone(panelConfigs[panelId]);

  config.title = i18n.lang.beambox.right_panel.tabs[titleMap[config.component]!];

  if (restoreInfo[panelId] && api.getGroup(restoreInfo[panelId].parentGroup)) {
    newGroup = false;
    config.position = { referenceGroup: restoreInfo[panelId].parentGroup };
  }

  if (newGroup) {
    config.inactive = true;
    config.position = { referenceGroup: 'groupCanvas' }; // Temporary reference to main group
  }

  api.addPanel(config);
  usePanelVisibilityStore.setState({ [panelId]: true });

  if (newGroup) {
    addFloatingPanel(panelId, restoreInfo[panelId] ?? config.defaultFloatingOption);
  }
};

export const removePanel = (panelId: TDynamicPanelKey): void => {
  if (!api || isMobile) return;

  const panel = api.getPanel(panelId);

  if (!panel) {
    usePanelVisibilityStore.setState({ [panelId]: false });

    return;
  }

  let option: FloatingGroupOptions | undefined = undefined;

  if (panel.api.location.type === 'floating') {
    const floatingInfo = api.toJSON().floatingGroups?.find((fg) => fg.data.id === panel.group.id);

    if (floatingInfo) {
      option = {
        height: floatingInfo.position.height,
        position: floatingInfo.position,
        width: floatingInfo.position.width,
      };
    }
  }

  if (!option) {
    const bbox = panel.group.element.getBoundingClientRect();

    option = { height: bbox.height + borderSize, width: bbox.width + borderSize, x: bbox.left, y: bbox.top };
  }

  restoreInfo[panelId] = { parentGroup: panel.group.id, ...option };
  api.removePanel(panel);
  usePanelVisibilityStore.setState({ [panelId]: false });
};

export const togglePanel = (panelId: TDynamicPanelKey): void => {
  if (usePanelVisibilityStore.getState()[panelId]) {
    removePanel(panelId);
  } else {
    showPanel(panelId);
  }
};

export const addFloatingPanel = (panelId: string, option: FloatingGroupOptions): void => {
  if (!api || isMobile || disableNewFloatingPanel) return;

  const panel = api.getPanel(panelId);

  if (!panel) return;

  if (option?.y !== undefined) {
    option.y -= layoutConstants.topBarHeight;
  }

  api.addFloatingGroup(panel, option);
  usePanelVisibilityStore.setState({ [panelId]: true });
};

export const addFloatingGroup = (groupId: string, option: FloatingGroupOptions): void => {
  if (!api || isMobile || disableNewFloatingPanel) return;

  const group = api.getGroup(groupId)?.panels[0].group;

  if (!group) return;

  if (option?.y !== undefined) {
    option.y -= layoutConstants.topBarHeight;
  }

  api.addFloatingGroup(group, option);
};

export const saveLayout = () => {
  // Close drawer to fix position issue
  try {
    window.setDrawerXOffset?.(api?.getGroup('groupTools')?.element?.getBoundingClientRect().right);
  } catch {
    window.closeDrawer?.();
  }

  if (!api || isMobile || disableSaveLayout || !tabController.isFocused) return;

  console.log('Save layout');

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

export const updatePanelTitle = (panelId?: string, title?: string): void => {
  return;

  if (!api) return;

  api.panels.forEach((panel) => {
    const i18nKey = titleMap[panel.api.component as TComponentKey];

    if (i18nKey) panel.setTitle(i18n.lang.beambox.right_panel.tabs[i18nKey]);
  });

  if (panelId && title) {
    api.getPanel(panelId)?.setTitle(title);
  }
};

const dynamicPanelKeys: TDynamicPanelKey[] = ['panelLayerControls', 'panelObjectProperties', 'panelPathEdit'];

const _loadLayout = (
  panels: Record<string, GroupviewPanelState>,
  data: Array<SerializedGridObject<GroupPanelViewState>>,
  horizontal = true,
  referenceGroup = undefined,
  firstLevel: 'normal' | 'only' | 'skip' = 'normal',
) => {
  // BFS queue: each item contains the node, its orientation, reference group, and parent info
  interface QueueItem {
    horizontal: boolean;
    nodes: Array<SerializedGridObject<GroupPanelViewState>>;
    parentBranch?: { horizontal: boolean; size: number };
    referenceGroup: string | undefined;
    skipFirst: boolean;
  }

  const queue: QueueItem[] = [
    {
      horizontal,
      nodes: data,
      referenceGroup,
      skipFirst: firstLevel === 'skip',
    },
  ];

  let lastGroupId: string | undefined = referenceGroup;

  while (queue.length > 0) {
    const { horizontal: isHorizontal, nodes, parentBranch, referenceGroup: refGroup, skipFirst } = queue.shift()!;

    let currentRef = refGroup;
    let isFirstInLevel = true;

    nodes.forEach((node, index) => {
      // Handle firstLevel filtering
      if (skipFirst && index === 0) return;

      if (firstLevel === 'only' && index > 0) return;

      if (node.type === 'branch') {
        console.log('Load branch group', node);

        // For branches, we need to process the first child immediately to establish reference
        // Then queue the rest of the children
        const firstChild = node.data[0];

        if (firstChild) {
          // Process first child of branch to create the initial reference
          const branchRef = currentRef;
          let branchDirection = 'right';

          if (!branchRef && isFirstInLevel) {
            branchDirection = 'left';
          } else if (isFirstInLevel) {
            branchDirection = isHorizontal ? 'below' : 'right';
          } else {
            branchDirection = isHorizontal ? 'right' : 'below';
          }

          if (firstChild.type === 'leaf') {
            const leafItem = firstChild as GroupPanelViewState;
            let group = api?.getGroup(leafItem.data.id);

            if (!group) {
              const option: AddGroupOptions = {
                direction: branchDirection,
                hideHeader: leafItem.data.hideHeader,
                id: leafItem.data.id,
                locked: leafItem.data.locked,
                referenceGroup: branchRef,
              };

              group = api?.addGroup(option);
              console.log('Created branch first group', group, option);
            }

            currentRef = group?.id;

            leafItem.data.views.forEach((panelId) => {
              if (!api?.getPanel(panelId)) {
                api?.addPanel({
                  ...panels[panelId],
                  component: panels[panelId].contentComponent!,
                  inactive: leafItem.data.activeView !== panelId,
                  [isHorizontal ? 'initialWidth' : 'initialHeight']: leafItem.size,
                  position: { referenceGroup: currentRef },
                });
              }
            });

            console.log('Set group size', group?.id, isHorizontal ? 'width' : 'height', leafItem.size);
            group?.api.setSize({ [isHorizontal ? 'width' : 'height']: leafItem.size });
          }

          // Queue remaining children of this branch
          if (node.data.length > 1) {
            queue.push({
              horizontal: !isHorizontal,
              nodes: node.data,
              parentBranch: { horizontal: isHorizontal, size: node.size },
              referenceGroup: currentRef,
              skipFirst: true,
            });
          }
        }

        isFirstInLevel = false;
      } else {
        console.log('Load leaf group', isHorizontal, currentRef, node, index);

        const item = node as GroupPanelViewState;
        let group = api?.getGroup(item.data.id);

        if (!group) {
          let direction = 'right';

          if (!currentRef && isFirstInLevel) {
            direction = 'left';
          } else if (isFirstInLevel) {
            direction = isHorizontal ? 'below' : 'right';
          } else {
            direction = isHorizontal ? 'right' : 'below';
          }

          const option: AddGroupOptions = {
            direction,
            hideHeader: item.data.hideHeader,
            id: item.data.id,
            locked: item.data.locked,
            referenceGroup: currentRef,
          };

          group = api?.addGroup(option);
          console.log('Created leaf group', group, option);
        } else {
          console.log('Using existing group', group);
        }

        currentRef = group?.id;

        item.data.views.forEach((panelId) => {
          if (!api?.getPanel(panelId)) {
            api?.addPanel({
              ...panels[panelId],
              component: panels[panelId].contentComponent!,
              inactive: item.data.activeView !== panelId,
              [isHorizontal ? 'initialWidth' : 'initialHeight']: item.size,
              position: { referenceGroup: currentRef },
            });
          }
        });

        console.log('Set group size', group?.id, isHorizontal ? 'width' : 'height', item.size);
        group?.api.setSize({ [isHorizontal ? 'width' : 'height']: item.size });

        isFirstInLevel = false;
      }
    });

    // Apply parent branch sizing if applicable
    if (parentBranch && currentRef) {
      const group = api?.getGroup(currentRef);
      const sizeKey = parentBranch.horizontal ? 'width' : 'height';

      console.log('Apply parent branch size', currentRef, sizeKey, parentBranch.size);
      group?.api.setSize({ [sizeKey]: parentBranch.size });
    }

    lastGroupId = currentRef;
  }

  return lastGroupId;
};

window.storage = storage;

window._loadLayout = _loadLayout;

type TLayoutType = 'cached' | 'fallback' | 'storage';

export const loadLayout = (type: TLayoutType = 'storage') => {
  if (!api) return;

  let layout = defaultLayout;

  try {
    if (type === 'storage') {
      layout = storage.get('dockviewLayout');
      // TODO: add a simple check for some expected groups/panels to ensure layout is valid
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

  console.log('Load layout', layout);

  try {
    disableSaveLayout = true;

    if (false && document.getElementById('workarea')) {
      dynamicPanelKeys.forEach((panelId) => {
        api!.getPanel(panelId)?.api.close();
      });
      _loadLayout(layout.panels, layout.grid.root.data, true);
      // layout.floatingGroups?.forEach((fg) => {
      //   const panelId = fg.data.id as TDynamicPanelKey;

      //   if (usePanelVisibilityStore.getState()[panelId] === false) {
      //     // Close the panel by removing it from layout
      //     fg.data = null!;
      //   }
      // });
    } else {
      // Note: fromJSON will unmount and remount the workarea element
      const realEditor = document.getElementById('real-editor-container');

      if (realEditor) moveEditorOut(realEditor);

      // Only do this if the element is not already present
      api.fromJSON(layout ?? defaultLayout);
      api.layout(window.innerWidth, window.innerHeight - layoutConstants.topBarHeight);
    }
  } catch (e) {
    console.error('Failed to load layout', e);
  } finally {
    updatePanelTitle();
    workareaManager.resetView();

    const panelTools = api.getPanel('panelTools');

    if (panelTools) {
      panelTools.group.element.classList.add(styles.narrow);
    }

    const newStore = structuredClone(defaultPanelVisibilityState);

    api.panels.forEach((panel) => {
      // Non closable panels are handled too
      newStore[panel.id as TDynamicPanelKey] = true;
    });
    usePanelVisibilityStore.setState(newStore);

    disableSaveLayout = false;
  }
};

window.loadLayout = loadLayout;

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
  api.onWillDrop(() => {
    // Prevent addFloatingGroup if already handled as normal drop
    disableNewFloatingPanel = true;
    setTimeout(() => {
      disableNewFloatingPanel = false;
    }, 300);
  });

  loadLayout();

  // For dev
  window.api = api;
};

useStorageStore.subscribe((state) => state['active-lang'], updatePanelTitle);

let disableTimer = null;

export const setVirtualShift = (val: boolean) => {
  clearTimeout(disableTimer);
  console.log('setVirtualShift', val);
  virtualShift = val;

  const evt = new KeyboardEvent('keydown', { bubbles: true, key: 'Shift', shiftKey: val });

  if (!val) {
    // disableTimer = window.setTimeout(() => {
    //   window.dispatchEvent(evt);
    // }, 1000);

    return;
  } else {
    window.dispatchEvent(evt);
  }
};

let oldGroups = [];
let newPanel = [];

const resetDefaultLayout = () => {
  if (!api) return;

  oldGroups = [];
  api.groups.forEach((group) => {
    if (group.id !== 'groupTools' && group.id !== 'groupCanvas' && group.isVisible) {
      group.setVisible(false);
      oldGroups.push(group.id);
    }
  });

  const panel = api.addPanel({
    ...panelConfigs.panelLayerControls,
    floating: false,
    id: uniqueId(),
    initialWidth: rightPanelWidth,
    position: { direction: 'right' },
  });

  const panel2 = api.addPanel({
    ...panelConfigs.panelObjectProperties,
    floating: false,
    id: uniqueId(),
    inactive: true,
    initialWidth: rightPanelWidth,
    position: { referencePanel: panel },
  });

  newPanel = [panel.id, panel2.id];
};

window.resetDefaultLayout = resetDefaultLayout;

const undoResetDefaultLayout = () => {
  if (!api) return;

  newPanel.forEach((panelId) => {
    const panel = api!.getPanel(panelId);

    if (panel) {
      api!.removePanel(panel);
    }
  });
  oldGroups.forEach((groupId) => {
    const group = api!.getGroup(groupId);

    if (group) {
      group.api.setVisible(true);
    }
  });
};

window.undoResetDefaultLayout = undoResetDefaultLayout;
