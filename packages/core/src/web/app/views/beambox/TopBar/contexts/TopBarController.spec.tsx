import TopBarController from './TopBarController';

const mockEmit = jest.fn();
const mockOn = jest.fn();
const mockRemoveListener = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    emit: (...args) => mockEmit(...args),
    on: (...args) => mockOn(...args),
    removeListener: (...args) => mockRemoveListener(...args),
  }),
}));

const mockOnObjectBlur = jest.fn();
const mockOnObjectFocus = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-global-interaction', () => ({
  onObjectBlur: (...args) => mockOnObjectBlur(...args),
  onObjectFocus: (...args) => mockOnObjectFocus(...args),
}));

describe('test TopBarController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('test setElement null', () => {
    TopBarController.setElement(null);
    expect(mockOnObjectBlur).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'SET_ELEMENT', null);
  });

  test('test setElement', () => {
    const testElem = document.createElement('div');

    TopBarController.setElement(testElem);
    expect(mockOnObjectBlur).toHaveBeenCalledTimes(1);
    expect(mockOnObjectFocus).toBeCalledTimes(1);
    expect(mockOnObjectFocus).toHaveBeenLastCalledWith([testElem]);
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'SET_ELEMENT', testElem);
  });

  test('test updateTitle', () => {
    TopBarController.updateTitle('name', true);
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'UPDATE_TITLE', 'name', true);
  });

  test('test setHasUnsavedChange', () => {
    TopBarController.setHasUnsavedChange(true);
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'SET_HAS_UNSAVED_CHANGE', true);
  });

  test('test getSelectedDevice', () => {
    TopBarController.getSelectedDevice();
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'GET_SELECTED_DEVICE', { selectedDevice: null });
  });

  test('test setSelectedDevice', () => {
    const mockDevice: any = { name: 'ABC' };

    TopBarController.setSelectedDevice(mockDevice);
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'SET_SELECTED_DEVICE', mockDevice);
  });

  test('test onTitleChange', () => {
    const mockHandler = jest.fn();

    TopBarController.onTitleChange(mockHandler);
    expect(mockOn).toHaveBeenCalledTimes(1);
    expect(mockOn).toHaveBeenNthCalledWith(1, 'UPDATE_TITLE', mockHandler);
  });

  test('test offTitleChange', () => {
    const mockHandler = jest.fn();

    TopBarController.offTitleChange(mockHandler);
    expect(mockRemoveListener).toHaveBeenCalledTimes(1);
    expect(mockRemoveListener).toHaveBeenNthCalledWith(1, 'UPDATE_TITLE', mockHandler);
  });
});
