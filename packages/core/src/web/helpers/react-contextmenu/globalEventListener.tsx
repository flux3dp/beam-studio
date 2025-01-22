import { MENU_HIDE, MENU_SHOW } from './actions';
import { canUseDOM, hasOwnProp, uniqueId } from './helpers';

class GlobalEventListener {
  private callbacks: {
    [id: string]: {
      hide: (e: Event) => void;
      show: (e: Event) => void;
    };
  };

  constructor() {
    this.callbacks = {};

    if (canUseDOM) {
      window.addEventListener(MENU_SHOW, this.handleShowEvent);
      window.addEventListener(MENU_HIDE, this.handleHideEvent);
    }
  }

  handleShowEvent = (event) => {
    for (const id in this.callbacks) {
      if (hasOwnProp(this.callbacks, id)) {
        this.callbacks[id].show(event);
      }
    }
  };

  handleHideEvent = (event) => {
    for (const id in this.callbacks) {
      if (hasOwnProp(this.callbacks, id)) {
        this.callbacks[id].hide(event);
      }
    }
  };

  register = (showCallback, hideCallback) => {
    const id = uniqueId();

    this.callbacks[id] = {
      hide: hideCallback,
      show: showCallback,
    };

    return id;
  };

  unregister = (id) => {
    if (id && this.callbacks[id]) {
      delete this.callbacks[id];
    }
  };
}

export default new GlobalEventListener();
