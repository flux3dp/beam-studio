import i18n from '@mocks/@core/helpers/i18n';
import rawAndHome from './rawAndHome';

const mockEnterRawMode = jest.fn();
const mockRawLooseMotor = jest.fn();
const mockRawHomeZ = jest.fn();
const mockRawHomeCamera = jest.fn();
const mockRawMoveZRelToLastHome = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  get currentDevice() {
    return {
      info: {
        version: '1.0.0',
      },
    };
  },
  enterRawMode: (...args) => mockEnterRawMode(...args),
  rawHomeCamera: (...args) => mockRawHomeCamera(...args),
  rawHomeZ: (...args) => mockRawHomeZ(...args),
  rawLooseMotor: (...args) => mockRawLooseMotor(...args),
  rawMoveZRelToLastHome: (...args) => mockRawMoveZRelToLastHome(...args),
}));

const mockUpdateMessage = jest.fn();

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

  it('should work with updateMessage', async () => {
    await rawAndHome(mockUpdateMessage);
    expect(mockEnterRawMode).toHaveBeenCalledTimes(1);
    expect(mockRawHomeCamera).toHaveBeenCalledTimes(1);
    expect(mockRawLooseMotor).toHaveBeenCalledTimes(1);
    expect(mockUpdateMessage).toHaveBeenCalledTimes(2);
    expect(mockUpdateMessage).toHaveBeenNthCalledWith(1, i18n.lang.message.enteringRawMode);
    expect(mockUpdateMessage).toHaveBeenNthCalledWith(2, i18n.lang.message.homing);
  });

  it('should work with rotary mode', async () => {
    mockGetState.mockReturnValue({ rotary_mode: true });
    await rawAndHome(mockUpdateMessage);
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockEnterRawMode).toHaveBeenCalledTimes(1);
    expect(mockRawHomeZ).toHaveBeenCalledTimes(1);
    expect(mockRawHomeCamera).toHaveBeenCalledTimes(1);
    expect(mockRawMoveZRelToLastHome).toHaveBeenCalledTimes(1);
    expect(mockRawMoveZRelToLastHome).toHaveBeenLastCalledWith(0);
    expect(mockRawLooseMotor).toHaveBeenCalledTimes(1);
    expect(mockUpdateMessage).toHaveBeenCalledTimes(2);
    expect(mockUpdateMessage).toHaveBeenNthCalledWith(1, i18n.lang.message.enteringRawMode);
    expect(mockUpdateMessage).toHaveBeenNthCalledWith(2, i18n.lang.message.homing);
  });
});
