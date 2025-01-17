/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { store } from './helpers';

export const MENU_SHOW = 'REACT_CONTEXTMENU_SHOW';
export const MENU_HIDE = 'REACT_CONTEXTMENU_HIDE';

export function dispatchGlobalEvent(
  eventName: string,
  opts,
  target: Element | Window = window,
): void {
  // Compatibale with IE
  // @see http://stackoverflow.com/questions/26596123/internet-explorer-9-10-11-event-constructor-doesnt-work
  let event;

  if (typeof window.CustomEvent === 'function') {
    event = new window.CustomEvent(eventName, { detail: opts });
  } else {
    event = document.createEvent('CustomEvent');
    event.initCustomEvent(eventName, false, true, opts);
  }

  if (target) {
    target.dispatchEvent(event);
    Object.assign(store, opts);
  }
}

export function showMenu(opts = {}, target?: Element): void {
  dispatchGlobalEvent(MENU_SHOW, { ...opts, type: MENU_SHOW }, target);
}

export function hideMenu(opts = {}, target?: Element): void {
  dispatchGlobalEvent(MENU_HIDE, { ...opts, type: MENU_HIDE }, target);
}
