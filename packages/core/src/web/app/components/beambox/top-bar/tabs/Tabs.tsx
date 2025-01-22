import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { CloseOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import type { DropResult } from 'react-beautiful-dnd';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import dialogCaller from '@core/app/actions/dialog-caller';
import tabController from '@core/app/actions/tabController';
import CanvasMode from '@core/app/constants/canvasMode';
import tabConstants from '@core/app/constants/tabConstants';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import TopBarController from '@core/app/views/beambox/TopBar/contexts/TopBarController';
import cloudFile from '@core/helpers/api/cloudFile';
import useI18n from '@core/helpers/useI18n';
import type Tab from '@core/interfaces/Tab';

import styles from './Tabs.module.scss';

const Tabs = (): React.JSX.Element => {
  const t = useI18n().topbar;
  const { hasUnsavedChange } = useContext(CanvasContext);
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
    const { index: srcIdx } = source;
    const { index: dstIdx } = destination;

    if (srcIdx === dstIdx) {
      return;
    }

    setTabs((cur) => {
      const newTabs = Array.from(cur);
      const [removed] = newTabs.splice(srcIdx, 1);

      newTabs.splice(dstIdx, 0, removed);

      return newTabs;
    });
    tabController.moveTab(srcIdx, dstIdx);
  };

  const renderIcon = useCallback(({ isCloud, isLoading, mode }: Tab) => {
    if (isLoading) {
      return <LoadingOutlined className={classNames(styles.icon, styles.loading)} />;
    }

    if (mode === CanvasMode.Preview) {
      return <TopBarIcons.Camera className={styles.icon} />;
    }

    if (mode === CanvasMode.CurveEngraving) {
      return <TopBarIcons.Curve3D className={styles.icon} />;
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
      defaultValue: currentName,
    });

    if (!newName || newName === currentName) {
      return;
    }

    newName = newName.trim();

    if (currentTabInfo.isCloud) {
      newName = newName.replace(/\//g, '_');

      const { res, status } = await cloudFile.renameFile(currentFileManager.getPath(), newName);

      if (!res && status === 404) {
        currentFileManager.setCloudUUID(null);
      }
    } else {
      currentFileManager.setFileName(newName, { clearPath: true });
    }
  };

  return (
    <div className={styles.container}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable direction="horizontal" droppableId="tabs">
          {(droppableProvided) => (
            <div
              className={styles.tabs}
              {...droppableProvided.droppableProps}
              ref={(node) => droppableProvided.innerRef(node)}
            >
              {tabs.map((tab, idx) => {
                const { id } = tab;
                const isCurrent = id === currentId;
                let { title } = isCurrent ? currentTabInfo : tab;

                if (isCurrent) {
                  title = `${title || t.untitled}${hasUnsavedChange ? '*' : ''}`;
                }

                return (
                  <Draggable draggableId={id.toFixed(0)} index={idx} key={id}>
                    {(draggalbeProvided) => (
                      <div
                        {...draggalbeProvided.draggableProps}
                        {...draggalbeProvided.dragHandleProps}
                        className={classNames(styles.tab, { [styles.focused]: currentId === id })}
                        onClick={() => tabController.focusTab(id)}
                        onDoubleClick={() => {
                          if (id !== currentId) {
                            return;
                          }

                          handleRenameCurrentTab();
                        }}
                        ref={draggalbeProvided.innerRef}
                        title={title}
                      >
                        {renderIcon(tab)}
                        <span className={styles.name}>{title}</span>
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
      {(!tabConstants.maxTab || tabs.length < tabConstants.maxTab) && (
        <div className={styles.add} onClick={tabController.addNewTab}>
          <PlusOutlined />
        </div>
      )}
    </div>
  );
};

export default Tabs;
