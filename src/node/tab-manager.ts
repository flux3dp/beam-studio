import path from 'path';
import url from 'url';

// eslint-disable-next-line import/no-extraneous-dependencies
import { BaseWindow, IpcMainEvent, ipcMain, WebContentsView } from 'electron';
import { enable as enableRemote } from '@electron/remote/main';

import i18n from 'helpers/i18n';

import initStore from './helpers/init-store';

class TabManager {
  private mainWindow: BaseWindow;
  private tabsMap: Record<
    number,
    {
      view: WebContentsView;
      title: string;
    }
  > = {};
  private focusedId: number = -1;
  private isDebug = false;

  constructor(mainWindow: BaseWindow, { isDebug = false } = {}) {
    this.mainWindow = mainWindow;
    this.isDebug = isDebug;
    this.setupEvents();
  }

  setupEvents = () => {
    ipcMain.on('focus-tab', (e, id: number) => {
      this.focusTab(id);
    });

    ipcMain.on('create-tab', () => {
      this.createTab();
    });

    ipcMain.on('close-tab', (e, id: number) => {
      this.closeTab(id);
    });

    this.mainWindow?.on('resized', () => {
      const bound = this.mainWindow?.getContentBounds();
      if (bound) {
        bound.x = 0;
        bound.y = 0;
        const views = Object.values(this.tabsMap).map(({ view }) => view);
        views.forEach((view) => view.setBounds(bound));
      }
    });
  };

  createTab = () => {
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
    const { id } = webContents;
    if (!process.argv.includes('--test') && (process.defaultApp || this.isDebug))
      webContents.openDevTools();
    const title = i18n.lang.topbar.untitled;
    this.tabsMap[id] = { view: tabView, title };
    console.log('createTab', id, this.tabsMap);
    const bound = this.mainWindow?.getContentBounds();
    if (bound) tabView.setBounds({ ...bound, x: 0, y: 0 });
    this.focusTab(id);
  };

  focusTab = (id: number) => {
    if (this.tabsMap[id]) {
      this.focusedId = id;
      Object.values(this.tabsMap).forEach(({ view }) =>
        view.setVisible(view.webContents.id === id)
      );
      const { view } = this.tabsMap[id];
      view.webContents.focus();
      view.webContents.send('TAB_FOCUSED');
    }
  };

  getFocusedView = () => {
    const { focusedId, tabsMap } = this;
    if (tabsMap[focusedId]) return tabsMap[focusedId].view;
    return null;
  };

  getAllViews = () => Object.values(this.tabsMap).map(({ view }) => view);

  closeWebContentsView = (view: WebContentsView) => {
    const { id } = view.webContents;
    return new Promise<boolean>((resolve) => {
      const closeHandler = () => {
        this.mainWindow?.contentView.removeChildView(view);
        view.webContents.close();
        delete this.tabsMap[id];
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

  closeTab = async (id: number, allowEmpty = false): Promise<boolean> => {
    const { tabsMap, focusedId } = this;
    if (tabsMap[id] && (allowEmpty || Object.keys(tabsMap).length > 1)) {
      const res = await this.closeWebContentsView(tabsMap[id].view);
      if (res && focusedId === id) {
        const ids = Object.keys(tabsMap);
        if (ids.length) {
          const targetId = parseInt(ids[0], 10);
          this.focusTab(targetId);
        }
      }
      return res;
    }
    return false;
  };

  closeAllTabs = async () => {
    const ids = Object.keys(this.tabsMap);
    for (let i = 0; i < ids.length; i += 1) {
      const id = parseInt(ids[i], 10);
      console.log(this.tabsMap[id]);
      const res = await this.closeTab(id, true);
      if (!res) return false;
    }
    return true;
  };

  sendToView = (id: number, event: string, data?: any) => {
    if (this.tabsMap[id]) this.tabsMap[id].view.webContents.send(event, data);
  };

  sendToAllViews = (event: string, data?: any) => {
    const allViews = Object.values(this.tabsMap).map(({ view }) => view);
    allViews.forEach((view) => view.webContents.send(event, data));
  };

  sendToFocusedView = (event: string, data?: any) => {
    const { focusedId, tabsMap } = this;
    if (tabsMap[focusedId]) tabsMap[focusedId].view.webContents.send(event, data);
  };
}

export default TabManager;
