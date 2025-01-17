import ProgressConstants from 'app/constants/progress-constants';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import { IProgressDialog } from 'interfaces/IProgress';

const eventEmitter = eventEmitterFactory.createEventEmitter('alert-progress');
export default {
  openNonstopProgress: async (args: IProgressDialog): Promise<void> => {
    if (!args.caption && args.message) {
      // eslint-disable-next-line no-param-reassign
      args.caption = args.message;
    }
    return new Promise((resolve) => {
      eventEmitter.emit('OPEN_PROGRESS', {
        ...args,
        isProgress: true,
        type: ProgressConstants.NONSTOP,
      }, resolve);
    });
  },
  openSteppingProgress: (args: IProgressDialog): Promise<void> => new Promise((resolve) => {
    eventEmitter.emit('OPEN_PROGRESS', {
      ...args,
      isProgress: true,
      type: ProgressConstants.STEPPING,
      percentage: args.percentage || 0,
    }, resolve);
  }),
  openMessage: (args: IProgressDialog): Promise<void> => new Promise((resolve) => {
    eventEmitter.emit('OPEN_MESSAGE', {
      ...args,
      isProgress: true,
    }, resolve);
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
  checkIdExist: (id: string): boolean => {
    const response = {
      result: false,
    };
    eventEmitter.emit('CHECK_PROGRESS_EXIST', id, response);
    return response.result;
  },
};
