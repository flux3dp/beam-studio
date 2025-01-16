// eslint-disable-next-line import/no-extraneous-dependencies
import { Menu as ElectronMenu } from '@electron/remote';

import AbstractMenu from 'helpers/menubar/AbstractMenu';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';

import communicator from 'implementations/communicator';
import { TabEvents } from 'app/constants/tabConstants';

import eventEmitterFactory from 'helpers/eventEmitterFactory';
import ElectronUpdater from './electron-updater';
import { changeMenuItemVisibility, updateCheckbox } from '../electron-menubar-helper';

const updateWindowsMenu = () => {
  if (window.os === 'Windows') window.titlebar?.updateMenu(ElectronMenu.getApplicationMenu());
};

const canvasEvent = eventEmitterFactory.createEventEmitter('canvas');

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
    // visibility
    const isBb2 = BeamboxPreference.read('model') === 'fbb2';

    changeMenuItemVisibility(['_file', 'SAMPLES', 'EXAMPLE_FILES', 'IMPORT_EXAMPLE_BEAMBOX_2'], isBb2);
    changeMenuItemVisibility(['_file', 'SAMPLES', 'MATERIAL_TEST', 'IMPORT_MATERIAL_TESTING_ENGRAVE_BEAMBOX_2'], isBb2);
    changeMenuItemVisibility(['_file', 'SAMPLES', 'MATERIAL_TEST', 'IMPORT_MATERIAL_TESTING_CUT_BEAMBOX_2'], isBb2);

    changeMenuItemVisibility(['_file', 'SAMPLES', 'MATERIAL_TEST', 'IMPORT_MATERIAL_TESTING_ENGRAVE'], !isBb2);
    changeMenuItemVisibility(['_file', 'SAMPLES', 'MATERIAL_TEST', 'IMPORT_MATERIAL_TESTING_CUT'], !isBb2);

    canvasEvent.on('model-changed',(model) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const isBb2 = model === 'fbb2';
      changeMenuItemVisibility(['_file', 'SAMPLES', 'EXAMPLE_FILES', 'IMPORT_EXAMPLE_BEAMBOX_2'], isBb2);
    changeMenuItemVisibility(['_file', 'SAMPLES', 'MATERIAL_TEST', 'IMPORT_MATERIAL_TESTING_ENGRAVE_BEAMBOX_2'], isBb2);
    changeMenuItemVisibility(['_file', 'SAMPLES', 'MATERIAL_TEST', 'IMPORT_MATERIAL_TESTING_CUT_BEAMBOX_2'], isBb2);

    changeMenuItemVisibility(['_file', 'SAMPLES', 'MATERIAL_TEST', 'IMPORT_MATERIAL_TESTING_ENGRAVE'], !isBb2);
    changeMenuItemVisibility(['_file', 'SAMPLES', 'MATERIAL_TEST', 'IMPORT_MATERIAL_TESTING_CUT'], !isBb2);
    })

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
