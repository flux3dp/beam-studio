import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { CloseOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import type { DropResult } from '@hello-pangea/dnd';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';

import dialogCaller from '@core/app/actions/dialog-caller';
import tabController from '@core/app/actions/tabController';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { TabConstants } from '@core/app/constants/ipcEvents';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import cloudFile from '@core/helpers/api/cloudFile';
import useI18n from '@core/helpers/useI18n';
import type Tab from '@core/interfaces/Tab';

import TopBarController from '../contexts/TopBarController';

import styles from './Tabs.module.scss';

interface Props {
  inverse?: boolean;
}

const Tabs = ({ inverse }: Props): React.JSX.Element => {
  const t = useI18n().topbar;
  const currentId = useMemo(() => tabController.getCurrentId(), []);
  const [tabs, setTabs] = useState(tabController.getAllTabs());
  const [currentTabInfo, setCurrentTabInfo] = useState({ isCloud: false, title: '' });

  useEffect(() => {
    const handler = () => setTabs(tabController.getAllTabs());

    tabController.onFocused(handler);
    tabController.onTabsUpdated(handler);

    return () => {
      tabController.offFocused(handler);
      tabController.offTabsUpdated(handler);
    };
  }, []);
  useEffect(() => {
    const handler = (newTitle: string, isCloudFile: boolean) => {
      setCurrentTabInfo({ isCloud: isCloudFile, title: newTitle });
    };

    TopBarController.onTitleChange(handler);

    return () => {
      TopBarController.offTitleChange(handler);
    };
  }, [currentId]);

  const handleDragEnd = ({ destination, source }: DropResult) => {
    if (!destination) return;

    const { index: srcIdx } = source;
    const { index: dstIdx } = destination;

    if (srcIdx === dstIdx) return;

    setTabs((cur) => {
      const newTabs = Array.from(cur);
      const [removed] = newTabs.splice(srcIdx, 1);

      newTabs.splice(dstIdx, 0, removed);

      return newTabs;
    });
    tabController.moveTab(srcIdx, dstIdx);
  };

  const renderIcon = useCallback(({ isCloud, isLoading, isPreviewMode, isWelcomeTab, mode }: Tab) => {
    if (isWelcomeTab) {
      return <TopBarIcons.Home className={styles.icon} />;
    }

    if (isLoading) {
      return <LoadingOutlined className={classNames(styles.icon, styles.loading)} />;
    }

    if (isPreviewMode) {
      return <TopBarIcons.Camera className={styles.icon} />;
    }

    if (mode === CanvasMode.CurveEngraving) {
      return <TopBarIcons.CurveEngraving className={styles.icon} />;
    }

    if (isCloud) {
      return <TopBarIcons.CloudFile className={styles.icon} />;
    }

    return null;
  }, []);

  const handleRenameCurrentTab = async () => {
    const currentName = currentFileManager.getName();
    let newName = await dialogCaller.getPromptValue({
      caption: t.rename_tab,
      defaultValue: currentName ?? '',
    });

    if (!newName || newName === currentName) {
      return;
    }

    newName = newName.trim();

    if (currentTabInfo.isCloud) {
      newName = newName.replace(/\//g, '_');

      const { res, status } = await cloudFile.renameFile(currentFileManager.getPath()!, newName);

      if (!res && status === 404) {
        currentFileManager.setCloudUUID(null);
      }
    } else {
      currentFileManager.setFileName(newName, { clearPath: true });
    }
  };

  return (
    <div className={classNames(styles.container, { [styles.inverse]: inverse })}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable direction="horizontal" droppableId="tabs">
          {(droppableProvided) => (
            <div
              className={styles.tabs}
              {...droppableProvided.droppableProps}
              ref={(node) => droppableProvided.innerRef(node)}
            >
              {tabs.map((tab, idx) => {
                const { hasUnsavedChanges, id, isWelcomeTab } = tab;
                const isCurrent = id === currentId;
                let { title } = isCurrent ? currentTabInfo : tab;

                if (isWelcomeTab) {
                  return (
                    <div
                      className={classNames(styles.tab, styles.small, { [styles.focused]: currentId === id })}
                      key={id}
                      onClick={() => tabController.focusTab(id)}
                    >
                      {renderIcon(tab)}
                    </div>
                  );
                }

                if (isCurrent) {
                  title = title || t.untitled;
                }

                return (
                  <Draggable draggableId={id.toFixed(0)} index={idx} key={id}>
                    {(draggableProvided) => (
                      <div
                        {...draggableProvided.draggableProps}
                        {...draggableProvided.dragHandleProps}
                        className={classNames(styles.tab, { [styles.focused]: currentId === id })}
                        onClick={() => tabController.focusTab(id)}
                        onDoubleClick={() => {
                          if (id !== currentId) {
                            return;
                          }

                          handleRenameCurrentTab();
                        }}
                        ref={draggableProvided.innerRef}
                        title={title}
                      >
                        {renderIcon(tab)}
                        <span className={styles.name}>
                          {title}
                          {hasUnsavedChanges && <span className={styles.asterisk}>*</span>}
                        </span>
                        <span
                          className={styles.close}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            tabController.closeTab(id);
                          }}
                        >
                          <CloseOutlined />
                        </span>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {droppableProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {(!TabConstants.maxTab || tabs.length < TabConstants.maxTab) && (
        <div className={styles.add} onClick={tabController.addNewTab}>
          <PlusOutlined />
        </div>
      )}
    </div>
  );
};

export default Tabs;
