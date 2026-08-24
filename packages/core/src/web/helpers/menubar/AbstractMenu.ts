import { sprintf } from 'sprintf-js';
import { shallow } from 'zustand/shallow';

import menuActions from '@core/app/actions/beambox/menuActions';
import menuDeviceActions from '@core/app/actions/beambox/menuDeviceActions';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { MenuEvents } from '@core/app/constants/ipcEvents';
import { useDocumentStore } from '@core/app/stores/documentStore';
import DeviceMaster from '@core/helpers/device-master';
import { isAtPage } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';
import type { ExampleFileKey } from '@core/helpers/menubar/exampleFiles';
import { loadExampleFile } from '@core/helpers/menubar/exampleFiles';
import { MENU_ITEMS } from '@core/helpers/menubar/menuItemStatus';
import customMenuActionProvider from '@core/implementations/customMenuActionProvider';
import menuEventListenerFactory from '@core/implementations/menuEventListenerFactory';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

type MenuActions = { [key: string]: (device?: IDeviceInfo) => void };

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
        MenuEvents.MenuClick,
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

      useDocumentStore.subscribe(
        (state) => [state.workarea, state.rotary_mode, state['auto-feeder'], state['pass-through']],
        this.checkCurveEngraving,
        { equalityFn: shallow },
      );
    }
  }

  attach(enabledItems?: string[]): void {
    let itemsToEnable: string[] = [];
    let itemsToDisable: string[] = [];

    if (!enabledItems) {
      itemsToEnable = [...MENU_ITEMS];
    } else if (enabledItems.length === 0) {
      itemsToDisable = [...MENU_ITEMS];
    } else {
      itemsToEnable = enabledItems;
      itemsToDisable = MENU_ITEMS.filter((item) => !enabledItems.includes(item));
    }

    this.enable(itemsToEnable);
    this.disable(itemsToDisable);
  }

  detach(): void {
    this.disable([...MENU_ITEMS]);
  }

  checkCurveEngraving = () => {
    const documentStore = useDocumentStore.getState();
    const workarea = documentStore.workarea;
    const addOnInfo = getAddOnInfo(workarea);
    let supportCurveEngraving = Boolean(addOnInfo.curveEngraving) && isAtPage('editor');

    if (supportCurveEngraving) {
      const isRotary = documentStore.rotary_mode && Boolean(addOnInfo.rotary);
      const isAutoFeeder = documentStore['auto-feeder'] && Boolean(addOnInfo.autoFeeder);
      const isPassThrough = documentStore['pass-through'] && Boolean(addOnInfo.passThrough);

      supportCurveEngraving = !(isAutoFeeder || isRotary || isPassThrough);
    }

    if (supportCurveEngraving) {
      this.enable(['START_CURVE_ENGRAVING_MODE']);
    } else {
      this.disable(['START_CURVE_ENGRAVING_MODE']);
    }
  };
}
