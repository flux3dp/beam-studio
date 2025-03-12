import { EventEmitter } from 'eventemitter3';

import type { CanvasMode } from '@core/app/constants/canvasMode';
import { TabEvents } from '@core/app/constants/tabConstants';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import communicator from '@core/implementations/communicator';
import type { Tab } from '@core/interfaces/Tab';

class TabController extends EventEmitter {
  private currentInfo: null | { isCloud: boolean; title: string } = null;

  public currentId: null | number = null;
  public isFocused = false;

  constructor() {
    super();
    communicator.on(TabEvents.TabFocused, () => {
      this.emit(TabEvents.TabFocused);
      this.isFocused = true;
    });
    communicator.on(TabEvents.TabBlurred, () => {
      this.emit(TabEvents.TabBlurred);
      this.isFocused = false;
    });
    communicator.on(TabEvents.TabUpdated, (_: unknown, tabs: Tab[]) => {
      this.emit(TabEvents.TabUpdated, tabs);
    });
    this.currentId = communicator.sendSync(TabEvents.GetTabId);

    const topBarEventEmitter = eventEmitterFactory.createEventEmitter('top-bar');
    const updateTitleHandler = () => {
      const { isCloudFile } = currentFileManager;
      const name = currentFileManager.getName();
      const hasUnsavedChanges = currentFileManager.getHasUnsavedChanges();
      const title = `${name || i18n.lang.topbar.untitled}${hasUnsavedChanges ? '*' : ''}`;
      const { currentInfo } = this;

      if (!currentInfo || currentInfo.title !== title || currentInfo.isCloud !== isCloudFile) {
        this.currentInfo = { isCloud: isCloudFile, title };
        communicator.send(TabEvents.SetTabTitle, title, isCloudFile);
      }
    };

    topBarEventEmitter.on('UPDATE_TITLE', updateTitleHandler);
    topBarEventEmitter.on('SET_HAS_UNSAVED_CHANGE', updateTitleHandler);
  }

  onBlurred(handler: () => void): void {
    this.on(TabEvents.TabBlurred, handler);
  }

  offBlurred(handler: () => void): void {
    this.off(TabEvents.TabBlurred, handler);
  }

  onFocused(handler: () => void): void {
    this.on(TabEvents.TabFocused, handler);
  }

  offFocused(handler: () => void): void {
    this.off(TabEvents.TabFocused, handler);
  }

  onTabsUpdated(handler: (tabs: Tab[]) => void): void {
    this.on(TabEvents.TabUpdated, handler);
  }

  offTabsUpdated(handler: (tabs: Tab[]) => void): void {
    this.off(TabEvents.TabUpdated, handler);
  }

  getCurrentId = (): null | number => this.currentId;

  getAllTabs = (): Tab[] => communicator.sendSync(TabEvents.GetAllTabs);

  addNewTab = (): void => communicator.send(TabEvents.AddNewTab);

  closeTab = (id: number): void => communicator.send(TabEvents.CloseTab, id);

  moveTab = (srcIdx: number, dstIdx: number): void => {
    communicator.send(TabEvents.MoveTab, srcIdx, dstIdx);
  };

  focusTab = (id: number): void => {
    if (id === this.currentId) {
      return;
    }

    communicator.send(TabEvents.FocusTab, id);
  };

  setMode = (mode: CanvasMode): void => {
    communicator.send(TabEvents.SetTabMode, mode);
  };
}

const tabController = new TabController();

export default tabController;
