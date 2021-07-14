// eslint-disable-next-line import/no-extraneous-dependencies
import electron from 'electron';

import AbstractMenu from 'helpers/menubar/AbstractMenu';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';

import communicator from 'implementations/communicator';
import ElectronUpdater from '../electron-updater';
import { updateCheckbox } from '../electron-menubar-helper';

const { remote } = electron;

class Menu extends AbstractMenu {
  private communicator;

  constructor(aCommunicator) {
    super();
    this.communicator = aCommunicator;
  }

  init(): void {
    const shouldShowRulers = !!BeamboxPreference.read('show_rulers');
    updateCheckbox(['_view', 'SHOW_RULERS'], shouldShowRulers);
    const isUsingLayerColor = BeamboxPreference.read('use_layer_color');
    updateCheckbox(['_view', 'SHOW_LAYER_COLOR'], isUsingLayerColor);
    const isUsingAntiAliasing = BeamboxPreference.read('anti-aliasing') !== false;
    updateCheckbox(['_view', 'ANTI_ALIASING'], isUsingAntiAliasing);

    this.initMenuEvents();
  }

  attach(enabledItems: string[]) {
    super.attach(enabledItems);
    ElectronUpdater.autoCheck();
  }

  enable(items: string[]): void {
    if (this.communicator) {
      this.communicator.send('ENABLE_MENU_ITEM', items);
    }
  }

  disable(items: string[]): void {
    if (this.communicator) {
      this.communicator.send('DISABLE_MENU_ITEM', items);
    }
  }

  updateLanguage(): void {
    if (this.communicator) {
      this.communicator.send('NOTIFY_LANGUAGE');
      if (window.os === 'Windows') {
        window.titlebar.updateMenu(remote.Menu.getApplicationMenu());
      }
    }
  }
}

export default new Menu(communicator);
