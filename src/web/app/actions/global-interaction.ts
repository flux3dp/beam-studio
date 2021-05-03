/* eslint-disable class-methods-use-this */
import windowLocationReload from 'app/actions/windowLocation';
import fileExportHelper from 'helpers/file-export-helper';
import dialogCaller from './dialog-caller';

const MENU_ITEMS = ['IMPORT', 'EXPORT_FLUX_TASK', 'SAVE_SCENE',
  'UNDO', 'DUPLICATE', 'PHOTO_EDIT', 'DOCUMENT_SETTING', 'CLEAR_SCENE',
  'ZOOM_IN', 'ZOOM_OUT', 'FITS_TO_WINDOW', 'ZOOM_WITH_WINDOW', 'SHOW_GRIDS', 'SHOW_LAYER_COLOR',
  'TUTORIAL', 'NETWORK_TESTING', 'ABOUT_BEAM_STUDIO'];

let ipc;
let events;
let defaultAction;
let currentHandler;

const { electron } = window;

if (electron) {
  ipc = electron.ipc;
  events = electron.events;

  defaultAction = {
    PREFERENCE: async () => {
      dialogCaller.clearAllDialogComponents();
      const res = await fileExportHelper.toggleUnsavedChangedDialog();
      if (res) window.location.hash = '#studio/settings';
    },
    ADD_NEW_MACHINE: async () => {
      const res = await fileExportHelper.toggleUnsavedChangedDialog();
      if (res) window.location.hash = '#initialize/connect/select-connection-type';
    },
    RELOAD_APP: () => {
      windowLocationReload();
    },
  };

  ipc.on(events.MENU_CLICK, (event, menuItem, ...args) => {
    const action = defaultAction[menuItem.id];
    if (action) {
      action(menuItem.id, ...args);
    } else if (currentHandler) {
      currentHandler.trigger(menuItem.id, ...args);
    }
  });

  ipc.on('WINDOW_CLOSE', async () => {
    const res = await fileExportHelper.toggleUnsavedChangedDialog();
    if (res) ipc.send('CLOSE_REPLY', true);
  });
}

class GlobalInteraction {
  protected actions: { [key: string]: (eventName?:string, args?) => void };

  constructor() {
    this.actions = {};
  }

  attach(enabledItems: string[]): void {
    currentHandler = this;
    if (ipc) {
      if (enabledItems) {
        const disabledItems = [];
        for (let i = 0; i < MENU_ITEMS.length; i += 1) {
          const item = MENU_ITEMS[i];
          if (enabledItems.indexOf(item) < 0) {
            disabledItems.push(item);
          }
        }
        this.enableMenuItems(enabledItems);
        this.disableMenuItems(disabledItems);
      } else {
        this.disableMenuItems(MENU_ITEMS);
      }
    }
  }

  detach(): void {
    if (currentHandler === this) {
      currentHandler = undefined;
      this.disableMenuItems(MENU_ITEMS);
    }
  }

  enableMenuItems(items: string[]): void {
    if (ipc) {
      ipc.send(events.ENABLE_MENU_ITEM, items);
    }
  }

  disableMenuItems(items: string[]): void {
    if (ipc) {
      ipc.send(events.DISABLE_MENU_ITEM, items);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  trigger(eventName: string, ...args): boolean {
    const action = this.actions[eventName];
    if (action) {
      action(eventName, ...args);
      return true;
    }
    return false;
  }
}

export default GlobalInteraction;
