/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export function callIfExists(func, ...args) {
  return (typeof func === 'function') && func(...args);
}

export function hasOwnProp(obj, prop): boolean {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function uniqueId(): string {
  return Math.random().toString(36).substring(7);
}

export const cssClasses = {
  menu: 'react-contextmenu',
  menuVisible: 'react-contextmenu--visible',
  menuWrapper: 'react-contextmenu-wrapper',
  menuItem: 'react-contextmenu-item',
  menuItemActive: 'react-contextmenu-item--active',
  menuItemDisabled: 'react-contextmenu-item--disabled',
  menuItemDivider: 'react-contextmenu-item--divider',
  menuItemSelected: 'react-contextmenu-item--selected',
  subMenu: 'react-contextmenu-submenu',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const store: any = {};

export const canUseDOM = Boolean(
  typeof window !== 'undefined' && window.document && window.document.createElement,
);
