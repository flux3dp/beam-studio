import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { type IProgressDialog, ProgressTypes } from '@core/interfaces/IProgress';

const eventEmitter = eventEmitterFactory.createEventEmitter('alert-progress');

export default {
  checkIdExist: (id: string): boolean => {
    const response = { result: false };

    eventEmitter.emit('CHECK_PROGRESS_EXIST', id, response);

    return response.result;
  },
  openMessage: (args: IProgressDialog): Promise<void> =>
    new Promise((resolve) => {
      eventEmitter.emit('OPEN_MESSAGE', { ...args, isProgress: true }, resolve);
    }),
  openNonstopProgress: async (args: IProgressDialog): Promise<void> => {
    if (!args.caption && args.message) {
      args.caption = args.message;
    }

    return new Promise((resolve) => {
      eventEmitter.emit('OPEN_PROGRESS', { ...args, isProgress: true, type: ProgressTypes.NONSTOP }, resolve);
    });
  },
  openSteppingProgress: (args: IProgressDialog): Promise<void> =>
    new Promise((resolve) => {
      eventEmitter.emit(
        'OPEN_PROGRESS',
        { ...args, isProgress: true, percentage: args.percentage || 0, type: ProgressTypes.STEPPING },
        resolve,
      );
    }),
  popById: (id: string): void => {
    eventEmitter.emit('POP_BY_ID', id);
  },
  popLastProgress: (): void => {
    eventEmitter.emit('POP_LAST_PROGRESS');
  },
  update: (id: string, args: IProgressDialog): void => {
    eventEmitter.emit('UPDATE_PROGRESS', id, args);
  },
};
