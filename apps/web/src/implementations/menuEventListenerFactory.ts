import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import type { IMenuEventListenerFactory } from '@core/interfaces/IMenuEventListenerFactory';

export default {
  createMenuEventListener() {
    return eventEmitterFactory.createEventEmitter('top-bar-menu');
  },
} as IMenuEventListenerFactory;
