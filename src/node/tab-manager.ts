import path from 'path';
import url from 'url';

// eslint-disable-next-line import/no-extraneous-dependencies
import { BaseWindow, IpcMainEvent, ipcMain, WebContentsView } from 'electron';
import { enable as enableRemote } from '@electron/remote/main';

import i18n from 'helpers/i18n';
import tabConstants from 'app/constants/tab-constants';
import { Tab as FrontendTab } from 'interfaces/Tab';

import initStore from './helpers/initStore';

interface Tab {
  view: WebContentsView;
  title: string;
  isCloud: boolean;
}

class TabManager {
  private mainWindow: BaseWindow;
  private tabsMap: Record<number, Tab> = {};
  private tabsList: number[] = [];
  private preloadedTab: Tab | null = null;
  private focusedId = -1;
  private isDebug = false;

  constructor(mainWindow: BaseWindow, { isDebug = false } = {}) {
    this.mainWindow = mainWindow;
    this.isDebug = isDebug;
    this.setupEvents();
  }

  setupEvents = (): void => {
    ipcMain.on('focus-tab', (e, id: number) => {
      this.focusTab(id);
    });

    ipcMain.on('add-new-tab', () => {
      this.addNewTab();
    });

    ipcMain.on('close-tab', (e, id: number) => {
      this.closeTab(id, { allowEmpty: true, shouldCloseWindow: true });
    });

    ipcMain.on('move-tab', (e, srcIdx: number, dstIdx: number) => {
      this.moveTab(srcIdx, dstIdx);
    });

    ipcMain.on('get-tab-id', (e) => {
      e.returnValue = e.sender.id;
    });
    ipcMain.on('set-tab-title', (e, title: string, isCloud: boolean) => {
      this.onTabTitleChanged(e.sender.id, title, isCloud);
    });

    ipcMain.on('get-all-tabs', (e) => {
      e.returnValue = this.serializeTabs();
    });
    const handleWindowSizeChanged = () => {
      const views = this.getAllViews();
      this.updateViewsBounds(views);
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
      this.preloadedTab?.view.webContents.close();
    });
  };

  private updateViewsBounds = (views: WebContentsView[]): void => {
    const bound = this.mainWindow?.getContentBounds();
    if (bound) {
      views.forEach((view) => view.setBounds({...bound, x: 0, y: 0}));
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
    this.tabsList.map((id: number) => ({
      id,
      title: this.tabsMap[id].title,
      isCloud: this.tabsMap[id].isCloud,
    }));

  private notifyTabUpdated = (): void => {
    this.sendToAllViews('TABS_UPDATED', this.serializeTabs());
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
    webContents.on('devtools-closed', () => {
      this.updateViewsBounds([tabView]);
    });
    const title = i18n.lang.topbar.untitled;
    const tab = { view: tabView, title, isCloud: false };
    this.updateViewsBounds([tabView]);
    return tab;
  };

  private preloadTab = (): void => {
    if (
      !this.preloadedTab &&
      (!tabConstants.maxTab || this.tabsList.length < tabConstants.maxTab)
    ) {
      this.preloadedTab = this.createTab();
    }
  };

  addNewTab = (): void => {
    if (this.preloadedTab) {
      console.log('using preloaded tab', this.preloadedTab.view.webContents.id, this.tabsMap);
    }
    const newTab = this.preloadedTab ?? this.createTab();
    this.preloadedTab = null;
    const { id } = newTab.view.webContents;
    this.tabsMap[id] = newTab;
    this.tabsList.push(id);
    this.preloadTab();
    this.focusTab(id);
    this.notifyTabUpdated();
  };

  focusTab = (id: number): void => {
    if (this.tabsMap[id]) {
      this.focusedId = id;
      const { view } = this.tabsMap[id];
      this.mainWindow.contentView.addChildView(view);
      view.webContents.focus();
      view.webContents.send('TAB_FOCUSED');
    }
  };

  getFocusedView = (): WebContentsView | null => {
    const { focusedId, tabsMap } = this;
    if (tabsMap[focusedId]) return tabsMap[focusedId].view;
    return null;
  };

  getAllViews = (shouldIncludePreloaded = true): WebContentsView[] => {
    const res = Object.values(this.tabsMap).map(({ view }) => view);
    if (shouldIncludePreloaded && this.preloadedTab) res.push(this.preloadedTab.view);
    return res;
  }

  private closeWebContentsView = (view: WebContentsView) => {
    const { id } = view.webContents;
    return new Promise<boolean>((resolve) => {
      const closeHandler = () => {
        this.mainWindow?.contentView.removeChildView(view);
        view.webContents.close();
        resolve(true);
      };
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
      const res = await this.closeWebContentsView(tabsMap[id].view);
      if (res) {
        delete this.tabsMap[id];
        this.tabsList = this.tabsList.filter((tabId) => tabId !== id);
        if (focusedId === id) {
          if (this.tabsList.length) {
            this.focusTab(this.tabsList[0]);
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
