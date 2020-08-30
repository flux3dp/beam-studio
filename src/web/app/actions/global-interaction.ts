import FnWrapper from './beambox/svgeditor-function-wrapper';

let MENU_ITEMS = ["IMPORT", "EXPORT_FLUX_TASK", "SAVE_SCENE",
                    "UNDO", "DUPLICATE", 'PHOTO_EDIT', 'DOCUMENT_SETTING', "CLEAR_SCENE",
                    "ZOOM_IN", "ZOOM_OUT", "FITS_TO_WINDOW", "ZOOM_WITH_WINDOW", "SHOW_GRIDS", "SHOW_LAYER_COLOR",
                    "TUTORIAL", 'NETWORK_TESTING', 'ABOUT_BEAM_STUDIO']

var ipc, events, defaultAction, currentHandler;

const electron = window["electron"];

if (electron) {
    ipc = electron.ipc;
    events = electron.events;

    defaultAction = {
        PREFERENCE: () => {
            FnWrapper.toggleUnsavedChangedDialog(() => {
                location.hash = '#studio/settings';
            });   
        },
        ADD_NEW_MACHINE: () => {
            location.hash = '#initialize/connect/select-connection-type';
        },
        RELOAD_APP: () => {
            location.reload();
        },
    }

    ipc.on(events.MENU_CLICK, (event, menuItem, ...args) => {
        var action = defaultAction[menuItem.id];
        if(action) {
            action(menuItem.id, ...args);
        } else if(currentHandler) {
            currentHandler.trigger(menuItem.id, ...args);
        }
    });

    ipc.on('WINDOW_CLOSE', (event, e) => {
        const ipc = electron.ipc;
        FnWrapper.toggleUnsavedChangedDialog(() => {
            ipc.send('CLOSE_REPLY', true);
        });
    });
}

class GlobalInteraction {
    protected _actions: {};
    constructor() {
        this._actions = {};
    }
    attach(enabled_items) {
        currentHandler = this;
        if(ipc) {
            if(enabled_items) {
                var disabled_items = [];
                for(let item of MENU_ITEMS) {
                    if(enabled_items.indexOf(item) < 0) {
                        disabled_items.push(item);
                    }
                }
                this.enableMenuItems(enabled_items);
                this.disableMenuItems(disabled_items);
            } else {
                this.disableMenuItems(MENU_ITEMS);
            }
        }
    }
    detach() {
        if(currentHandler === this) {
            currentHandler = undefined;
            this.disableMenuItems(MENU_ITEMS);
        }
    }
    enableMenuItems(items) {
        if(ipc) {
            ipc.send(events.ENABLE_MENU_ITEM, items);
        }
    }
    disableMenuItems(items) {
        if(ipc) {
            ipc.send(events.DISABLE_MENU_ITEM, items);
        }
    }
    trigger(eventName, ...args) {
        var action = this._actions[eventName];
        if(action) {
            action(eventName, ...args);
            return true;
        } else {
            return false;
        }
    }
}

export default GlobalInteraction;
