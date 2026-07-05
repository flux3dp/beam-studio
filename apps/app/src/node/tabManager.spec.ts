/**
 * Unit tests for TabManager (apps/app/src/node/tabManager.ts).
 *
 * Scope: the LOGIC half of the release-test 多分頁功能 rows —
 *   - 不同 Tab 文件設定指定不同機器 (per-tab state isolation)
 *   - 送出工作可各自執行不同參數 (per-tab settings kept separate)
 * The testable core is the manager's per-tab bookkeeping: state stored per
 * WebContents id with no cross-tab leakage, plus tab creation/limit, close/
 * cleanup, focus/switch, and broadcast-to-other-tabs routing.
 *
 * Deliberately NOT covered (Tier D / not unit-testable):
 *   - real rendering, native menus, actual IPC transport
 *   - Electron window lifecycle side-effects (openDevTools, loadURL, sessions)
 * These are faked so the pure bookkeeping logic can be exercised.
 */
import { MiscEvents, TabConstants, TabEvents } from '@core/app/constants/ipcEvents';

// ---------------------------------------------------------------------------
// Lightweight Electron fakes
// ---------------------------------------------------------------------------

// Monotonic id generator so every WebContentsView gets a distinct webContents.id,
// mirroring Electron's real per-view ids (which the manager keys everything on).
let nextWebContentsId = 1;

interface FakeWebContents {
  close: jest.Mock;
  destroyedListeners: Array<() => void>;
  focus: jest.Mock;
  id: number;
  isDestroyed: jest.Mock;
  loadURL: jest.Mock;
  on: jest.Mock;
  openDevTools: jest.Mock;
  send: jest.Mock;
  session: {
    webRequest: { onHeadersReceived: jest.Mock };
  };
  setBackgroundThrottling: jest.Mock;
  setWindowOpenHandler: jest.Mock;
}

interface FakeView {
  setBounds: jest.Mock;
  webContents: FakeWebContents;
}

const createdViews: FakeView[] = [];

const makeWebContents = (): FakeWebContents => {
  const destroyedListeners: Array<() => void> = [];

  return {
    close: jest.fn(),
    destroyedListeners,
    focus: jest.fn(),
    id: nextWebContentsId++,
    isDestroyed: jest.fn(() => false),
    loadURL: jest.fn(),
    // record `destroyed` listeners so tests can fire them
    on: jest.fn((event: string, cb: () => void) => {
      if (event === 'destroyed') destroyedListeners.push(cb);
    }),
    openDevTools: jest.fn(),
    send: jest.fn(),
    session: { webRequest: { onHeadersReceived: jest.fn() } },
    setBackgroundThrottling: jest.fn(),
    setWindowOpenHandler: jest.fn(),
  };
};

// WebContentsView is mocked as a class producing a fresh fake view each time.
const WebContentsViewMock = jest.fn().mockImplementation(() => {
  const view: FakeView = {
    setBounds: jest.fn(),
    webContents: makeWebContents(),
  };

  createdViews.push(view);

  return view;
});

// ipcMain fake: registers handlers into a map keyed by event so tests can
// simulate a renderer sending an IPC message with a chosen `sender` (tab id).
type IpcHandler = (event: any, ...args: any[]) => void;
const ipcHandlers: Record<string, IpcHandler[]> = {};

const ipcMainMock = {
  on: jest.fn((event: string, handler: IpcHandler) => {
    (ipcHandlers[event] ||= []).push(handler);
  }),
  removeListener: jest.fn((event: string, handler: IpcHandler) => {
    ipcHandlers[event] = (ipcHandlers[event] || []).filter((h) => h !== handler);
  }),
};

/** Fire the (first) registered ipcMain handler for `event`, with `sender` as e.sender. */
const emitIpc = (event: string, sender: FakeWebContents | { id: number }, ...args: any[]) => {
  const handlers = ipcHandlers[event] || [];
  const e = { returnValue: undefined as unknown, sender };

  handlers.forEach((h) => h(e, ...args));

  return e;
};

jest.mock('electron', () => ({
  get ipcMain() {
    return ipcMainMock;
  },
  get WebContentsView() {
    return WebContentsViewMock;
  },
}));

jest.mock('@electron/remote/main', () => ({ enable: jest.fn() }));

// i18n / initStore pull in electron-store & the full lang tree — stub them out.
jest.mock('./helpers/i18n', () => ({
  __esModule: true,
  default: { lang: { topbar: { untitled: 'Untitled' } } },
}));
jest.mock('./helpers/initStore', () => ({ __esModule: true, default: jest.fn() }));

import TabManager from './tabManager';

// ---------------------------------------------------------------------------
// BaseWindow fake
// ---------------------------------------------------------------------------

const makeMainWindow = () => {
  const windowListeners: Record<string, Array<() => void>> = {};

  return {
    close: jest.fn(),
    contentView: {
      addChildView: jest.fn(),
      removeChildView: jest.fn(),
    },
    getContentBounds: jest.fn(() => ({ height: 800, width: 1200, x: 0, y: 0 })),
    isFullScreen: jest.fn(() => false),
    on: jest.fn((event: string, cb: () => void) => {
      (windowListeners[event] ||= []).push(cb);
    }),
    windowListeners,
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getPrivate = (manager: TabManager) => manager as any;

/**
 * Approve the pending close for a NOT-loading tab (welcome tab). Such tabs
 * take the save-dialog roundtrip path: the manager sends WindowClose and waits
 * for a CloseReply from that view's webContents. This fires that reply so the
 * close resolves instead of hitting the 10s fallback timeout.
 */
const approveClose = (manager: TabManager, id: number, reply = true) => {
  const wc = getPrivate(manager).tabsMap[id]?.view.webContents;

  if (wc) emitIpc(MiscEvents.CloseReply, wc, reply);
};

/** Add `n` tabs and return their webContents ids in creation order. */
const addTabs = (manager: TabManager, n: number): number[] => {
  const ids: number[] = [];

  for (let i = 0; i < n; i += 1) {
    const before = getPrivate(manager).tabsList.length;

    manager.addNewTab();

    const list: number[] = getPrivate(manager).tabsList;

    ids.push(list[before]);
  }

  return ids;
};

describe('TabManager', () => {
  let mainWindow: ReturnType<typeof makeMainWindow>;
  let manager: TabManager;

  beforeEach(() => {
    jest.clearAllMocks();
    nextWebContentsId = 1;
    createdViews.length = 0;
    Object.keys(ipcHandlers).forEach((k) => delete ipcHandlers[k]);

    mainWindow = makeMainWindow();
    manager = new TabManager(mainWindow as any);
  });

  describe('event registration', () => {
    test('registers ipcMain handlers and window listeners on construction', () => {
      expect(ipcMainMock.on).toHaveBeenCalledWith(TabEvents.AddNewTab, expect.any(Function));
      expect(ipcMainMock.on).toHaveBeenCalledWith(TabEvents.FocusTab, expect.any(Function));
      expect(ipcMainMock.on).toHaveBeenCalledWith(TabEvents.CloseTab, expect.any(Function));
      expect(ipcMainMock.on).toHaveBeenCalledWith(TabEvents.SetTabMode, expect.any(Function));
      expect(mainWindow.on).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(mainWindow.on).toHaveBeenCalledWith('closed', expect.any(Function));
    });
  });

  describe('tab creation', () => {
    test('first tab becomes the welcome tab and is focused', () => {
      const [id] = addTabs(manager, 1);

      expect(getPrivate(manager).tabsList).toEqual([id]);
      expect(manager.welcomeTabId).toBe(id);
      expect(getPrivate(manager).focusedId).toBe(id);
      expect(manager.isAtWelcomeTab).toBe(true);
      // welcome tab is not loading (renders immediately); later tabs are.
      expect(getPrivate(manager).tabsMap[id].isWelcomeTab).toBe(true);
      expect(getPrivate(manager).tabsMap[id].isLoading).toBe(false);
    });

    test('each new tab gets a distinct webContents id and its own record', () => {
      const ids = addTabs(manager, 3);

      expect(new Set(ids).size).toBe(3);

      const { tabsMap } = getPrivate(manager);

      ids.forEach((id) => expect(tabsMap[id]).toBeDefined());
    });

    test('non-welcome tabs start in loading state', () => {
      const [, second] = addTabs(manager, 2);

      expect(getPrivate(manager).tabsMap[second].isWelcomeTab).toBe(false);
      expect(getPrivate(manager).tabsMap[second].isLoading).toBe(true);
    });

    test('preloads a spare tab that is not part of the visible tabsList', () => {
      addTabs(manager, 1);

      // A preloaded tab exists but is not counted in tabsList until adopted.
      expect(getPrivate(manager).preloadedTab).not.toBeNull();
      expect(getPrivate(manager).tabsList).toHaveLength(1);
    });
  });

  describe('tab limit (TabConstants.maxTab)', () => {
    test('does not preload beyond maxTab tabs', () => {
      const ids = addTabs(manager, TabConstants.maxTab);

      expect(ids).toHaveLength(TabConstants.maxTab);
      expect(getPrivate(manager).tabsList).toHaveLength(TabConstants.maxTab);
      // At the limit, no spare preloaded tab should be created.
      expect(getPrivate(manager).preloadedTab).toBeNull();
    });
  });

  describe('per-tab state isolation (核心：不同 Tab 各自參數)', () => {
    test('SetTabMode updates only the sender tab, no cross-tab leakage', () => {
      const [a, b] = addTabs(manager, 2);
      const CanvasMode_PathPreview = 2; // CanvasMode.PathPreview

      emitIpc(TabEvents.SetTabMode, { id: a }, CanvasMode_PathPreview);

      expect(getPrivate(manager).tabsMap[a].mode).toBe(CanvasMode_PathPreview);
      expect(getPrivate(manager).tabsMap[b].mode).toBeUndefined();
    });

    test('SetTabTitle / cloud / unsaved flags are stored per tab', () => {
      const [a, b] = addTabs(manager, 2);

      emitIpc(TabEvents.SetTabTitle, { id: a }, 'Design A', true, true);
      emitIpc(TabEvents.SetTabTitle, { id: b }, 'Design B', false, false);

      const { tabsMap } = getPrivate(manager);

      expect(tabsMap[a].title).toBe('Design A');
      expect(tabsMap[a].isCloud).toBe(true);
      expect(tabsMap[a].hasUnsavedChanges).toBe(true);

      expect(tabsMap[b].title).toBe('Design B');
      expect(tabsMap[b].isCloud).toBe(false);
      expect(tabsMap[b].hasUnsavedChanges).toBe(false);
    });

    test('SetTabIsPreviewMode is isolated per tab', () => {
      const [a, b] = addTabs(manager, 2);

      emitIpc(TabEvents.SetTabIsPreviewMode, { id: a }, true);

      expect(getPrivate(manager).tabsMap[a].isPreviewMode).toBe(true);
      expect(getPrivate(manager).tabsMap[b].isPreviewMode).toBe(false);
    });

    test('SetTabMode for an unknown sender id is a no-op', () => {
      const [a] = addTabs(manager, 1);

      emitIpc(TabEvents.SetTabMode, { id: 99999 }, 3);

      expect(getPrivate(manager).tabsMap[a].mode).toBeUndefined();
      expect(getPrivate(manager).tabsMap[99999]).toBeUndefined();
    });

    test('serializeTabs (GetAllTabs) reflects each tab independent state', () => {
      const [a, b] = addTabs(manager, 2);

      emitIpc(TabEvents.SetTabTitle, { id: a }, 'A', true, false);
      emitIpc(TabEvents.SetTabTitle, { id: b }, 'B', false, true);
      manager.focusTab(a);

      const { returnValue } = emitIpc(TabEvents.GetAllTabs, { id: a });
      const tabs = returnValue as any[];

      expect(tabs).toHaveLength(2);

      const tabA = tabs.find((t) => t.id === a);
      const tabB = tabs.find((t) => t.id === b);

      expect(tabA).toMatchObject({ isCloud: true, isFocused: true, title: 'A' });
      expect(tabB).toMatchObject({ hasUnsavedChanges: true, isCloud: false, isFocused: false, title: 'B' });
    });
  });

  describe('focus / switch bookkeeping', () => {
    test('focusTab switches focusedId and blurs the previous tab', () => {
      const [a, b] = addTabs(manager, 2);

      manager.focusTab(a);

      const viewA = getPrivate(manager).tabsMap[a].view as FakeView;
      const viewB = getPrivate(manager).tabsMap[b].view as FakeView;

      viewA.webContents.send.mockClear();
      viewB.webContents.send.mockClear();

      manager.focusTab(b);

      expect(getPrivate(manager).focusedId).toBe(b);
      // previous tab (a) receives blur, new tab (b) receives focus
      expect(viewA.webContents.send).toHaveBeenCalledWith(TabEvents.TabBlurred);
      expect(viewB.webContents.send).toHaveBeenCalledWith(TabEvents.TabFocused);
    });

    test('focusTab on unknown id does not change focusedId', () => {
      const [a] = addTabs(manager, 1);

      manager.focusTab(a);
      manager.focusTab(123456);

      expect(getPrivate(manager).focusedId).toBe(a);
    });

    test('getFocusedView returns the focused tab view, null when none', () => {
      const [a] = addTabs(manager, 1);

      manager.focusTab(a);
      expect(manager.getFocusedView()).toBe(getPrivate(manager).tabsMap[a].view);

      getPrivate(manager).focusedId = -1;
      expect(manager.getFocusedView()).toBeNull();
    });
  });

  describe('moveTab reordering', () => {
    test('moves a tab from srcIdx to dstIdx preserving other order', () => {
      const [a, b, c] = addTabs(manager, 3);

      expect(getPrivate(manager).tabsList).toEqual([a, b, c]);

      manager.moveTab(0, 2);

      expect(getPrivate(manager).tabsList).toEqual([b, c, a]);
    });

    test('same src/dst index is a no-op', () => {
      const ids = addTabs(manager, 3);

      manager.moveTab(1, 1);

      expect(getPrivate(manager).tabsList).toEqual(ids);
    });
  });

  describe('broadcast routing', () => {
    test('sendToOtherViews excludes the sender tab', () => {
      const [a, b, c] = addTabs(manager, 3);
      const views = getPrivate(manager).tabsMap;

      Object.values(views).forEach((t: any) => t.view.webContents.send.mockClear());

      manager.sendToOtherViews(b, 'custom-event', { payload: 1 });

      expect(views[a].view.webContents.send).toHaveBeenCalledWith('custom-event', { payload: 1 });
      expect(views[c].view.webContents.send).toHaveBeenCalledWith('custom-event', { payload: 1 });
      expect(views[b].view.webContents.send).not.toHaveBeenCalled();
    });

    test('UpdateUser IPC broadcasts to other tabs only (per-tab sync path)', () => {
      const [a, b] = addTabs(manager, 2);
      const views = getPrivate(manager).tabsMap;

      Object.values(views).forEach((t: any) => t.view.webContents.send.mockClear());

      emitIpc(TabEvents.UpdateUser, { id: a }, { email: 'x@flux3dp.com' });

      expect(views[b].view.webContents.send).toHaveBeenCalledWith(TabEvents.UpdateUser, { email: 'x@flux3dp.com' });
      expect(views[a].view.webContents.send).not.toHaveBeenCalledWith(
        TabEvents.UpdateUser,
        expect.anything(),
      );
    });

    test('StorageValueChanged / GlobalPreferenceChanged forward args to other tabs', () => {
      const [a, b] = addTabs(manager, 2);
      const views = getPrivate(manager).tabsMap;

      Object.values(views).forEach((t: any) => t.view.webContents.send.mockClear());

      emitIpc(TabEvents.StorageValueChanged, { id: a }, 'poke-ip-addr', '10.0.0.1');
      emitIpc(TabEvents.GlobalPreferenceChanged, { id: a }, 'model', 'ado1');

      expect(views[b].view.webContents.send).toHaveBeenCalledWith(
        TabEvents.StorageValueChanged,
        'poke-ip-addr',
        '10.0.0.1',
      );
      expect(views[b].view.webContents.send).toHaveBeenCalledWith(TabEvents.GlobalPreferenceChanged, 'model', 'ado1');
    });

    test('sendToAllViews reaches every tab including the origin', () => {
      const ids = addTabs(manager, 3);
      const views = getPrivate(manager).tabsMap;

      Object.values(views).forEach((t: any) => t.view.webContents.send.mockClear());

      manager.sendToAllViews('ping', 1);

      ids.forEach((id) => expect(views[id].view.webContents.send).toHaveBeenCalledWith('ping', 1));
    });

    test('sendToView targets a single tab, ignores unknown ids', () => {
      const [a, b] = addTabs(manager, 2);
      const views = getPrivate(manager).tabsMap;

      Object.values(views).forEach((t: any) => t.view.webContents.send.mockClear());

      manager.sendToView(a, 'only-a', 'data');
      manager.sendToView(999999, 'nowhere');

      expect(views[a].view.webContents.send).toHaveBeenCalledWith('only-a', 'data');
      expect(views[b].view.webContents.send).not.toHaveBeenCalledWith('only-a', 'data');
    });

    test('sendToFocusedView routes only to the focused tab', () => {
      const [a, b] = addTabs(manager, 2);

      manager.focusTab(b);

      const views = getPrivate(manager).tabsMap;

      Object.values(views).forEach((t: any) => t.view.webContents.send.mockClear());

      manager.sendToFocusedView('focused-only', 'x');

      expect(views[b].view.webContents.send).toHaveBeenCalledWith('focused-only', 'x');
      expect(views[a].view.webContents.send).not.toHaveBeenCalled();
    });
  });

  describe('tab close / cleanup', () => {
    // The manager arms a 10s fallback setTimeout per close that it never clears.
    // Fake timers keep that timer from leaking as an open handle after the run.
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test('closes a non-focused tab, removes its record and view', async () => {
      const [a, b] = addTabs(manager, 2);

      manager.focusTab(a);

      const viewB = getPrivate(manager).tabsMap[b].view as FakeView;

      // isLoading tab closes forcibly (no save-dialog roundtrip needed).
      const closed = await manager.closeTab(b, { allowEmpty: true });

      expect(closed).toBe(true);
      expect(getPrivate(manager).tabsMap[b]).toBeUndefined();
      expect(getPrivate(manager).tabsList).not.toContain(b);
      expect(mainWindow.contentView.removeChildView).toHaveBeenCalledWith(viewB);
      expect(viewB.webContents.close).toHaveBeenCalled();
    });

    test('closing the focused tab shifts focus to a remaining tab', async () => {
      const [a, b] = addTabs(manager, 2);

      manager.focusTab(b);
      await manager.closeTab(b, { allowEmpty: true });

      // focus falls back to the remaining tab (index-based fallback -> a)
      expect(getPrivate(manager).focusedId).toBe(a);
      expect(getPrivate(manager).tabsList).toEqual([a]);
    });

    test('closeTab on an unknown id returns false', async () => {
      addTabs(manager, 1);

      const res = await manager.closeTab(424242, { allowEmpty: true });

      expect(res).toBe(false);
    });

    test('welcome tab cannot be closed while other tabs remain (allowEmpty=false)', async () => {
      const [welcome] = addTabs(manager, 2);

      // welcome id is the first tab
      expect(manager.welcomeTabId).toBe(welcome);

      const res = await manager.closeTab(welcome);

      expect(res).toBe(false);
      expect(getPrivate(manager).tabsMap[welcome]).toBeDefined();
    });

    test('the sole (welcome, not-loading) tab closes after frontend confirms, and closes window', async () => {
      const [welcome] = addTabs(manager, 1);

      // welcome tab is not loading, so it takes the save-dialog roundtrip path.
      const closePromise = manager.closeTab(welcome, { allowEmpty: true, shouldCloseWindow: true });

      approveClose(manager, welcome, true);

      const res = await closePromise;

      expect(res).toBe(true);
      expect(getPrivate(manager).tabsList).toHaveLength(0);
      expect(mainWindow.close).toHaveBeenCalled();
    });

    test('frontend declining the close keeps the tab open', async () => {
      const [welcome] = addTabs(manager, 1);

      const closePromise = manager.closeTab(welcome, { allowEmpty: true });

      approveClose(manager, welcome, false);

      const res = await closePromise;

      expect(res).toBe(false);
      expect(getPrivate(manager).tabsMap[welcome]).toBeDefined();
    });

    test('closeAllTabs tears down every tab', async () => {
      const ids = addTabs(manager, 3);
      const welcomeWc = getPrivate(manager).tabsMap[ids[0]].view.webContents as FakeWebContents;

      // Only the welcome tab (ids[0]) is not-loading and takes the roundtrip path.
      // It is closed LAST (reverse iteration), so auto-reply the moment it is asked
      // to close (WindowClose) rather than guessing the timing.
      welcomeWc.send.mockImplementation((event: string) => {
        if (event === MiscEvents.WindowClose) emitIpc(MiscEvents.CloseReply, welcomeWc, true);
      });

      const res = await manager.closeAllTabs({ shouldCloseWindow: true });

      expect(res).toBe(true);
      expect(getPrivate(manager).tabsList).toHaveLength(0);
      expect(Object.keys(getPrivate(manager).tabsMap)).toHaveLength(0);
    });

    test('webContents "destroyed" listener cleans up the tab bookkeeping', () => {
      const [a, b] = addTabs(manager, 2);
      const wcB = getPrivate(manager).tabsMap[b].view.webContents as FakeWebContents;

      // simulate Electron destroying the view unexpectedly
      wcB.destroyedListeners.forEach((cb) => cb());

      expect(getPrivate(manager).tabsMap[b]).toBeUndefined();
      expect(getPrivate(manager).tabsList).not.toContain(b);
      expect(getPrivate(manager).tabsList).toContain(a);
    });
  });

  describe('FrontendReady handling', () => {
    test('marks the tab as loaded and notifies focus state', () => {
      const [, second] = addTabs(manager, 2);

      expect(getPrivate(manager).tabsMap[second].isLoading).toBe(true);

      const wc = getPrivate(manager).tabsMap[second].view.webContents as FakeWebContents;

      wc.send.mockClear();
      emitIpc(MiscEvents.FrontendReady, { id: second });

      expect(getPrivate(manager).tabsMap[second].isLoading).toBe(false);
      // it should be told its blur/focus state (fullscreen notify also fires)
      expect(wc.send).toHaveBeenCalledWith(MiscEvents.WindowFullscreen, false);
    });
  });

  describe('GetTabId', () => {
    test('returns the sender webContents id', () => {
      const { returnValue } = emitIpc(TabEvents.GetTabId, { id: 4242 });

      expect(returnValue).toBe(4242);
    });
  });
});
