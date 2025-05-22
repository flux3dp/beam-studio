import alertConstants from '@core/app/constants/alert-constants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import type { IAlert } from '@core/interfaces/IAlert';

const eventEmitter = eventEmitterFactory.createEventEmitter('alert-progress');

const popUp = (args: IAlert): void => {
  if (!eventEmitter.listenerCount('POP_UP')) {
    setTimeout(() => popUp(args), 100);
  }

  eventEmitter.emit('POP_UP', args);
};

export default {
  checkIdExist: (id: string): boolean => {
    const response = { idExist: false };

    eventEmitter.emit('CHECK_ID_EXIST', id, response);

    return response.idExist;
  },
  popById: (id: string): void => {
    eventEmitter.emit('POP_BY_ID', id);
  },
  popUp,
  popUpError: (args: IAlert): void => popUp({ ...args, type: alertConstants.SHOW_POPUP_ERROR }),
};
