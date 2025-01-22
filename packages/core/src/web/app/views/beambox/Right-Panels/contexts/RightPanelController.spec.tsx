const emit = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    emit,
  }),
}));

import RightPanelController from './RightPanelController';

describe('test RightPanelController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('test setDisplayLayer', () => {
    RightPanelController.setDisplayLayer(true);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenNthCalledWith(1, 'DISPLAY_LAYER', true);
  });

  test('test updatePathEditPanel', () => {
    RightPanelController.updatePathEditPanel();
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenNthCalledWith(1, 'UPDATE_PATH_EDIT_PANEL');
  });
});
