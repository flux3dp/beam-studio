import path from 'path';
import url from 'url';

// eslint-disable-next-line import/no-extraneous-dependencies
import { BaseWindow, IpcMainEvent, ipcMain, WebContentsView } from 'electron';
import { enable as enableRemote } from '@electron/remote/main';

import CanvasMode from 'app/constants/canvasMode';
import i18n from 'helpers/i18n';
import tabConstants, { TabEvents } from 'app/constants/tabConstants';
import { Tab as FrontendTab } from 'interfaces/Tab';

import events from './ipc-events';
import initStore from './helpers/initStore';

interface Tab extends Omit<FrontendTab, 'id'> {
  view: WebContentsView;
}

class TabManager {
  private mainWindow: BaseWindow;
  private tabsMap: Record<number, Tab> = {};
  private tabsList: number[] = [];
  private preloadedTab: Tab | null = null;
  private focusOnReadyId = -1;
  private focusedId = -1;
  private isDebug = false;

  constructor(mainWindow: BaseWindow, { isDebug = false } = {}) {
    this.mainWindow = mainWindow;
    this.isDebug = isDebug;
    this.setupEvents();
  }

  setupEvents = (): void => {
    ipcMain.on(TabEvents.FocusTab, (e, id: number) => {
      this.focusTab(id);
    });

    ipcMain.on(TabEvents.AddNewTab, () => {
      this.addNewTab();
    });

    ipcMain.on(TabEvents.CloseTab, (e, id: number) => {
      this.closeTab(id, { allowEmpty: true, shouldCloseWindow: true });
    });

    ipcMain.on(TabEvents.MoveTab, (e, srcIdx: number, dstIdx: number) => {
      this.moveTab(srcIdx, dstIdx);
    });

    ipcMain.on(TabEvents.GetTabId, (e) => {
      e.returnValue = e.sender.id;
    });

    ipcMain.on(TabEvents.SetTabMode, (e, mode: CanvasMode) => {
      if (this.tabsMap[e.sender.id]) {
        this.tabsMap[e.sender.id].mode = mode;
        this.notifyTabUpdated();
      }
    });

    ipcMain.on(TabEvents.SetTabTitle, (e, title: string, isCloud: boolean) => {
      this.onTabTitleChanged(e.sender.id, title, isCloud);
    });

    ipcMain.on(TabEvents.GetAllTabs, (e) => {
      e.returnValue = this.serializeTabs();
    });

    ipcMain.on(events.FRONTEND_READY, (e) => {
      const { id } = e.sender;
      let tab: Tab | null = null;
      if (this.tabsMap[id]) {
        tab = this.tabsMap[id];
      }
      if (tab) {
        tab.isLoading = false;
        this.updateTabBounds([tab]);
        if (id === this.focusOnReadyId) {
          this.focusTab(id);
        }
        this.notifyTabUpdated();
      }
    });

    const handleWindowSizeChanged = () => {
      const tabs = Object.values(this.tabsMap);
      this.updateTabBounds(tabs);
    };
    this.mainWindow.on('resized', handleWindowSizeChanged);
    this.mainWindow.on('enter-full-screen', handleWindowSizeChanged);
    this.mainWindow.on('leave-full-screen', handleWindowSizeChanged);
    this.mainWindow.on('maximize', handleWindowSizeChanged);
    this.mainWindow.on('unmaximize', handleWindowSizeChanged);

    this.mainWindow.on('closed', () => {
      this.tabsList.forEach((id) => {
        this.tabsMap[id].view.webContents.close();
      });
    });
  };

  private updateTabBounds = (tabs: Tab[]): void => {
    const bound = this.mainWindow?.getContentBounds();
    if (bound) {
      const { width, height } = bound;
      const topBarHeight = 40;
      const isAnyTabReady = this.tabsList.some((id) => !this.tabsMap[id].isLoading);
      tabs.forEach(({ view, isLoading }) => {
        const shouldSetY = isLoading && isAnyTabReady;
        view.setBounds({
          x: 0,
          width,
          y: shouldSetY ? topBarHeight : 0,
          height,
        });
      });
    }
  };

  private onTabTitleChanged = (id: number, title: string, isCloud: boolean): void => {
    if (this.tabsMap[id]) {
      this.tabsMap[id].title = title;
      this.tabsMap[id].isCloud = isCloud;
      this.notifyTabUpdated();
    }
  };

  private serializeTabs = (): Array<FrontendTab> =>
    this.tabsList.map((id: number) => {
      const { title, isCloud, isLoading, mode } = this.tabsMap[id];
      return { id, title, isCloud, isFocused: id === this.focusedId, isLoading, mode };
    });

  private notifyTabUpdated = (): void => {
    this.sendToAllViews(TabEvents.TabUpdated, this.serializeTabs());
  };

  private createTab = (): Tab => {
    const tabView = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, '../../../src/node', 'main-window-entry.js'),
        nodeIntegration: true,
        contextIsolation: false,
      },
    });
    this.mainWindow.contentView.addChildView(tabView);
    const { webContents } = tabView;
    enableRemote(webContents);
    webContents.setWindowOpenHandler(({ url: openUrl }) => {
      // Prevent the new window from early input files
      if (openUrl.startsWith('file://')) return { action: 'deny' };
      return { action: 'allow' };
    });
    initStore(webContents);
    webContents.loadURL(
      url.format({
        pathname: path.join(__dirname, '../../index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
    if (!process.argv.includes('--test') && (process.defaultApp || this.isDebug))
      webContents.openDevTools();
    const title = i18n.lang.topbar.untitled;
    const tab: Tab = {
      view: tabView,
      title,
      isCloud: false,
      isLoading: true,
    };
    webContents.on('devtools-closed', () => {
      this.updateTabBounds([tab]);
    });
    this.updateTabBounds([tab]);
    this.tabsMap[tabView.webContents.id] = tab;
    return tab;
  };

  private preloadTab = (): void => {
    if (
      !this.preloadedTab &&
      (!tabConstants.maxTab || this.tabsList.length < tabConstants.maxTab)
    ) {
      this.preloadedTab = this.createTab();
      this.focusTab(this.focusedId);
    }
  };

  addNewTab = (): void => {
    const newTab = this.preloadedTab ?? this.createTab();
    this.preloadedTab = null;
    const { id } = newTab.view.webContents;
    this.tabsList.push(id);
    this.preloadTab();
    if (!newTab.isLoading || this.focusedId < 0) {
      this.focusTab(id);
    } else {
      this.focusTab(this.focusedId);
      this.focusOnReadyId = id;
    }
    this.notifyTabUpdated();
  };

  focusTab = (id: number): void => {
    if (this.tabsMap[id]) {
      this.focusedId = id;
      const { view } = this.tabsMap[id];
      this.mainWindow.contentView.addChildView(view);
      view.webContents.focus();
      view.webContents.send(TabEvents.TabFocused);
      this.focusOnReadyId = -1;
    }
  };

  getFocusedView = (): WebContentsView | null => {
    const { focusedId, tabsMap } = this;
    if (tabsMap[focusedId]) return tabsMap[focusedId].view;
    return null;
  };

  getAllViews = (): WebContentsView[] => {
    const res = Object.values(this.tabsMap).map(({ view }) => view);
    return res;
  };

  private closeWebContentsView = (view: WebContentsView, force = false) => {
    const { id } = view.webContents;
    return new Promise<boolean>((resolve) => {
      const closeHandler = () => {
        this.mainWindow?.contentView.removeChildView(view);
        view.webContents.close();
        resolve(true);
      };
      if (force) {
        closeHandler();
        return;
      }
      let eventReceivced = false;
      const saveDialogPoppedHandler = (evt: IpcMainEvent) => {
        if (evt.sender === view.webContents) {
          eventReceivced = true;
          ipcMain.removeListener('SAVE_DIALOG_POPPED', saveDialogPoppedHandler);
          if (this.focusedId !== id) this.focusTab(id);
        }
      };
      const closeReplyHander = (event: IpcMainEvent, reply: boolean) => {
        if (event.sender === view.webContents) {
          eventReceivced = true;
          if (reply) closeHandler();
          else resolve(false);
          ipcMain.removeListener('CLOSE_REPLY', closeReplyHander);
          ipcMain.removeListener('SAVE_DIALOG_POPPED', saveDialogPoppedHandler);
        }
      };
      ipcMain.on('CLOSE_REPLY', closeReplyHander);
      ipcMain.on('SAVE_DIALOG_POPPED', saveDialogPoppedHandler);
      view.webContents.send('WINDOW_CLOSE');
      // if no event received in 10 seconds
      // something may goes wrong in frontend, close the view
      setTimeout(() => {
        if (!eventReceivced) closeHandler();
      }, 10000);
    });
  };

  /**
   * @param id tab webcontents id
   * @param opts options
   * @param opts.allowEmpty whether allow to close the last tab
   * @param opts.shouldCloseWindow whether close the window when the tab is closed
   * @returns boolean whether the tab is closed
   */
  closeTab = async (
    id: number,
    {
      allowEmpty = false,
      shouldCloseWindow = false,
    }: {
      allowEmpty?: boolean;
      shouldCloseWindow?: boolean;
    } = {}
  ): Promise<boolean> => {
    const { tabsMap, focusedId } = this;
    if (tabsMap[id] && (allowEmpty || this.tabsList.length > 1)) {
      const res = await this.closeWebContentsView(
        tabsMap[id].view,
        tabsMap[id].isLoading || tabsMap[id] === this.preloadedTab
      );
      if (res) {
        delete this.tabsMap[id];
        const origIdx = this.tabsList.indexOf(id);
        this.tabsList = this.tabsList.filter((tabId) => tabId !== id);
        if (focusedId === id) {
          if (this.tabsList.length) {
            this.focusTab(this.tabsList[origIdx] || this.tabsList[origIdx - 1]);
          }
        } else {
          this.focusTab(focusedId);
        }
      }
      if (this.tabsList.length > 0) {
        this.notifyTabUpdated();
        this.preloadTab();
      } else if (shouldCloseWindow) {
        this.mainWindow.close();
      }
      return res;
    }
    return false;
  };

  closeFocusedTab = async (
    opts: {
      allowEmpty?: boolean;
      shouldCloseWindow?: boolean;
    } = {}
  ): Promise<boolean> => this.closeTab(this.focusedId, opts);

  /**
   * @param opts.closeWindow whether close the window when the tab is closed
   * @returns boolean whether all tabs are closed
   */
  closeAllTabs = async ({
    shouldCloseWindow = false,
  }: {
    shouldCloseWindow?: boolean;
  } = {}): Promise<boolean> => {
    const ids = Object.keys(this.tabsMap);
    for (let i = 0; i < ids.length; i += 1) {
      const id = parseInt(ids[i], 10);
      // eslint-disable-next-line no-await-in-loop
      const res = await this.closeTab(id, { allowEmpty: true, shouldCloseWindow });
      if (!res) return false;
    }
    return true;
  };

  moveTab = (srcIdx: number, dstIdx: number): void => {
    const { tabsList } = this;
    if (srcIdx !== dstIdx) {
      const [tabId] = tabsList.splice(srcIdx, 1);
      tabsList.splice(dstIdx, 0, tabId);
      this.notifyTabUpdated();
    }
  };

  sendToView = (id: number, event: string, data?: unknown): void => {
    if (this.tabsMap[id]) this.tabsMap[id].view.webContents.send(event, data);
  };

  sendToAllViews = (event: string, data?: unknown): void => {
    const views = this.getAllViews();
    views.forEach((view) => view.webContents.send(event, data));
  };

  sendToFocusedView = (event: string, data?: unknown): void => {
    const { focusedId, tabsMap } = this;
    if (tabsMap[focusedId]) tabsMap[focusedId].view.webContents.send(event, data);
  };
}

export default TabManager;
