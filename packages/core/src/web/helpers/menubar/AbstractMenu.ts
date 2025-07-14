import { sprintf } from 'sprintf-js';

import menuActions from '@core/app/actions/beambox/menuActions';
import menuDeviceActions from '@core/app/actions/beambox/menuDeviceActions';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import DeviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { ExampleFileKey } from '@core/helpers/menubar/exampleFiles';
import { loadExampleFile } from '@core/helpers/menubar/exampleFiles';
import customMenuActionProvider from '@core/implementations/customMenuActionProvider';
import menuEventListenerFactory from '@core/implementations/menuEventListenerFactory';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

type MenuActions = { [key: string]: (device?: IDeviceInfo) => void };

const MENU_ITEMS = [
  'IMPORT',
  'EXPORT_FLUX_TASK',
  'SAVE_SCENE',
  'UNDO',
  'DUPLICATE',
  'PHOTO_EDIT',
  'DOCUMENT_SETTING',
  'CLEAR_SCENE',
  'ZOOM_IN',
  'ZOOM_OUT',
  'FITS_TO_WINDOW',
  'ZOOM_WITH_WINDOW',
  'SHOW_GRIDS',
  'SHOW_LAYER_COLOR',
  'NETWORK_TESTING',
  'ABOUT_BEAM_STUDIO',
];

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

      menuEventListener.on(
        'MENU_CLICK',
        (
          _: any,
          menuItem: {
            id: string;
            machineName?: string;
            serial?: string;
            uuid?: string;
          },
        ) => {
          const actionId = menuItem.id;
          const commonActions: MenuActions = {
            ...menuActions,
            ...customMenuActionProvider.getCustomMenuActions(),
          };

          if (commonActions[actionId]) {
            commonActions[actionId]();
          } else if ((menuDeviceActions as MenuActions)[actionId]) {
            const callback = {
              onSuccess: (device: IDeviceInfo) => {
                setTimeout(() => MessageCaller.closeMessage('select-device'), 500);
                (menuDeviceActions as MenuActions)[actionId](device);
              },
              onTimeout: () => {
                MessageCaller.openMessage({
                  content: i18n.lang.message.connectionTimeout,
                  duration: 10,
                  key: 'select-device',
                  level: MessageLevel.ERROR,
                });
                console.log('select device timeout');
              },
              timeout: 20000,
            };

            MessageCaller.openMessage({
              content: sprintf(i18n.lang.message.connectingMachine, menuItem.machineName),
              duration: 20,
              key: 'select-device',
              level: MessageLevel.LOADING,
            });

            if (menuItem.serial) {
              DeviceMaster.getDiscoveredDevice('serial', menuItem.serial, callback);
            } else {
              DeviceMaster.getDiscoveredDevice('uuid', menuItem.uuid!, callback);
            }
          } else {
            loadExampleFile(actionId as ExampleFileKey);
          }
        },
      );
    };

    if (!this.menuEventRegistered) {
      registerMenuClickEvents();
    }
  }

  attach(enabledItems: string[]): void {
    const disabledItems = [];

    for (const item of MENU_ITEMS) {
      if (!enabledItems.includes(item)) {
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
