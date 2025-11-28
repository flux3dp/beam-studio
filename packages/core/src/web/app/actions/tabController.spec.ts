import { CanvasMode } from '@core/app/constants/canvasMode';
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

const mockImportFileInCurrentTab = jest.fn();

jest.mock('@core/helpers/fileImportHelper', () => ({
  importFileInCurrentTab: (...args) => mockImportFileInCurrentTab(...args),
}));

const mockSet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  set: (...args) => mockSet(...args),
}));

describe('test TabController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('register focus event', () => {
    const handler = jest.fn();

    tabController.onFocused(handler);
    mockCommunicator[TabEvents.TabFocused]();
    expect(handler).toHaveBeenCalledTimes(1);
    tabController.offFocused(handler);
    mockCommunicator[TabEvents.TabFocused]();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('register blur event', () => {
    const handler = jest.fn();

    tabController.onBlurred(handler);
    mockCommunicator[TabEvents.TabBlurred]();
    expect(handler).toHaveBeenCalledTimes(1);
    tabController.offBlurred(handler);
    mockCommunicator[TabEvents.TabBlurred]();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('register tabs updated event', () => {
    const handler = jest.fn();

    tabController.onTabsUpdated(handler);
    mockCommunicator[TabEvents.TabUpdated]();
    expect(handler).toHaveBeenCalledTimes(1);
    tabController.offTabsUpdated(handler);
    mockCommunicator[TabEvents.TabUpdated]();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('handle title change', () => {
    mockGetName.mockReturnValue('name');
    mockGetHasUnsavedChanges.mockReturnValue(true);
    mockIsCloudFile.mockReturnValue(true);
    topBarEventEmitter.emit('UPDATE_TITLE');
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(TabEvents.SetTabTitle, 'name*', true);
  });

  test('handle import files', () => {
    mockCommunicator[TabEvents.ImportFileInTab]({}, { filePath: 'mock-path', type: 'recent' });
    expect(mockImportFileInCurrentTab).toHaveBeenCalledTimes(1);
    expect(mockImportFileInCurrentTab).toHaveBeenCalledWith({ filePath: 'mock-path', type: 'recent' });
  });

  test('getAllTabs', () => {
    tabController.getAllTabs();
    expect(mockSendSync).toHaveBeenCalledTimes(1);
    expect(mockSendSync).toHaveBeenCalledWith(TabEvents.GetAllTabs);
  });

  test('addNewTab', () => {
    tabController.addNewTab();
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(TabEvents.AddNewTab);
  });

  test('closeTab', () => {
    tabController.closeTab(1);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(TabEvents.CloseTab, 1);
  });

  test('moveTab', () => {
    tabController.moveTab(1, 2);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(TabEvents.MoveTab, 1, 2);
  });

  test('focusTab', () => {
    tabController.focusTab(1);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(TabEvents.FocusTab, 1);
  });

  test('setMode', () => {
    tabController.setMode(CanvasMode.Draw);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(TabEvents.SetTabMode, CanvasMode.Draw);
  });

  test('getIsWelcomeTab', () => {
    tabController.currentId = 1;
    expect(tabController.getCurrentId()).toBe(1);
    mockSendSync.mockReturnValue([{ id: 1, isWelcomeTab: true }]);
    expect(tabController.getIsWelcomeTab()).toBe(true);
    expect(tabController.isWelcomeTab).toBe(true);
    expect(mockSendSync).toHaveBeenCalledTimes(1);
    expect(mockSendSync).toHaveBeenNthCalledWith(1, TabEvents.GetAllTabs);

    expect(tabController.getIsWelcomeTab()).toBe(true);
    expect(mockSendSync).toHaveBeenCalledTimes(1);

    tabController.isWelcomeTab = null;
    mockSendSync.mockReturnValue([{ id: 1, isWelcomeTab: false }]);
    expect(tabController.getIsWelcomeTab()).toBe(false);
    expect(tabController.isWelcomeTab).toBe(false);
    expect(mockSendSync).toHaveBeenCalledTimes(2);
    expect(mockSendSync).toHaveBeenNthCalledWith(2, TabEvents.GetAllTabs);
  });

  test('setIsPreviewMode', () => {
    tabController.setIsPreviewMode(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(TabEvents.SetTabIsPreviewMode, true);
  });
});
