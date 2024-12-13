// eslint-disable-next-line import/no-extraneous-dependencies
import { Menu as ElectronMenu } from '@electron/remote';

import AbstractMenu from 'helpers/menubar/AbstractMenu';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';

import communicator from 'implementations/communicator';
import { TabEvents } from 'app/constants/tabConstants';

import ElectronUpdater from './electron-updater';
import { updateCheckbox } from '../electron-menubar-helper';

const updateWindowsMenu = () => {
  if (window.os === 'Windows') window.titlebar?.updateMenu(ElectronMenu.getApplicationMenu());
};

class Menu extends AbstractMenu {
  private communicator;

  constructor(aCommunicator) {
    super();
    this.communicator = aCommunicator;
    communicator.on('UPDATE_MENU', () => {
      updateWindowsMenu();
    });
    communicator.on('NEW_APP_MENU', () => {
      updateWindowsMenu();
      this.initCheckboxs();
    });
    communicator.on(TabEvents.TabFocused, () => {
      this.initCheckboxs();
    });
  }

  init(): void {
    const isDev = localStorage.getItem('dev') === 'true';
    this.setDevMode(isDev);
    this.initCheckboxs();
    this.initMenuEvents();
  }

  initCheckboxs = (): void => {
    const shouldZoomWithWindow = BeamboxPreference.read('zoom_with_window');
    updateCheckbox(['_view', 'ZOOM_WITH_WINDOW'], shouldZoomWithWindow);
    const shouldShowGrids = BeamboxPreference.read('show_grids');
    updateCheckbox(['_view', 'SHOW_GRIDS'], shouldShowGrids);
    const shouldShowRulers = BeamboxPreference.read('show_rulers');
    updateCheckbox(['_view', 'SHOW_RULERS'], shouldShowRulers);
    const isUsingLayerColor = BeamboxPreference.read('use_layer_color');
    updateCheckbox(['_view', 'SHOW_LAYER_COLOR'], isUsingLayerColor);
    const isUsingAntiAliasing = BeamboxPreference.read('anti-aliasing');
    updateCheckbox(['_view', 'ANTI_ALIASING'], isUsingAntiAliasing);
    const shouldShowAlignLines = BeamboxPreference.read('show_align_lines');
    updateCheckbox(['_view', 'ALIGN_TO_EDGES'], shouldShowAlignLines);
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
