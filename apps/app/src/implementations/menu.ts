import { Menu as ElectronMenu } from '@electron/remote';
import { funnel } from 'remeda';

import { MenuEvents, MiscEvents, TabEvents } from '@core/app/constants/ipcEvents';
import { useDockableStore } from '@core/app/stores/dockableStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { useInteractionModeStore } from '@core/app/stores/interactionModeStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import { getOS } from '@core/helpers/getOS';
import AbstractMenu from '@core/helpers/menubar/AbstractMenu';
import { getExampleVisibility } from '@core/helpers/menubar/exampleFiles';
import communicator from '@core/implementations/communicator';

import ElectronUpdater from './electron-updater';

const updateWindowsMenu = () => {
  if (getOS() === 'Windows') {
    window.titlebar?.updateMenu(ElectronMenu.getApplicationMenu());
  }
};

class Menu extends AbstractMenu {
  private communicator;
  private menuItemChanges: { [key: string]: { checked?: boolean; enabled?: boolean; visible?: boolean } } = {};

  constructor(aCommunicator: any) {
    super();
    this.communicator = aCommunicator;
    communicator.on(MenuEvents.UpdateMenu, updateWindowsMenu);
    communicator.on(MenuEvents.NewAppMenu, () => {
      this.initMenuItemStatus();
    });
    communicator.on(TabEvents.TabFocused, () => {
      this.initMenuItemStatus();
    });
  }

  init(): void {
    useStorageStore.subscribe(
      (state) => state['active-lang'],
      () => this.updateLanguage(),
    );

    // model related
    useDocumentStore.subscribe((state) => state.workarea, this.updateMenuByWorkarea);
    useGlobalPreferenceStore.subscribe(
      (state) => state['enable-uv-print-file'],
      (newValue) => {
        this.changeMenuItemStatus(['EXPORT_UV_PRINT'], 'visible', newValue);
      },
    );

    // dockview layout related
    useDockableStore.subscribe(
      (state) => state.panelLayerControls,
      (isVisible) => {
        this.changeMenuItemStatus(['SHOW_LAYER_CONTROLS_PANEL'], 'checked', isVisible);
      },
    );
    useDockableStore.subscribe(
      (state) => state.panelObjectProperties,
      (isVisible) => {
        this.changeMenuItemStatus(['SHOW_OBJECT_CONTROLS_PANEL'], 'checked', isVisible);
      },
    );
    useDockableStore.subscribe(
      (state) => state.panelPathEdit,
      (isVisible) => {
        this.changeMenuItemStatus(['SHOW_PATH_CONTROLS_PANEL'], 'checked', isVisible);
      },
    );

    // editor mode related
    useInteractionModeStore.subscribe(
      (state) => state.interactionMode,
      (interactionMode) => {
        this.changeMenuItemStatus(['SAVE_AS_PROJECT'], 'visible', interactionMode === 'template');
        this.changeMenuItemStatus(['SAVE_AS_TEMPLATE'], 'visible', interactionMode === 'project');
        this.setDisabled(interactionMode === 'explore');
        this.rerenderMenu();
      },
    );

    const isDev = localStorage.getItem('dev') === 'true';

    this.setDevMode(isDev);
    this.initMenuItemStatus();
    this.initMenuEvents();
    ElectronUpdater.autoCheck();
  }

  rerenderMenu(): void {
    // force re-render menu
    ElectronMenu.setApplicationMenu(ElectronMenu.getApplicationMenu());
    updateWindowsMenu();
  }

  updateMenuByWorkarea = (workarea: any): void => {
    this.changeMenuItemStatus(['PROMARK_COLOR_TEST'], 'visible', workarea === 'fpm1');
    this.changeMenuItemStatus(['MATERIAL_TEST'], 'visible', workarea !== 'fpm1');

    const { disabledKeys, enabledKeys } = getExampleVisibility(workarea);

    this.changeMenuItemStatus(enabledKeys, 'visible', true);
    this.changeMenuItemStatus(disabledKeys, 'visible', false, { flush: true });
  };

  initMenuItemStatus = (): void => {
    const globalPreference = useGlobalPreferenceStore.getState();
    const dockableStore = useDockableStore.getState();
    const interactionMode = useInteractionModeStore.getState().interactionMode;

    // checkboxes
    this.changeMenuItemStatus(['ZOOM_WITH_WINDOW'], 'checked', globalPreference.zoom_with_window);
    this.changeMenuItemStatus(['SHOW_GRIDS'], 'checked', globalPreference.show_grids);
    this.changeMenuItemStatus(['SHOW_RULERS'], 'checked', globalPreference.show_rulers);
    this.changeMenuItemStatus(['SHOW_LAYER_COLOR'], 'checked', globalPreference.use_layer_color);
    this.changeMenuItemStatus(['ANTI_ALIASING'], 'checked', globalPreference['anti-aliasing']);
    this.changeMenuItemStatus(['AUTO_ALIGN'], 'checked', globalPreference.auto_align);
    this.changeMenuItemStatus(['EXPORT_UV_PRINT'], 'visible', globalPreference['enable-uv-print-file']);
    this.changeMenuItemStatus(['SHOW_LAYER_CONTROLS_PANEL'], 'checked', dockableStore.panelLayerControls);
    this.changeMenuItemStatus(['SHOW_OBJECT_CONTROLS_PANEL'], 'checked', dockableStore.panelObjectProperties);
    this.changeMenuItemStatus(['SHOW_PATH_CONTROLS_PANEL'], 'checked', dockableStore.panelPathEdit);
    this.changeMenuItemStatus(['SAVE_AS_PROJECT'], 'visible', interactionMode === 'template');
    this.changeMenuItemStatus(['SAVE_AS_TEMPLATE'], 'visible', interactionMode === 'project');

    this.updateMenuByWorkarea(useDocumentStore.getState().workarea);
  };

  attach(enabledItems?: string[]) {
    super.attach(enabledItems);
    updateWindowsMenu();
  }

  enable(ids: string[]): void {
    this.changeMenuItemStatus(ids, 'enabled', true);
  }

  disable(ids: string[]): void {
    this.changeMenuItemStatus(ids, 'enabled', false);
  }

  updateLanguage(): void {
    if (this.communicator) {
      this.communicator.send(MiscEvents.NotifyLanguage);
      updateWindowsMenu();
    }
  }

  setDevMode(isDevMode: boolean): void {
    if (this.communicator) {
      this.communicator.send(MiscEvents.SetDevMode, isDevMode);
      updateWindowsMenu();
    }
  }

  setDisabled(isDisabled: boolean): void {
    if (this.communicator) {
      this.communicator.send(MenuEvents.DisableMenu, isDisabled);
      updateWindowsMenu();
    }
  }

  changeMenuItemStatus(
    ids: string[],
    key: 'checked' | 'enabled' | 'visible',
    value: boolean,
    { flush = false }: { flush?: boolean } = {},
  ): void {
    ids.forEach((id) => {
      this.menuItemChanges[id] = { ...this.menuItemChanges[id], [key]: value };
    });

    if (flush) {
      this.updateMenuItemChangesHandler.flush();
    } else {
      this.updateMenuItemChangesHandler.call();
    }
  }

  private findAllMenuItemsByIds = (menu: Electron.Menu, ids: Set<string>): Electron.MenuItem[] => {
    const results: Electron.MenuItem[] = [];

    for (const item of menu.items) {
      if (ids.has(item.id)) results.push(item);

      if (item.submenu) results.push(...this.findAllMenuItemsByIds(item.submenu, ids));
    }

    return results;
  };

  updateMenuItemChangesHandler = funnel(
    (): void => {
      const menu = ElectronMenu.getApplicationMenu();

      if (!menu) return;

      const ids = Object.keys(this.menuItemChanges);
      const idSet = new Set(ids);
      const menuItems = this.findAllMenuItemsByIds(menu, idSet);

      for (const menuItem of menuItems) {
        const changes = this.menuItemChanges[menuItem.id];

        if (changes.checked !== undefined) {
          menuItem.checked = changes.checked;
        }

        if (changes.enabled !== undefined) {
          menuItem.enabled = changes.enabled;
        }

        if (changes.visible !== undefined) {
          menuItem.visible = changes.visible;
        }
      }
      this.rerenderMenu();
      this.menuItemChanges = {};
    },
    { minQuietPeriodMs: 100, triggerAt: 'end' },
  );
}

export default new Menu(communicator);
