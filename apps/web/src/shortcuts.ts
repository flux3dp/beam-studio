import { MenuEvents } from '@core/app/constants/ipcEvents';
import { menuItems } from '@core/app/constants/menuItems';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import shortcuts from '@core/helpers/shortcuts';

const eventEmitter = eventEmitterFactory.createEventEmitter('top-bar-menu');

for (const { action: id, shortcut, splitKey } of Object.values(menuItems)) {
  if (id === 'PASTE') {
    // Use document.addEventListener('paste', ...) in svg-editor.ts
    continue;
  }

  shortcuts.on(
    shortcut,
    () => {
      eventEmitter.emit(MenuEvents.MenuClick, null, { id });
    },
    { splitKey },
  );
}
