import path from 'path';
import { pathToFileURL } from 'url';

import { enable as enableRemote } from '@electron/remote/main';
import type { BaseWindow, IpcMainEvent } from 'electron';
import { ipcMain, WebContentsView } from 'electron';

import type { CanvasMode } from '@core/app/constants/canvasMode';
import tabConstants, { TabEvents } from '@core/app/constants/tabConstants';
import type { Tab as FrontendTab } from '@core/interfaces/Tab';

import i18n from './helpers/i18n';
import initStore from './helpers/initStore';
import events from './ipc-events';

interface Tab extends Omit<FrontendTab, 'id'> {
  view: WebContentsView;
}

class TabManager {
  private mainWindow: BaseWindow;
  private tabsMap: Record<number, Tab> = {};
  private tabsList: number[] = [];
  private preloadedTab: null | Tab = null;
  private focusOnReadyId = -1;
  private focusedId = -1;
  private isDebug = false;
  public welcomeTabId = -1;

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

    ipcMain.on(TabEvents.SetTabTitle, (e, title: string, isCloud: boolean, hasUnsavedChanges: boolean) => {
      this.onTabTitleChanged(e.sender.id, title, isCloud, hasUnsavedChanges);
    });

    ipcMain.on(TabEvents.SetTabIsPreviewMode, (e, isPreviewMode: boolean) => {
      if (this.tabsMap[e.sender.id]) {
        this.tabsMap[e.sender.id].isPreviewMode = isPreviewMode;
        this.notifyTabUpdated();
      }
    });

    ipcMain.on(TabEvents.GetAllTabs, (e) => {
      e.returnValue = this.serializeTabs();
    });

    ipcMain.on(TabEvents.UpdateUser, (e, data) => {
      this.sendToOtherViews(e.sender.id, TabEvents.UpdateUser, data);
    });

    ipcMain.on(events.FRONTEND_READY, (e) => {
      const { id } = e.sender;
      let tab: null | Tab = null;

      if (this.tabsMap[id]) {
        tab = this.tabsMap[id];
      }

      if (tab) {
        tab.isLoading = false;
        this.updateTabBounds([tab]);

        if (id === this.focusOnReadyId) {
          this.focusTab(id);
        }

        this.sendToView(id, id === this.focusedId ? TabEvents.TabFocused : TabEvents.TabBlurred);
        this.sendToView(id, 'window-fullscreen', this.mainWindow.isFullScreen());
        this.notifyTabUpdated();
      }
    });

    ipcMain.on(TabEvents.ImportFileInTab, (_e, data) => {
      this.sendToFocusedView(TabEvents.ImportFileInTab, data);
    });

    ipcMain.on(TabEvents.GlobalPreferenceChanged, (e, key, value) => {
      this.sendToOtherViews(e.sender.id, TabEvents.GlobalPreferenceChanged, key, value);
    });

    ipcMain.on(TabEvents.StorageValueChanged, (e, key, value) => {
      this.sendToOtherViews(e.sender.id, TabEvents.StorageValueChanged, key, value);
    });

    ipcMain.on(TabEvents.UpdateDevices, (e, data) => {
      this.sendToOtherViews(e.sender.id, TabEvents.UpdateDevices, data);
    });

    ipcMain.on(TabEvents.PokeIP, (e, targetIP: string, options = {}) => {
      this.sendToView(this.welcomeTabId, TabEvents.PokeIP, targetIP, options);
    });

    const handleWindowSizeChanged = () => {
      const tabs = Object.values(this.tabsMap);

      this.updateTabBounds(tabs);
    };

    this.mainWindow.on('resize', handleWindowSizeChanged);
    this.mainWindow.on('resized', handleWindowSizeChanged);
    this.mainWindow.on('enter-full-screen', handleWindowSizeChanged);
    this.mainWindow.on('leave-full-screen', handleWindowSizeChanged);
    this.mainWindow.on('maximize', handleWindowSizeChanged);
    this.mainWindow.on('unmaximize', handleWindowSizeChanged);
    this.mainWindow.on('closed', () => {
      this.tabsList.forEach((id) => {
        this.tabsMap[id]?.view?.webContents?.close();
      });
    });
  };

  private updateTabBounds = (tabs: Tab[]): void => {
    const bound = this.mainWindow?.getContentBounds();

    if (bound) {
      const { height, width } = bound;
      const topBarHeight = process.platform === 'win32' ? 70 : 40;
      const isAnyTabReady = this.tabsList.some((id) => !this.tabsMap[id].isLoading);

      tabs.forEach(({ isLoading, view }) => {
        const shouldSetY = isLoading && isAnyTabReady;

        view.setBounds({
          height,
          width,
          x: 0,
          y: shouldSetY ? topBarHeight : 0,
        });
      });
    }
  };

  private onTabTitleChanged = (id: number, title: string, isCloud: boolean, hasUnsavedChanges: boolean): void => {
    if (this.tabsMap[id]) {
      this.tabsMap[id].title = title;
      this.tabsMap[id].isCloud = isCloud;
      this.tabsMap[id].hasUnsavedChanges = hasUnsavedChanges;
      this.notifyTabUpdated();
    }
  };

  private serializeTabs = (): FrontendTab[] =>
    this.tabsList.map((id: number) => {
      const { hasUnsavedChanges, isCloud, isLoading, isPreviewMode, isWelcomeTab, mode, title } = this.tabsMap[id];

      return {
        hasUnsavedChanges,
        id,
        isCloud,
        isFocused: id === this.focusedId,
        isLoading,
        isPreviewMode,
        isWelcomeTab,
        mode,
        title,
      };
    });

  private notifyTabUpdated = (): void => {
    this.sendToAllViews(TabEvents.TabUpdated, this.serializeTabs());
  };

  private createTab = (): Tab => {
    const isWelcomeTab = this.tabsList.length < 1;
    const tabView = new WebContentsView({
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true,
        preload: path.join(__dirname, '../../../src/node', 'main-window-entry.js'),
      },
    });

    this.mainWindow.contentView.addChildView(tabView);

    const { webContents } = tabView;

    webContents.setBackgroundThrottling(false);
    // to access the iframe in the webview
    webContents.session.webRequest.onHeadersReceived({ urls: ['https://udify.app/*'] }, (details, callback) => {
      if (details && details.responseHeaders) {
        if (details.responseHeaders['Content-Security-Policy']) {
          delete details.responseHeaders['Content-Security-Policy'];
        } else if (details.responseHeaders['content-security-policy']) {
          delete details.responseHeaders['content-security-policy'];
        }
      }

      callback({ cancel: false, responseHeaders: details.responseHeaders });
    });

    enableRemote(webContents);
    webContents.setWindowOpenHandler(({ url: openUrl }) => {
      // Prevent the new window from early input files
      if (openUrl.startsWith('file://')) {
        return { action: 'deny' };
      }

      return { action: 'allow' };
    });
    initStore(webContents, isWelcomeTab);

    webContents.loadURL(pathToFileURL(path.join(__dirname, '../../index.html')).toString());

    if (!process.argv.includes('--test') && (process.defaultApp || this.isDebug)) {
      webContents.openDevTools();
    }

    const title = i18n.lang.topbar.untitled;
    const tab: Tab = {
      isCloud: false,
      isLoading: !isWelcomeTab,
      isPreviewMode: false,
      isWelcomeTab,
      title,
      view: tabView,
    };

    webContents.on('devtools-closed', () => {
      this.updateTabBounds([tab]);
    });
    webContents.on('destroyed', () => {
      const { id } = webContents;

      if (tabView === this.preloadedTab?.view) {
        this.preloadedTab = null;
        console.log('Preloaded tab destroyed');
      }

      if (id) {
        if (this.tabsMap[id]) {
          console.log(`Tab ${id} destroyed unexpectedly`);
        }

        if (id === this.focusedId && !this.tabsMap[this.welcomeTabId]?.view?.webContents?.isDestroyed()) {
          this.focusTab(this.welcomeTabId);
        }

        delete this.tabsMap[id];
        this.tabsList = this.tabsList.filter((tabId) => tabId !== id);
        this.notifyTabUpdated();
      }
    });
    this.updateTabBounds([tab]);
    this.tabsMap[tabView.webContents.id] = tab;

    if (isWelcomeTab) {
      this.welcomeTabId = tabView.webContents.id;
    }

    return tab;
  };

  private preloadTab = (): void => {
    if (!this.preloadedTab && (!tabConstants.maxTab || this.tabsList.length < tabConstants.maxTab)) {
      this.preloadedTab = this.createTab();
      this.focusTab(this.focusedId);
    }
  };

  addNewTab = (): void => {
    if (this.preloadedTab) this.preloadedTab.view.webContents.send(TabEvents.ReloadSettings);

    let newTab = this.preloadedTab ?? this.createTab();

    this.preloadedTab = null;

    // Fix unexpected tab destruction
    while (!newTab.view.webContents) {
      newTab = this.createTab();
    }

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
      const oldId = this.focusedId;
      const { view } = this.tabsMap[id];

      this.focusedId = id;
      this.mainWindow.contentView.addChildView(view);
      view.webContents.focus();

      if (oldId !== id) this.sendToView(oldId, TabEvents.TabBlurred);

      view.webContents.send(TabEvents.TabFocused);
      this.focusOnReadyId = -1;
    }
  };

  getFocusedView = (): null | WebContentsView => {
    const { focusedId, tabsMap } = this;

    if (tabsMap[focusedId]) {
      return tabsMap[focusedId].view;
    }

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

      let eventReceived = false;
      const saveDialogPoppedHandler = (evt: IpcMainEvent) => {
        if (evt.sender === view.webContents) {
          eventReceived = true;
          ipcMain.removeListener('SAVE_DIALOG_POPPED', saveDialogPoppedHandler);

          if (this.focusedId !== id) {
            this.focusTab(id);
          }
        }
      };
      const closeReplyHandler = (event: IpcMainEvent, reply: boolean) => {
        if (event.sender === view.webContents) {
          eventReceived = true;

          if (reply) {
            closeHandler();
          } else {
            resolve(false);
          }

          ipcMain.removeListener('CLOSE_REPLY', closeReplyHandler);
          ipcMain.removeListener('SAVE_DIALOG_POPPED', saveDialogPoppedHandler);
        }
      };

      ipcMain.on('CLOSE_REPLY', closeReplyHandler);
      ipcMain.on('SAVE_DIALOG_POPPED', saveDialogPoppedHandler);
      view.webContents.send('WINDOW_CLOSE');
      // if no event received in 10 seconds
      // something may goes wrong in frontend, close the view
      setTimeout(() => {
        if (!eventReceived) {
          closeHandler();
        }
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
    } = {},
  ): Promise<boolean> => {
    const { focusedId, tabsMap } = this;
    let isClosable: boolean;

    if (!tabsMap[id]) return false;

    if (this.welcomeTabId === id) {
      isClosable = allowEmpty && this.tabsList.length === 1;
    } else {
      isClosable = allowEmpty || this.tabsList.length > 1;
    }

    if (isClosable) {
      const res = await this.closeWebContentsView(
        tabsMap[id]?.view,
        tabsMap[id].isLoading || tabsMap[id] === this.preloadedTab,
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
    } = {},
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

    for (let i = ids.length - 1; i >= 0; i -= 1) {
      const id = Number.parseInt(ids[i], 10);

      const res = await this.closeTab(id, { allowEmpty: true, shouldCloseWindow });

      if (!res) {
        return false;
      }
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

  sendToView = (id: number, event: string, ...data: unknown[]): void => {
    if (this.tabsMap[id]) {
      this.tabsMap[id].view.webContents.send(event, ...data);
    }
  };

  sendToOtherViews = (senderId: number, event: string, ...data: unknown[]): void => {
    const views = this.getAllViews();

    views.forEach((view) => {
      if (view.webContents.id !== senderId) {
        view.webContents.send(event, ...data);
      }
    });
  };

  sendToAllViews = (event: string, ...data: unknown[]): void => {
    const views = this.getAllViews();

    views.forEach((view) => view.webContents?.send(event, ...data));
  };

  sendToFocusedView = (event: string, ...data: unknown[]): void => {
    const { focusedId, tabsMap } = this;

    if (tabsMap[focusedId]) {
      tabsMap[focusedId].view.webContents?.send(event, ...data);
    }
  };
}

export default TabManager;
