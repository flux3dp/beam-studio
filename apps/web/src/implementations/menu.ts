/* eslint-disable import/order */
import AbstractMenu from 'helpers/menubar/AbstractMenu';
import eventEmitterFactory from 'helpers/eventEmitterFactory';

class Menu extends AbstractMenu {
  private eventEmitter;

  constructor() {
    super();
    this.eventEmitter = eventEmitterFactory.createEventEmitter('top-bar-menu');
  }

  init(): void {
    this.initMenuEvents();
  }

  enable(items: string[]): void {
    this.eventEmitter.emit('ENABLE_MENU_ITEM', items);
  }

  disable(items: string[]): void {
    this.eventEmitter.emit('DISABLE_MENU_ITEM', items);
  }

  updateLanguage(): void {
    this.eventEmitter.emit('UPDATE_LANGUAGE');
  }
}

export default new Menu();
