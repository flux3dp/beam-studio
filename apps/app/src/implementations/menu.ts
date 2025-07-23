import { Menu as ElectronMenu } from '@electron/remote';

import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import tabController from '@core/app/actions/tabController';
import { TabEvents } from '@core/app/constants/tabConstants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import AbstractMenu from '@core/helpers/menubar/AbstractMenu';
import { getExampleVisibility } from '@core/helpers/menubar/exampleFiles';
import communicator from '@core/implementations/communicator';

import { changeMenuItemChecked, changeMenuItemEnabled, changeMenuItemVisible } from '../electron-menubar-helper';

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
      changeMenuItemVisible(['EXPORT_UV_PRINT'], isEnabled);
      this.rerenderMenu();
    });

    // layer panel related
    layerPanelEventEmitter.on('updateUvPrintStatus', (isUvPrintable = false) => {
      changeMenuItemEnabled(['EXPORT_UV_PRINT'], isUvPrintable);
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
    if (workarea === 'fpm1') {
      changeMenuItemVisible(['MATERIAL_TEST'], false);
      changeMenuItemVisible(['PROMARK_COLOR_TEST'], true);
    } else {
      changeMenuItemVisible(['MATERIAL_TEST'], true);
      changeMenuItemVisible(['PROMARK_COLOR_TEST'], false);
    }

    const { disabledKeys, enabledKeys } = getExampleVisibility(workarea);

    enabledKeys.forEach((key) => changeMenuItemVisible([key], true));
    disabledKeys.forEach((key) => changeMenuItemVisible([key], false));
    this.rerenderMenu();
  };

  initMenuItemStatus = (): void => {
    // checkboxes
    changeMenuItemChecked(['ZOOM_WITH_WINDOW'], BeamboxPreference.read('zoom_with_window'));
    changeMenuItemChecked(['SHOW_GRIDS'], BeamboxPreference.read('show_grids'));
    changeMenuItemChecked(['SHOW_RULERS'], BeamboxPreference.read('show_rulers'));
    changeMenuItemChecked(['SHOW_LAYER_COLOR'], BeamboxPreference.read('use_layer_color'));
    changeMenuItemChecked(['ANTI_ALIASING'], BeamboxPreference.read('anti-aliasing'));
    changeMenuItemChecked(['AUTO_ALIGN'], BeamboxPreference.read('auto_align'));
    changeMenuItemVisible(['EXPORT_UV_PRINT'], BeamboxPreference.read('enable-uv-print-file'));
    changeMenuItemEnabled(['EXPORT_UV_PRINT'], false);

    this.updateMenuByWorkarea(BeamboxPreference.read('workarea'));
  };

  attach(enabledItems?: string[]) {
    super.attach(enabledItems);
    updateWindowsMenu();
  }

  enable(ids: string[]): void {
    for (const id of ids) {
      changeMenuItemEnabled([id], true);
    }
    this.rerenderMenu();
  }

  disable(ids: string[]): void {
    for (const id of ids) {
      changeMenuItemEnabled([id], false);
    }
    this.rerenderMenu();
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
}

export default new Menu(communicator);
