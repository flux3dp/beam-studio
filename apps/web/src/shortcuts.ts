/* eslint-disable no-restricted-syntax */
import { menuItems } from 'app/constants/menuItems';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import shortcuts from 'helpers/shortcuts';

const eventEmitter = eventEmitterFactory.createEventEmitter('top-bar-menu');

for (const { shortcut, action: id, splitKey } of Object.values(menuItems)) {
  shortcuts.on(shortcut, () => {
    eventEmitter.emit('MENU_CLICK', null, { id });
  }, { splitKey });
}
