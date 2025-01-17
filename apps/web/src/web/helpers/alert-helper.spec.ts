import alertHelper from './alert-helper';

const mockEventEmitter = {
  on: jest.fn(),
};
const mockCreateEventEmitter = jest.fn(() => mockEventEmitter);
jest.mock('helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => mockCreateEventEmitter(),
}));

const mockOpen = jest.fn();
jest.mock('implementations/browser', () => ({
  open: (...args) => mockOpen(...args),
}));

const mockConfigRead = jest.fn();
const mockConfigWrite = jest.fn();
jest.mock('helpers/api/alert-config', () => ({
  read: (...args) => mockConfigRead(...args),
  write: (...args) => mockConfigWrite(...args),
}));

const mockPopUp = jest.fn();
jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      popup: {
        facebook_group_invitation: {
          title: 'title',
          message: 'message',
          join_now: 'join_now',
          later: 'later',
          already_joined: 'already_joined',
          dont_show_again: 'dont_show_again',
        },
      },
    },
    topbar: {
      menu: {
        link: {
          forum: 'forum',
        },
      },
    },
  },
}));

describe('test alert helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should register alert events', () => {
    alertHelper.registerAlertEvents(mockPopUp);
    expect(mockEventEmitter.on).toBeCalledTimes(1);
    expect(mockEventEmitter.on).toHaveBeenLastCalledWith('PLAY', expect.any(Function));
    expect(mockPopUp).not.toBeCalled();
  });

  test('should show facebook group invitation', () => {
    alertHelper.registerAlertEvents(mockPopUp);
    const eventHandler = mockEventEmitter.on.mock.calls[0][1];
    expect(mockPopUp).not.toBeCalled();
    expect(mockConfigRead).not.toBeCalled();
    mockConfigRead.mockReturnValue(false);
    eventHandler();
    expect(mockConfigRead).toBeCalledTimes(1);
    expect(mockConfigRead).toHaveBeenLastCalledWith('skip-fb-group-invitation');
    expect(mockPopUp).toBeCalledTimes(1);
    expect(mockPopUp).toHaveBeenLastCalledWith({
      caption: 'title',
      message: 'message',
      buttonLabels: ['join_now', 'later', 'already_joined'],
      primaryButtonIndex: 0,
      callbacks: [
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
      ],
      checkbox: {
        text: 'dont_show_again',
        callbacks: [
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
        ],
      }
    });

    expect(mockConfigWrite).not.toBeCalled();
    expect(mockOpen).not.toBeCalled();
    const onJoinNow = mockPopUp.mock.calls[0][0].callbacks[0];
    onJoinNow();
    expect(mockConfigWrite).toBeCalledTimes(1);
    expect(mockConfigWrite).toBeCalledWith('skip-fb-group-invitation', true);
    expect(mockOpen).toBeCalledTimes(1);
    expect(mockOpen).toBeCalledWith('forum');

    jest.resetAllMocks();
    eventHandler();
    expect(mockConfigRead).not.toBeCalled();
    expect(mockPopUp).not.toBeCalled();
  });
});
