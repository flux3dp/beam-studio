import { Menu as ElectronMenu } from '@electron/remote';
import { funnel } from 'remeda';

import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import tabController from '@core/app/actions/tabController';
import { TabEvents } from '@core/app/constants/tabConstants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import AbstractMenu from '@core/helpers/menubar/AbstractMenu';
import { getExampleVisibility } from '@core/helpers/menubar/exampleFiles';
import communicator from '@core/implementations/communicator';

import ElectronUpdater from './electron-updater';

const updateWindowsMenu = () => {
  if (window.os === 'Windows') {
    window.titlebar?.updateMenu(ElectronMenu.getApplicationMenu());
    tabController.updateCustomTitleBarDraggable();
  }
};

const canvasEvent = eventEmitterFactory.createEventEmitter('canvas');
const layerPanelEventEmitter = eventEmitterFactory.createEventEmitter('layer-panel');
const useSettingStoreEventEmitter = eventEmitterFactory.createEventEmitter('useSettingStore');

class Menu extends AbstractMenu {
  private communicator;
  private menuItemChanges: { [key: string]: { checked?: boolean; enabled?: boolean; visible?: boolean } } = {};

  constructor(aCommunicator: any) {
    super();
    this.communicator = aCommunicator;
    communicator.on('UPDATE_MENU', updateWindowsMenu);
    communicator.on('NEW_APP_MENU', () => {
      this.initMenuItemStatus();
    });
    communicator.on(TabEvents.TabFocused, () => {
      this.initMenuItemStatus();
    });
  }

  init(): void {
    // model related
    canvasEvent.on('model-changed', this.updateMenuByWorkarea);

    // setting store related
    useSettingStoreEventEmitter.on('changeEnableUvPrintFile', (isEnabled) => {
      this.changeMenuItemStatus(['EXPORT_UV_PRINT'], 'visible', isEnabled);
      this.rerenderMenu();
    });

    // layer panel related
    layerPanelEventEmitter.on('updateUvPrintStatus', (isUvPrintable = false) => {
      this.changeMenuItemStatus(['EXPORT_UV_PRINT'], 'enabled', isUvPrintable);
      this.rerenderMenu();
    });

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
    this.changeMenuItemStatus(disabledKeys, 'visible', false);
    this.rerenderMenu();
  };

  initMenuItemStatus = (): void => {
    // checkboxes
    this.changeMenuItemStatus(['ZOOM_WITH_WINDOW'], 'checked', BeamboxPreference.read('zoom_with_window'));
    this.changeMenuItemStatus(['SHOW_GRIDS'], 'checked', BeamboxPreference.read('show_grids'));
    this.changeMenuItemStatus(['SHOW_RULERS'], 'checked', BeamboxPreference.read('show_rulers'));
    this.changeMenuItemStatus(['SHOW_LAYER_COLOR'], 'checked', BeamboxPreference.read('use_layer_color'));
    this.changeMenuItemStatus(['ANTI_ALIASING'], 'checked', BeamboxPreference.read('anti-aliasing'));
    this.changeMenuItemStatus(['AUTO_ALIGN'], 'checked', BeamboxPreference.read('auto_align'));
    this.changeMenuItemStatus(['EXPORT_UV_PRINT'], 'visible', BeamboxPreference.read('enable-uv-print-file'));
    this.changeMenuItemStatus(['EXPORT_UV_PRINT'], 'enabled', false);

    this.updateMenuByWorkarea(BeamboxPreference.read('workarea'));
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
      this.communicator.send('NOTIFY_LANGUAGE');
      updateWindowsMenu();
    }
  }

  setDevMode(isDevMode: boolean): void {
    if (this.communicator) {
      this.communicator.send('SET_DEV_MODE', isDevMode);
      updateWindowsMenu();
    }
  }

  changeMenuItemStatus(ids: string[], key: 'checked' | 'enabled' | 'visible', value: boolean): void {
    ids.forEach((id) => {
      this.menuItemChanges[id] = { ...this.menuItemChanges[id], [key]: value };
    });

    this.updateMenuItemChangesHandler.call();
  }

  updateMenuItemChangesHandler = funnel(
    (): void => {
      const menu = ElectronMenu.getApplicationMenu();

      if (!menu) return;

      const ids = Object.keys(this.menuItemChanges);

      for (const id of ids) {
        const menuItem = menu.getMenuItemById(id);

        if (menuItem) {
          const changes = this.menuItemChanges[id];

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
      }
      this.rerenderMenu();
      this.menuItemChanges = {};
    },
    { minQuietPeriodMs: 100, triggerAt: 'end' },
  );
}

export default new Menu(communicator);
