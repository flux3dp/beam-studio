import { Menu as ElectronMenu } from '@electron/remote';

import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { TabEvents } from '@core/app/constants/tabConstants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import AbstractMenu from '@core/helpers/menubar/AbstractMenu';
import communicator from '@core/implementations/communicator';

import {
  changeMenuItemChecked,
  changeMenuItemEnabled,
  changeMenuItemVisible,
  changeVisibilityByIsBb2,
  changeVisibilityByIsPromark,
} from '../electron-menubar-helper';

import ElectronUpdater from './electron-updater';

const updateWindowsMenu = () => {
  if (window.os === 'Windows') {
    window.titlebar?.updateMenu(ElectronMenu.getApplicationMenu());
  }
};

const canvasEvent = eventEmitterFactory.createEventEmitter('canvas');
const layerPanelEventEmitter = eventEmitterFactory.createEventEmitter('layer-panel');

class Menu extends AbstractMenu {
  private communicator;

  constructor(aCommunicator: any) {
    super();
    this.communicator = aCommunicator;
    communicator.on('UPDATE_MENU', updateWindowsMenu);
    communicator.on('NEW_APP_MENU', updateWindowsMenu);
    communicator.on(TabEvents.TabFocused, () => {
      this.initMenuItemStatus();
    });
  }

  init(): void {
    const isDev = localStorage.getItem('dev') === 'true';

    this.setDevMode(isDev);
    this.initMenuItemStatus();
    this.initMenuEvents();
  }

  initMenuItemStatus = (): void => {
    // checkboxes
    changeMenuItemChecked(['ZOOM_WITH_WINDOW'], BeamboxPreference.read('zoom_with_window'));
    changeMenuItemChecked(['SHOW_GRIDS'], BeamboxPreference.read('show_grids'));
    changeMenuItemChecked(['SHOW_RULERS'], BeamboxPreference.read('show_rulers'));
    changeMenuItemChecked(['SHOW_LAYER_COLOR'], BeamboxPreference.read('use_layer_color'));
    changeMenuItemChecked(['ANTI_ALIASING'], BeamboxPreference.read('anti-aliasing'));
    changeMenuItemChecked(['AUTO_ALIGN'], BeamboxPreference.read('auto_align'));
    changeMenuItemVisible(['EXPORT_UV_PRINT'], BeamboxPreference.read('enable-uv-print-file'));

    // model related
    canvasEvent.on('model-changed', (model) => {
      const isBb2 = model === 'fbb2';
      const isPromark = model === 'fpm1';

      changeVisibilityByIsBb2(isBb2);
      changeVisibilityByIsPromark(isPromark);
      // force re-render menu
      ElectronMenu.setApplicationMenu(ElectronMenu.getApplicationMenu());
    });

    // layer panel related
    layerPanelEventEmitter.on('updateUvPrintStatus', (isUvPrintable: boolean) => {
      changeMenuItemEnabled(['EXPORT_UV_PRINT'], isUvPrintable);
      // force re-render menu
      ElectronMenu.setApplicationMenu(ElectronMenu.getApplicationMenu());
    });
  };

  attach(enabledItems: string[]) {
    super.attach(enabledItems);
    ElectronUpdater.autoCheck();
    updateWindowsMenu();
  }

  enable(items: string[]): void {
    this.communicator?.send('ENABLE_MENU_ITEM', items);
  }

  disable(items: string[]): void {
    this.communicator?.send('DISABLE_MENU_ITEM', items);
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
