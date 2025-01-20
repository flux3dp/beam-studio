import { menuItems } from '@core/app/constants/menuItems';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import shortcuts from '@core/helpers/shortcuts';

const eventEmitter = eventEmitterFactory.createEventEmitter('top-bar-menu');

for (const { action: id, shortcut, splitKey } of Object.values(menuItems)) {
  shortcuts.on(
    shortcut,
    () => {
      eventEmitter.emit('MENU_CLICK', null, { id });
    },
    { splitKey },
  );
}
