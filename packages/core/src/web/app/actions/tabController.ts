import { EventEmitter } from 'eventemitter3';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { TabEvents } from '@core/app/constants/tabConstants';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import type { FileData } from '@core/helpers/fileImportHelper';
import { importFileInCurrentTab } from '@core/helpers/fileImportHelper';
import i18n from '@core/helpers/i18n';
import communicator from '@core/implementations/communicator';
import type { Tab } from '@core/interfaces/Tab';

class TabController extends EventEmitter {
  private currentInfo: null | { isCloud: boolean; title: string } = null;

  public currentId: null | number = null;
  public isFocused = false;
  public isWelcomeTab: boolean | null = null;

  constructor() {
    super();
    communicator.on(TabEvents.TabFocused, () => {
      this.emit(TabEvents.TabFocused);
      this.isFocused = true;
      window.document.body.classList.add('focused');
    });
    communicator.on(TabEvents.TabBlurred, () => {
      this.emit(TabEvents.TabBlurred);
      this.isFocused = false;
      window.document.body.classList.remove('focused');
    });
    communicator.on(TabEvents.TabUpdated, (_: unknown, tabs: Tab[]) => {
      this.emit(TabEvents.TabUpdated, tabs);
    });
    communicator.on(TabEvents.ImportFileInTab, (_: unknown, file: FileData) => {
      importFileInCurrentTab(file);
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
    useStorageStore.subscribe((state) => state['active-lang'], updateTitleHandler);
    useCanvasStore.subscribe(
      (state) => state.mode,
      (mode) => this.setMode(mode),
    );
    useCameraPreviewStore.subscribe(
      (state) => state.isPreviewMode,
      (isPreviewMode) => this.setIsPreviewMode(isPreviewMode),
    );
    // Send init state to main process
    this.setMode(CanvasMode.Draw);
    this.setIsPreviewMode(false);
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

  getIsWelcomeTab = (): boolean => {
    if (this.isWelcomeTab === null) {
      const tab = this.getAllTabs().find((t) => t.id === this.currentId);

      this.isWelcomeTab = tab?.isWelcomeTab ?? false;
    }

    return this.isWelcomeTab;
  };

  addNewTab = (): void => communicator.send(TabEvents.AddNewTab);

  closeTab = (id: number): void => communicator.send(TabEvents.CloseTab, id);

  moveTab = (srcIdx: number, dstIdx: number): void => {
    communicator.send(TabEvents.MoveTab, srcIdx, dstIdx);
  };

  focusTab = (id: number): void => {
    if (id === this.currentId) return;

    communicator.send(TabEvents.FocusTab, id);
  };

  setIsPreviewMode = (isPreviewMode: boolean): void => {
    communicator.send(TabEvents.SetTabIsPreviewMode, isPreviewMode);
  };

  setMode = (mode: CanvasMode): void => {
    communicator.send(TabEvents.SetTabMode, mode);
  };
}

const tabController = new TabController();

export default tabController;
