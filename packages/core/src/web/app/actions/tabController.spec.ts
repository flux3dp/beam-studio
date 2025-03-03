import CanvasMode from '@core/app/constants/canvasMode';
import { TabEvents } from '@core/app/constants/tabConstants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

const topBarEventEmitter = eventEmitterFactory.createEventEmitter('top-bar');

const mockSend = jest.fn();
const mockSendSync = jest.fn();
const mockCommunicator = {};

jest.mock('@core/implementations/communicator', () => ({
  on: (event, handler) => {
    mockCommunicator[event] = handler;
  },
  send: (...args) => mockSend(...args),
  sendSync: (...args) => mockSendSync(...args),
}));

import tabController from './tabController';

const mockGetName = jest.fn();
const mockGetHasUnsavedChanges = jest.fn();
const mockIsCloudFile = jest.fn();

jest.mock('@core/app/svgedit/currentFileManager', () => ({
  getHasUnsavedChanges: (...args) => mockGetHasUnsavedChanges(...args),
  getName: (...args) => mockGetName(...args),
  get isCloudFile() {
    return mockIsCloudFile();
  },
}));

describe('test TabController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('register focus event', () => {
    const handler = jest.fn();

    tabController.onFocused(handler);
    mockCommunicator[TabEvents.TabFocused]();
    expect(handler).toBeCalledTimes(1);
    tabController.offFocused(handler);
    mockCommunicator[TabEvents.TabFocused]();
    expect(handler).toBeCalledTimes(1);
  });

  test('register blur event', () => {
    const handler = jest.fn();

    tabController.onBlurred(handler);
    mockCommunicator[TabEvents.TabBlurred]();
    expect(handler).toBeCalledTimes(1);
    tabController.offBlurred(handler);
    mockCommunicator[TabEvents.TabBlurred]();
    expect(handler).toBeCalledTimes(1);
  });

  test('register tabs updated event', () => {
    const handler = jest.fn();

    tabController.onTabsUpdated(handler);
    mockCommunicator[TabEvents.TabUpdated]();
    expect(handler).toBeCalledTimes(1);
    tabController.offTabsUpdated(handler);
    mockCommunicator[TabEvents.TabUpdated]();
    expect(handler).toBeCalledTimes(1);
  });

  test('handle title change', () => {
    mockGetName.mockReturnValue('name');
    mockGetHasUnsavedChanges.mockReturnValue(true);
    mockIsCloudFile.mockReturnValue(true);
    topBarEventEmitter.emit('UPDATE_TITLE');
    expect(mockSend).toBeCalledTimes(1);
    expect(mockSend).toBeCalledWith(TabEvents.SetTabTitle, 'name*', true);
  });

  test('getAllTabs', () => {
    tabController.getAllTabs();
    expect(mockSendSync).toBeCalledTimes(1);
    expect(mockSendSync).toBeCalledWith(TabEvents.GetAllTabs);
  });

  test('addNewTab', () => {
    tabController.addNewTab();
    expect(mockSend).toBeCalledTimes(1);
    expect(mockSend).toBeCalledWith(TabEvents.AddNewTab);
  });

  test('closeTab', () => {
    tabController.closeTab(1);
    expect(mockSend).toBeCalledTimes(1);
    expect(mockSend).toBeCalledWith(TabEvents.CloseTab, 1);
  });

  test('moveTab', () => {
    tabController.moveTab(1, 2);
    expect(mockSend).toBeCalledTimes(1);
    expect(mockSend).toBeCalledWith(TabEvents.MoveTab, 1, 2);
  });

  test('focusTab', () => {
    tabController.focusTab(1);
    expect(mockSend).toBeCalledTimes(1);
    expect(mockSend).toBeCalledWith(TabEvents.FocusTab, 1);
  });

  test('setMode', () => {
    tabController.setMode(CanvasMode.Preview);
    expect(mockSend).toBeCalledTimes(1);
    expect(mockSend).toBeCalledWith(TabEvents.SetTabMode, CanvasMode.Preview);
  });
});
