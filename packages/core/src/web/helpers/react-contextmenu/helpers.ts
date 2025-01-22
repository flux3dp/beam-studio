export function callIfExists(func, ...args) {
  return typeof func === 'function' && func(...args);
}

export function hasOwnProp(obj, prop): boolean {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function uniqueId(): string {
  return Math.random().toString(36).substring(7);
}

export const cssClasses = {
  menu: 'react-contextmenu',
  menuItem: 'react-contextmenu-item',
  menuItemActive: 'react-contextmenu-item--active',
  menuItemDisabled: 'react-contextmenu-item--disabled',
  menuItemDivider: 'react-contextmenu-item--divider',
  menuItemSelected: 'react-contextmenu-item--selected',
  menuVisible: 'react-contextmenu--visible',
  menuWrapper: 'react-contextmenu-wrapper',
  subMenu: 'react-contextmenu-submenu',
};

export const store: any = {};

export const canUseDOM = Boolean(typeof window !== 'undefined' && window.document && window.document.createElement);
