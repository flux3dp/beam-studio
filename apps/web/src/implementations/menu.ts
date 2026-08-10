/* eslint-disable import/order */
import AbstractMenu from '@core/helpers/menubar/AbstractMenu';
import { useMenuItemStatusStore } from '@core/app/stores/menuItemStatusStore';

class Menu extends AbstractMenu {
  init(): void {
    this.initMenuEvents();
  }

  enable(items: string[]): void {
    useMenuItemStatusStore.getState().enable(items);
  }

  disable(items: string[]): void {
    useMenuItemStatusStore.getState().disable(items);
  }

  updateLanguage(): void {}
}

export default new Menu();
