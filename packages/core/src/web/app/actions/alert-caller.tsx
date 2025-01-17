import alertConstants from 'app/constants/alert-constants';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import { IAlert } from 'interfaces/IAlert';

const eventEmitter = eventEmitterFactory.createEventEmitter('alert-progress');

const popUp = (args: IAlert): void => {
  if (!eventEmitter.listenerCount('POP_UP')) {
    setTimeout(() => popUp(args), 100);
  }
  eventEmitter.emit('POP_UP', args);
};

export default {
  popUp,
  popUpError: (args: IAlert): void => {
    popUp({
      ...args,
      type: alertConstants.SHOW_POPUP_ERROR,
    });
  },
  popById: (id: string): void => {
    eventEmitter.emit('POP_BY_ID', id);
  },
  checkIdExist: (id: string): boolean => {
    const response = {
      idExist: false,
    };
    eventEmitter.emit('CHECK_ID_EXIST', id, response);
    return response.idExist;
  },
};
