import eventEmitterFactory from 'helpers/eventEmitterFactory';
import { IMenuEventListenerFactory } from 'core-interfaces/IMenuEventListenerFactory';

export default {
  createMenuEventListener() {
    return eventEmitterFactory.createEventEmitter('top-bar-menu');
  },
} as IMenuEventListenerFactory;
