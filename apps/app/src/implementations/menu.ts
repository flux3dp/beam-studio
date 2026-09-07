import { Menu as ElectronMenu } from '@electron/remote';
import { funnel } from 'remeda';

import { MenuEvents, MiscEvents, TabEvents } from '@core/app/constants/ipcEvents';
import { useDockableStore } from '@core/app/stores/dockableStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
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

type MenuItemStatus = { checked?: boolean; enabled?: boolean; visible?: boolean };

class Menu extends AbstractMenu {
  private communicator;
  private menuItemChanges: { [id: string]: MenuItemStatus } = {};
  // Status last applied to the native menu; lets no-op flushes skip the sync-IPC @electron/remote calls
  private appliedMenuItemStatus: { [id: string]: MenuItemStatus } = {};
  // Menu tree walked once per menu build; each item access via @electron/remote is a sync IPC round-trip
  private menuItemsById: Map<string, Electron.MenuItem[]> | null = null;

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
    this.changeMenuItemStatus(['MATERIAL_TEST'], 'visible', workarea !== 'fpm1');

    const { disabledKeys, enabledKeys } = getExampleVisibility(workarea);

    this.changeMenuItemStatus(enabledKeys, 'visible', true);
    this.changeMenuItemStatus(disabledKeys, 'visible', false, { flush: true });
  };

  initMenuItemStatus = (): void => {
    // the native menu was rebuilt, so the applied mirror and cached item references are stale
    this.appliedMenuItemStatus = {};
    this.menuItemsById = null;

    const globalPreference = useGlobalPreferenceStore.getState();
    const dockableStore = useDockableStore.getState();

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

  private getMenuItemsByIds = (menu: Electron.Menu, ids: string[]): Electron.MenuItem[] => {
    if (!this.menuItemsById) {
      const map = new Map<string, Electron.MenuItem[]>();
      const collect = (current: Electron.Menu): void => {
        for (const item of current.items) {
          if (item.id) map.set(item.id, [...(map.get(item.id) ?? []), item]);

          if (item.submenu) collect(item.submenu);
        }
      };

      collect(menu);
      this.menuItemsById = map;
    }

    return ids.flatMap((id) => this.menuItemsById!.get(id) ?? []);
  };

  // drop pending changes that match what is already applied to the native menu
  private pruneNoopChanges = (): void => {
    for (const [id, changes] of Object.entries(this.menuItemChanges)) {
      const applied = this.appliedMenuItemStatus[id];

      if (applied && Object.entries(changes).every(([key, value]) => applied[key as keyof MenuItemStatus] === value)) {
        delete this.menuItemChanges[id];
      }
    }
  };

  updateMenuItemChangesHandler = funnel(
    (): void => {
      this.pruneNoopChanges();

      const ids = Object.keys(this.menuItemChanges);

      if (ids.length === 0) return;

      const menu = ElectronMenu.getApplicationMenu();

      if (!menu) return;

      for (const menuItem of this.getMenuItemsByIds(menu, ids)) {
        Object.assign(menuItem, this.menuItemChanges[menuItem.id]);
      }

      this.rerenderMenu();

      for (const id of ids) {
        this.appliedMenuItemStatus[id] = { ...this.appliedMenuItemStatus[id], ...this.menuItemChanges[id] };
      }

      this.menuItemChanges = {};
    },
    { minQuietPeriodMs: 100, triggerAt: 'end' },
  );
}

export default new Menu(communicator);
