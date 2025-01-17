import EventEmitter from 'eventemitter3';

import communicator from 'implementations/communicator';
import currentFileManager from 'app/svgedit/currentFileManager';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import i18n from 'helpers/i18n';
import { CanvasMode } from 'app/constants/canvasMode';
import { Tab } from 'interfaces/Tab';
import { TabEvents } from 'app/constants/tabConstants';

class TabController extends EventEmitter {
  private currentInfo: { title: string; isCloud: boolean } = null;

  public currentId: number | null = null;

  constructor() {
    super();
    communicator.on(TabEvents.TabFocused, () => {
      this.emit(TabEvents.TabFocused);
    });
    communicator.on(TabEvents.TabBlurred, () => {
      this.emit(TabEvents.TabBlurred);
    });
    communicator.on(TabEvents.TabUpdated, (_, tabs: Array<Tab>) => {
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
        this.currentInfo = { title, isCloud: isCloudFile };
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

  onTabsUpdated(handler: (tabs: Array<Tab>) => void): void {
    this.on(TabEvents.TabUpdated, handler);
  }

  offTabsUpdated(handler: (tabs: Array<Tab>) => void): void {
    this.off(TabEvents.TabUpdated, handler);
  }

  getCurrentId = (): number | null => this.currentId;

  getAllTabs = (): Array<Tab> => communicator.sendSync(TabEvents.GetAllTabs);

  addNewTab = (): void => communicator.send(TabEvents.AddNewTab);

  closeTab = (id: number): void => communicator.send(TabEvents.CloseTab, id);

  moveTab = (srcIdx: number, dstIdx: number): void => {
    communicator.send(TabEvents.MoveTab, srcIdx, dstIdx);
  };

  focusTab = (id: number): void => {
    if (id === this.currentId) return;
    communicator.send(TabEvents.FocusTab, id);
  };

  setMode = (mode: CanvasMode): void => {
    communicator.send(TabEvents.SetTabMode, mode);
  };
}

const tabController = new TabController();

export default tabController;
