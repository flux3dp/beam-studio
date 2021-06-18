import { IMenuEventListenerFactory } from 'interfaces/IMenuEventListenerFactory';

import communicator from './communicator';

export default {
  createMenuEventListener() {
    return communicator;
  },
} as IMenuEventListenerFactory;
