const mockEmit = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    emit: mockEmit,
  }),
}));

import TopBarHintsController from './TopBarHintsController';

describe('test TopBarHintsController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('test setHint', () => {
    TopBarHintsController.setHint('POLYGON');
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'SET_HINT', 'POLYGON');
  });

  test('test removeHint', () => {
    TopBarHintsController.removeHint();
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'REMOVE_HINT');
  });
});
