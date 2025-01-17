/* eslint-disable import/first */
const mockEmit = jest.fn();
const mockListenerCount = jest.fn();
jest.mock('helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    emit: mockEmit,
    listenerCount: mockListenerCount,
  }),
}));

import alertConstants from 'app/constants/alert-constants';
import alertCaller from './alert-caller';

describe('test alert-caller', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('test popUp', () => {
    mockListenerCount.mockReturnValue(1);
    alertCaller.popUp({
      message: 'completed',
    });
    expect(mockListenerCount).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'POP_UP', {
      message: 'completed',
    });
  });

  test('test popUpError', () => {
    mockListenerCount.mockReturnValue(1);
    alertCaller.popUpError({
      message: 'failed',
    });
    expect(mockListenerCount).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'POP_UP', {
      message: 'failed',
      type: alertConstants.SHOW_POPUP_ERROR,
    });
  });

  test('test popById', () => {
    alertCaller.popById('12345');
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'POP_BY_ID', '12345');
  });

  test('test checkIdExist', () => {
    alertCaller.checkIdExist('12345');
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'CHECK_ID_EXIST', '12345', {
      idExist: false,
    });
  });
});
