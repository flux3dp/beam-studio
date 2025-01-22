const mockEmit = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    emit: mockEmit,
  }),
}));

import ProgressConstants from '@core/app/constants/progress-constants';

import progressCaller from './progress-caller';

describe('test progress-caller', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('test openNonstopProgress', () => {
    progressCaller.openNonstopProgress({
      caption: 'flux caption',
      id: '12345',
      type: 'flux progress',
    });
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(
      1,
      'OPEN_PROGRESS',
      {
        caption: 'flux caption',
        id: '12345',
        isProgress: true,
        type: ProgressConstants.NONSTOP,
      },
      expect.anything(),
    );

    progressCaller.openNonstopProgress({
      id: '12345',
      message: 'flux message',
      type: 'flux progress',
    });
    expect(mockEmit).toHaveBeenCalledTimes(2);
    expect(mockEmit).toHaveBeenNthCalledWith(
      2,
      'OPEN_PROGRESS',
      {
        caption: 'flux message',
        id: '12345',
        isProgress: true,
        message: 'flux message',
        type: ProgressConstants.NONSTOP,
      },
      expect.anything(),
    );
  });

  test('test openSteppingProgress', () => {
    progressCaller.openSteppingProgress({
      id: '12345',
      percentage: 100,
      type: 'flux progress',
    });
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(
      1,
      'OPEN_PROGRESS',
      {
        id: '12345',
        isProgress: true,
        percentage: 100,
        type: ProgressConstants.STEPPING,
      },
      expect.anything(),
    );

    progressCaller.openSteppingProgress({
      id: '12345',
      type: 'flux progress',
    });
    expect(mockEmit).toHaveBeenCalledTimes(2);
    expect(mockEmit).toHaveBeenNthCalledWith(
      2,
      'OPEN_PROGRESS',
      {
        id: '12345',
        isProgress: true,
        percentage: 0,
        type: ProgressConstants.STEPPING,
      },
      expect.anything(),
    );
  });

  test('test popById', () => {
    progressCaller.popById('12345');
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'POP_BY_ID', '12345');
  });

  test('test popLastProgress', () => {
    progressCaller.popLastProgress();
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'POP_LAST_PROGRESS');
  });

  test('test popById', () => {
    progressCaller.update('12345', {
      id: '12345',
      type: 'flux progress',
    });
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'UPDATE_PROGRESS', '12345', {
      id: '12345',
      type: 'flux progress',
    });
  });
});
