import i18n from '@mocks/@core/helpers/i18n';
import rawAndHome from './rawAndHome';

const mockEnterRawMode = jest.fn();
const mockRawSetRotary = jest.fn();
const mockRawHome = jest.fn();
const mockRawLooseMotor = jest.fn();
const mockRawHomeZ = jest.fn();
const mockRawMoveZRelToLastHome = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  enterRawMode: (...args) => mockEnterRawMode(...args),
  rawHome: (...args) => mockRawHome(...args),
  rawHomeZ: (...args) => mockRawHomeZ(...args),
  rawLooseMotor: (...args) => mockRawLooseMotor(...args),
  rawMoveZRelToLastHome: (...args) => mockRawMoveZRelToLastHome(...args),
  rawSetRotary: (...args) => mockRawSetRotary(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockUpdate = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
  update: (...args) => mockUpdate(...args),
}));

const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: {
    getState: () => mockGetState(),
  },
}));

describe('test rawAndHome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockReturnValue({ rotary_mode: false });
  });

  it('should work without progress id', async () => {
    await rawAndHome();
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockEnterRawMode).toHaveBeenCalledTimes(1);
    expect(mockRawSetRotary).toHaveBeenCalledTimes(1);
    expect(mockRawSetRotary).toHaveBeenLastCalledWith(false);
    expect(mockRawHome).toHaveBeenCalledTimes(1);
    expect(mockRawLooseMotor).toHaveBeenCalledTimes(1);
    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(1);
    expect(mockOpenNonstopProgress).toHaveBeenLastCalledWith({ id: 'raw-and-home' });
    expect(mockUpdate).toHaveBeenCalledTimes(3);
    expect(mockUpdate).toHaveBeenNthCalledWith(1, 'raw-and-home', { message: i18n.lang.message.enteringRawMode });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, 'preview-mode-controller', {
      message: i18n.lang.message.exitingRotaryMode,
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(3, 'preview-mode-controller', { message: i18n.lang.message.homing });
    expect(mockPopById).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenLastCalledWith('raw-and-home');
  });

  it('should work with progress id', async () => {
    await rawAndHome('progress-id');
    expect(mockEnterRawMode).toHaveBeenCalledTimes(1);
    expect(mockRawSetRotary).toHaveBeenCalledTimes(1);
    expect(mockRawSetRotary).toHaveBeenLastCalledWith(false);
    expect(mockRawHome).toHaveBeenCalledTimes(1);
    expect(mockRawLooseMotor).toHaveBeenCalledTimes(1);
    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(0);
    expect(mockUpdate).toHaveBeenCalledTimes(3);
    expect(mockUpdate).toHaveBeenNthCalledWith(1, 'progress-id', { message: i18n.lang.message.enteringRawMode });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, 'preview-mode-controller', {
      message: i18n.lang.message.exitingRotaryMode,
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(3, 'preview-mode-controller', { message: i18n.lang.message.homing });
    expect(mockPopById).toHaveBeenCalledTimes(0);
  });

  it('should work with rotary mode', async () => {
    mockGetState.mockReturnValue({ rotary_mode: true });
    await rawAndHome();
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockEnterRawMode).toHaveBeenCalledTimes(1);
    expect(mockRawSetRotary).toHaveBeenCalledTimes(1);
    expect(mockRawSetRotary).toHaveBeenLastCalledWith(false);
    expect(mockRawHomeZ).toHaveBeenCalledTimes(1);
    expect(mockRawHome).toHaveBeenCalledTimes(1);
    expect(mockRawMoveZRelToLastHome).toHaveBeenCalledTimes(1);
    expect(mockRawMoveZRelToLastHome).toHaveBeenLastCalledWith(0);
    expect(mockRawLooseMotor).toHaveBeenCalledTimes(1);
    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(1);
    expect(mockOpenNonstopProgress).toHaveBeenLastCalledWith({ id: 'raw-and-home' });
    expect(mockUpdate).toHaveBeenCalledTimes(3);
    expect(mockUpdate).toHaveBeenNthCalledWith(1, 'raw-and-home', { message: i18n.lang.message.enteringRawMode });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, 'preview-mode-controller', {
      message: i18n.lang.message.exitingRotaryMode,
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(3, 'preview-mode-controller', { message: i18n.lang.message.homing });
    expect(mockPopById).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenLastCalledWith('raw-and-home');
  });
});
