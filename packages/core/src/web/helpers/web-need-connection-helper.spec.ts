import webNeedConnectionWrapper from './web-need-connection-helper';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockToggleUnsavedChangedDialog = jest.fn();

jest.mock('@core/helpers/file/export', () => ({
  toggleUnsavedChangedDialog: (...args) => mockToggleUnsavedChangedDialog(...args),
}));

const mockUpdateActiveKey = jest.fn();

jest.mock('@core/app/components/beambox/RightPanel/contexts/ObjectPanelController', () => ({
  updateActiveKey: (...args) => mockUpdateActiveKey(...args),
}));

const mockCheckConnection = jest.fn();

jest.mock('@core/helpers/api/discover', () => ({
  discoverManager: {
    checkConnection: (...args) => mockCheckConnection(...args),
  },
}));

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    alert: {
      oops: 'oops',
    },
    device_selection: {
      no_device_web: 'no_device_web',
    },
    topbar: {
      menu: {
        add_new_machine: 'add_new_machine',
      },
    },
  },
}));

const mockCallback = jest.fn();

describe('test webNeedConnectionWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call callback if version is not web', () => {
    window.FLUX.version = 'not web';
    webNeedConnectionWrapper(mockCallback);
    expect(mockCallback).toBeCalledTimes(1);
    expect(mockPopUp).not.toBeCalled();
  });

  it('should call callback if version is web and checkConnection return true', () => {
    window.FLUX.version = 'web';
    mockCheckConnection.mockReturnValue(true);
    webNeedConnectionWrapper(mockCallback);
    expect(mockCallback).toBeCalledTimes(1);
    expect(mockPopUp).not.toBeCalled();
  });

  it('should call callback if version is web and checkConnection return false', async () => {
    window.FLUX.version = 'web';
    mockCheckConnection.mockReturnValue(false);
    webNeedConnectionWrapper(mockCallback);
    expect(mockCallback).not.toBeCalled();
    expect(mockPopUp).toBeCalledTimes(1);

    const popUpCallback = mockPopUp.mock.calls[0][0].callbacks;

    await popUpCallback();
    expect(mockToggleUnsavedChangedDialog).toBeCalledTimes(1);
    expect(mockUpdateActiveKey).toBeCalledTimes(1);
  });
});
