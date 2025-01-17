import customMenuActionProvider from 'implementations/customMenuActionProvider';
import DeviceMaster from 'helpers/device-master';
import menuActions from 'app/actions/beambox/menuActions';
import menuDeviceActions from 'app/actions/beambox/menuDeviceActions';
import menuEventListenerFactory from 'implementations/menuEventListenerFactory';
import { IDeviceInfo } from 'interfaces/IDevice';
import MessageCaller, { MessageLevel } from 'app/actions/message-caller';
import i18n from 'helpers/i18n';
import { sprintf } from 'sprintf-js';

const MENU_ITEMS = ['IMPORT', 'EXPORT_FLUX_TASK', 'SAVE_SCENE',
  'UNDO', 'DUPLICATE', 'PHOTO_EDIT', 'DOCUMENT_SETTING', 'CLEAR_SCENE',
  'ZOOM_IN', 'ZOOM_OUT', 'FITS_TO_WINDOW', 'ZOOM_WITH_WINDOW', 'SHOW_GRIDS', 'SHOW_LAYER_COLOR',
  'NETWORK_TESTING', 'ABOUT_BEAM_STUDIO'];

export default abstract class AbstractMenu {
  abstract init(): void;

  abstract enable(items: string[]): void;

  abstract disable(items: string[]): void;

  abstract updateLanguage(): void;

  private menuEventRegistered = false;

  protected initMenuEvents(): void {
    const registerMenuClickEvents = () => {
      this.menuEventRegistered = true;
      const menuEventListener = menuEventListenerFactory.createMenuEventListener();

      menuEventListener.on('MENU_CLICK', (e, menuItem) => {
        const actions: { [key: string]: ((device?: IDeviceInfo) => void) } = {
          ...menuActions,
          ...menuDeviceActions,
          ...customMenuActionProvider.getCustomMenuActions(),
        };

        if (typeof actions[menuItem.id] === 'function') {
          const menuActionIds = Object.entries(actions)
            .filter((action) => action[1].length === 0)
            .map((action) => action[0]);
          if (menuActionIds.includes(menuItem.id)) {
            actions[menuItem.id]();
          } else {
            const callback = {
              timeout: 20000,
              onSuccess: (device) => {
                setTimeout(() => MessageCaller.closeMessage('select-device'), 500);
                actions[menuItem.id](device);
              },
              onTimeout: () => {
                MessageCaller.openMessage({
                  key: 'select-device',
                  content: i18n.lang.message.connectionTimeout,
                  level: MessageLevel.ERROR,
                  duration: 10,
                });
                console.log('select device timeout');
              },
            };

            MessageCaller.openMessage({
              key: 'select-device',
              content: sprintf(i18n.lang.message.connectingMachine, menuItem.machineName),
              level: MessageLevel.LOADING,
              duration: 20,
            });
            if (menuItem.serial) DeviceMaster.getDiscoveredDevice('serial', menuItem.serial, callback);
            else DeviceMaster.getDiscoveredDevice('uuid', menuItem.uuid, callback);
          }
        }
      });
    };

    if (!this.menuEventRegistered) {
      registerMenuClickEvents();
    }
  }

  attach(enabledItems: string[]): void {
    const disabledItems = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const item of MENU_ITEMS) {
      if (enabledItems.indexOf(item) < 0) {
        disabledItems.push(item);
      }
    }
    this.enable(enabledItems);
    this.disable(disabledItems);
  }

  detach(): void {
    this.disable(MENU_ITEMS);
  }
}
