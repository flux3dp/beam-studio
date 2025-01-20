import type { IMenuEventListenerFactory } from '@core/interfaces/IMenuEventListenerFactory';

import communicator from './communicator';

export default {
  createMenuEventListener() {
    return communicator;
  },
} as IMenuEventListenerFactory;
