import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import type { IMessage } from '@core/interfaces/IMessage';

export enum MessageLevel {
  OPEN,
  SUCCESS,
  ERROR,
  INFO,
  WARNING,
  LOADING,
}

const eventEmitter = eventEmitterFactory.createEventEmitter('alert-progress');
const MessageCaller = {
  checkIdExist: (id: string): boolean => {
    const response = { result: false };

    eventEmitter.emit('CHECK_PROGRESS_EXIST', id, response);

    return response.result;
  },
  closeMessage: (id: string): void => {
    eventEmitter.emit('CLOSE_MESSAGE', id);
  },
  openMessage: (args: IMessage): Promise<void> =>
    new Promise((resolve) => {
      eventEmitter.emit('OPEN_MESSAGE', { ...args }, resolve);
    }),
};

export default MessageCaller;
