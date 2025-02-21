import { Menu as ElectronMenu } from '@electron/remote';

import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { TabEvents } from '@core/app/constants/tabConstants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import AbstractMenu from '@core/helpers/menubar/AbstractMenu';
import communicator from '@core/implementations/communicator';

import {
  changeMenuItemChecked,
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

class Menu extends AbstractMenu {
  private communicator;

  constructor(aCommunicator: any) {
    super();
    this.communicator = aCommunicator;
    communicator.on('UPDATE_MENU', () => {
      updateWindowsMenu();
    });
    communicator.on('NEW_APP_MENU', () => {
      updateWindowsMenu();
      this.initMenuItemStatus();
    });
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
    const shouldZoomWithWindow = BeamboxPreference.read('zoom_with_window');

    changeMenuItemChecked(['ZOOM_WITH_WINDOW'], shouldZoomWithWindow);

    const shouldShowGrids = BeamboxPreference.read('show_grids');

    changeMenuItemChecked(['SHOW_GRIDS'], shouldShowGrids);

    const shouldShowRulers = BeamboxPreference.read('show_rulers');

    changeMenuItemChecked(['SHOW_RULERS'], shouldShowRulers);

    const isUsingLayerColor = BeamboxPreference.read('use_layer_color');

    changeMenuItemChecked(['SHOW_LAYER_COLOR'], isUsingLayerColor);

    const isUsingAntiAliasing = BeamboxPreference.read('anti-aliasing');

    changeMenuItemChecked(['ANTI_ALIASING'], isUsingAntiAliasing);

    const isUsingAutoAlign = BeamboxPreference.read('auto_align');

    changeMenuItemChecked(['AUTO_ALIGN'], isUsingAutoAlign);

    // visibility
    canvasEvent.on('model-changed', (model) => {
      const isBb2 = model === 'fbb2';
      const isPromark = model === 'fpm1';

      changeVisibilityByIsBb2(isBb2);
      changeVisibilityByIsPromark(isPromark);
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
