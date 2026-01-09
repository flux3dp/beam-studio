import { sprintf } from 'sprintf-js';
import { shallow } from 'zustand/shallow';

import menuActions from '@core/app/actions/beambox/menuActions';
import menuDeviceActions from '@core/app/actions/beambox/menuDeviceActions';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { useDocumentStore } from '@core/app/stores/documentStore';
import DeviceMaster from '@core/helpers/device-master';
import { isAtPage } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';
import type { ExampleFileKey } from '@core/helpers/menubar/exampleFiles';
import { loadExampleFile } from '@core/helpers/menubar/exampleFiles';
import customMenuActionProvider from '@core/implementations/customMenuActionProvider';
import menuEventListenerFactory from '@core/implementations/menuEventListenerFactory';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

type MenuActions = { [key: string]: (device?: IDeviceInfo) => void };

const FILE_MENU_ITEMS = [
  'CLEAR_SCENE',
  'OPEN',
  'RECENT',
  'SHOW_MY_CLOUD',
  'SAVE_AS',
  'SAVE_SCENE',
  'SAVE_TO_CLOUD',
  'SAMPLES',
  'EXPORT_TO',
];
const EDIT_MENU_ITEMS = [
  'UNDO',
  'REDO',
  // 'CUT',
  // 'COPY',
  // 'PASTE',
  'PASTE_IN_PLACE',
  'DUPLICATE',
  'DELETE',
  'GROUP',
  'UNGROUP',
  'PATH',
  'PHOTO_EDIT',
  'SVG_EDIT',
  'LAYER',
  'DOCUMENT_SETTING',
  'ROTARY_SETUP',
];
const VIEW_MENU_ITEMS = [
  'ZOOM_IN',
  'ZOOM_OUT',
  'FITS_TO_WINDOW',
  'ZOOM_WITH_WINDOW',
  'SHOW_GRIDS',
  'SHOW_RULERS',
  'SHOW_LAYER_COLOR',
  'AUTO_ALIGN',
  'ANTI_ALIASING',
  'SHOW_LAYER_CONTROLS_PANEL',
  'SHOW_OBJECT_CONTROLS_PANEL',
  'SHOW_PATH_CONTROLS_PANEL',
  'RESET_LAYOUT',
];
const TOOLS_MENU_ITEMS = ['MATERIAL_TEST_GENERATOR', 'CODE_GENERATOR', 'BOX_GEN', 'START_CURVE_ENGRAVING_MODE'];

/**
 * Special menu items that should be disabled in certain pages
 *
 * Set `enabled: false` in electron menu and update them by attach/detach
 *
 * `enabled` in first-layer submenu won't take effect in Windows; list all items in the submenu
 */
const MENU_ITEMS = [
  ...FILE_MENU_ITEMS,
  ...EDIT_MENU_ITEMS,
  ...VIEW_MENU_ITEMS,
  ...TOOLS_MENU_ITEMS,
  'NETWORK_TESTING',
  // _help
  'START_TUTORIAL',
  'START_UI_INTRO',
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

      useDocumentStore.subscribe(
        (state) => [state.workarea, state.rotary_mode, state['auto-feeder'], state['pass-through']],
        this.checkCurveEngraving,
        { equalityFn: shallow },
      );
    }
  }

  attach(enabledItems?: string[]): void {
    let disabledItems: string[] = [];

    if (!enabledItems) {
      enabledItems = MENU_ITEMS;
    } else if (enabledItems.length === 0) {
      enabledItems = [];
      disabledItems = MENU_ITEMS;
    } else {
      for (const item of MENU_ITEMS) {
        if (!enabledItems.includes(item)) {
          disabledItems.push(item);
        }
      }
    }

    this.enable(enabledItems);
    this.disable(disabledItems);
  }

  detach(): void {
    this.disable(MENU_ITEMS);
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
