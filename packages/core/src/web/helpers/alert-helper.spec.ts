import alertHelper from './alert-helper';

const mockEventEmitter = {
  on: jest.fn(),
};
const mockCreateEventEmitter = jest.fn(() => mockEventEmitter);

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => mockCreateEventEmitter(),
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: (...args) => mockOpen(...args),
}));

const mockConfigRead = jest.fn();
const mockConfigWrite = jest.fn();

jest.mock('@core/helpers/api/alert-config', () => ({
  read: (...args) => mockConfigRead(...args),
  write: (...args) => mockConfigWrite(...args),
}));

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockShowSocialMedia = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showSocialMedia: (...args) => mockShowSocialMedia(...args),
}));

describe('test alert helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should register alert events', () => {
    alertHelper.registerAlertEvents();
    expect(mockEventEmitter.on).toBeCalledTimes(1);
    expect(mockEventEmitter.on).toHaveBeenLastCalledWith('PLAY', expect.any(Function));
    expect(mockPopUp).not.toBeCalled();
  });

  test('should show invitation', () => {
    alertHelper.registerAlertEvents();

    const eventHandler = mockEventEmitter.on.mock.calls[0][1];

    expect(mockPopUp).not.toBeCalled();
    expect(mockConfigRead).not.toBeCalled();
    mockConfigRead.mockReturnValue(false);
    // Count = 1, show FB group invitation
    eventHandler();
    expect(mockConfigRead).toBeCalledTimes(1);
    expect(mockConfigRead).toHaveBeenLastCalledWith('skip-fb-group-invitation');
    expect(mockPopUp).toBeCalledTimes(1);
    expect(mockPopUp).toHaveBeenLastCalledWith({
      buttonLabels: ['Count Me In', 'Maybe Later', 'Already Joined'],
      callbacks: [expect.any(Function), expect.any(Function), expect.any(Function)],
      caption: 'Join FLUX Official User Group',
      checkbox: {
        callbacks: [expect.any(Function), expect.any(Function), expect.any(Function)],
        text: "Don't show again",
      },
      message:
        "Join our official Facebook group to connect with other FLUX laser users, discuss FLUX lasers, share laser artwork, and stay up to date with the latest updates on our products. We can't wait to see you there!",
      primaryButtonIndex: 0,
    });

    expect(mockConfigWrite).not.toBeCalled();
    expect(mockOpen).not.toBeCalled();

    const onJoinNow = mockPopUp.mock.calls[0][0].callbacks[0];

    onJoinNow();
    expect(mockConfigWrite).toBeCalledTimes(1);
    expect(mockConfigWrite).toBeCalledWith('skip-fb-group-invitation', true);
    expect(mockOpen).toBeCalledTimes(1);
    expect(mockOpen).toBeCalledWith('https://www.facebook.com/groups/flux.laser/');

    jest.clearAllMocks();
    // Count = 1~4, do nothing
    eventHandler();
    eventHandler();
    eventHandler();
    expect(mockConfigRead).not.toBeCalled();
    expect(mockPopUp).not.toBeCalled();

    // Count = 5, show social media invitation
    eventHandler();
    expect(mockConfigRead).toHaveBeenCalledTimes(1);
    expect(mockConfigRead).toHaveBeenLastCalledWith('skip-social-media-invitation');
    expect(mockShowSocialMedia).toHaveBeenCalledTimes(1);
    expect(mockShowSocialMedia).toHaveBeenLastCalledWith(true);
  });

  test('should not show invitation with skip config', () => {
    alertHelper.registerAlertEvents();

    const eventHandler = mockEventEmitter.on.mock.calls[0][1];

    expect(mockPopUp).not.toHaveBeenCalled();
    expect(mockConfigRead).not.toHaveBeenCalled();
    mockConfigRead.mockReturnValue(true);
    eventHandler();
    expect(mockConfigRead).toHaveBeenCalledTimes(1);
    expect(mockConfigRead).toHaveBeenLastCalledWith('skip-fb-group-invitation');
    expect(mockPopUp).not.toHaveBeenCalled();

    jest.clearAllMocks();
    eventHandler();
    eventHandler();
    eventHandler();
    expect(mockConfigRead).not.toHaveBeenCalled();
    expect(mockPopUp).not.toHaveBeenCalled();

    eventHandler();
    expect(mockConfigRead).toHaveBeenCalledTimes(1);
    expect(mockConfigRead).toHaveBeenLastCalledWith('skip-social-media-invitation');
    expect(mockShowSocialMedia).not.toHaveBeenCalled();
  });
});
