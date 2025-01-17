import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, Input, Popconfirm } from 'antd';
import {
  ArrowRightOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';

import useI18n from 'helpers/useI18n';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import { IFile } from 'interfaces/IMyCloud';
import { MyCloudContext } from 'app/contexts/MyCloudContext';
import { useIsMobile } from 'helpers/system-helper';

import styles from './GridFile.module.scss';

interface Props {
  file: IFile;
}

const getFileSize = (bytes: number) => {
  const k = 1000;
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  for (; i < units.length - 1; i += 1) {
    if (size > k) size /= k;
    else break;
  }
  return size.toFixed(1) + units[i];
};

const GridFile = ({ file }: Props): JSX.Element => {
  const lang = useI18n().my_cloud.action;
  const isMobile = useIsMobile();
  const workarea = getWorkarea(file.workarea as WorkAreaModel);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { fileOperation, editingId, setEditingId, selectedId, setSelectedId } =
    useContext(MyCloudContext);
  const inputRef = useRef(null);
  const [error, setError] = useState(false);
  const isEditing = useMemo(() => editingId === file.uuid, [editingId, file]);
  const isSelected = useMemo(() => selectedId === file.uuid, [selectedId, file]);

  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setSelectedId(file.uuid);
    if (isMobile) {
      setActionDropdownOpen(!actionDropdownOpen);
    }
  };

  const onDoubleClick = () => {
    if (!isMobile) fileOperation.open(file);
  };

  const actions = [
    { key: 'open', icon: <ArrowRightOutlined />, label: lang.open },
    { key: 'rename', icon: <EditOutlined />, label: lang.rename },
    { key: 'duplicate', icon: <CopyOutlined />, label: lang.duplicate },
    { key: 'download', icon: <DownloadOutlined />, label: lang.download },
    { key: 'delete', icon: <DeleteOutlined />, label: lang.delete, danger: true },
  ];

  const onAction = (e: { key: string }) => {
    setActionDropdownOpen(false);
    if (e.key === 'open') {
      fileOperation.open(file);
    } else if (e.key === 'rename') {
      setEditingId(file.uuid);
      setError(false);
    } else if (e.key === 'duplicate') {
      fileOperation.duplicate(file);
    } else if (e.key === 'download') {
      fileOperation.download(file);
    } else if (e.key === 'delete') {
      setDeleteModalOpen(true);
    }
  };

  const onChangeName = async (e) => {
    if (error) {
      setEditingId(null);
      return;
    }
    const newName = e.target.value;
    await fileOperation.rename(file, newName);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus({ cursor: 'all' });
    }
  }, [isEditing, inputRef]);

  return (
    <div className={classNames(styles.grid, { [styles.selected]: isSelected && !isEditing })}>
      <div className={styles['img-container']}>
        <div
          className={styles['guide-lines']}
          style={{ background: "url('core-img/flux-plus/guide-lines.png')" }}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        >
          {file.thumbnail_url && (
            <img src={`${file.thumbnail_url}?lastmod=${file.last_modified_at}`} />
          )}
          <Dropdown
            menu={{ items: actions, onClick: onAction }}
            trigger={['click']}
            placement="bottomRight"
            getPopupContainer={(triggerNode) => triggerNode.parentElement}
            overlayClassName={styles.overlay}
            open={actionDropdownOpen}
            onOpenChange={setActionDropdownOpen}
          >
            <div className={classNames(styles.overlay, styles.trigger)}>
              <EllipsisOutlined />
            </div>
          </Dropdown>
          <Popconfirm
            getPopupContainer={(triggerNode) => triggerNode.parentElement}
            overlayClassName={styles.overlay}
            title={lang.confirmFileDelete}
            onConfirm={() => fileOperation.delete(file)}
            arrow={false}
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            onPopupClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <div className={styles.name}>
        {isEditing ? (
          <Input
            className={styles.edit}
            size="small"
            defaultValue={file.name}
            ref={inputRef}
            onChange={(e) => {
              const { value } = e.target;
              setError(!value || value.includes('/'));
            }}
            onBlur={onChangeName}
            onPressEnter={onChangeName}
            status={error ? 'error' : undefined}
            maxLength={255}
          />
        ) : (
          <div className={styles.display} onClick={onClick} onDoubleClick={onDoubleClick}>
            {file.name}
          </div>
        )}
      </div>
      <div className={styles.info}>
        <div>
          {workarea?.label} &bull; {getFileSize(file.size)}
        </div>
        {dayjs(file.last_modified_at).format('MM/DD/YYYY hh:mm A')}
      </div>
    </div>
  );
};

export default GridFile;
