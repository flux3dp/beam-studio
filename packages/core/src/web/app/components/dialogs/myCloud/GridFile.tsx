import React, { use, useEffect, useMemo, useRef, useState } from 'react';

import {
  ArrowRightOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EllipsisOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import type { InputRef } from 'antd';
import { Dropdown, Input, Modal } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';

import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { MyCloudContext } from '@core/app/contexts/MyCloudContext';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type { IFile } from '@core/interfaces/IMyCloud';

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
    if (size > k) {
      size /= k;
    } else {
      break;
    }
  }

  return size.toFixed(1) + units[i];
};

const GridFile = ({ file }: Props): React.JSX.Element => {
  const {
    alert: tAlert,
    my_cloud: { action: lang },
  } = useI18n();
  const isMobile = useIsMobile();
  const workarea = getWorkarea(file.workarea as WorkAreaModel);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { editingId, fileOperation, selectedId, setEditingId, setSelectedId } = use(MyCloudContext);
  const inputRef = useRef<InputRef>(null);
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
    if (!isMobile) {
      fileOperation.open(file);
    }
  };

  const actions = [
    { icon: <ArrowRightOutlined />, key: 'open', label: lang.open },
    { icon: <EditOutlined />, key: 'rename', label: lang.rename },
    { icon: <CopyOutlined />, key: 'duplicate', label: lang.duplicate },
    { icon: <DownloadOutlined />, key: 'download', label: lang.download },
    { danger: true, icon: <DeleteOutlined />, key: 'delete', label: lang.delete },
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
    <div
      className={classNames(styles.grid, { [styles.selected]: isSelected && !isEditing })}
      // stop click event from delete modal
      onClick={(e) => e.stopPropagation()}
    >
      <Modal
        cancelText={tAlert.cancel}
        centered
        closeIcon={null}
        mask={false}
        okText={tAlert.ok}
        onCancel={() => setDeleteModalOpen(false)}
        onOk={() => {
          fileOperation.delete(file);
          setDeleteModalOpen(false);
        }}
        open={deleteModalOpen}
        title={
          <>
            <ExclamationCircleFilled className={styles.delete} /> {lang.confirmFileDelete}
          </>
        }
      />
      <div className={styles['img-container']} onClick={onClick} onDoubleClick={onDoubleClick}>
        <div className={styles['guide-lines']} style={{ background: "url('core-img/flux-plus/guide-lines.png')" }}>
          {file.thumbnail_url && <img src={`${file.thumbnail_url}?lastmod=${file.last_modified_at}`} />}
          <Dropdown
            getPopupContainer={(triggerNode) => triggerNode.parentElement!}
            menu={{ items: actions, onClick: onAction }}
            onOpenChange={setActionDropdownOpen}
            open={actionDropdownOpen}
            overlayClassName={styles.overlay}
            placement="bottomRight"
            trigger={['click']}
          >
            <div className={classNames(styles.overlay, styles.trigger)}>
              <EllipsisOutlined />
            </div>
          </Dropdown>
        </div>
      </div>
      <div className={styles.name}>
        {isEditing ? (
          <Input
            className={styles.edit}
            defaultValue={file.name}
            maxLength={255}
            onBlur={onChangeName}
            onChange={(e) => {
              const { value } = e.target;

              setError(!value || value.includes('/'));
            }}
            onPressEnter={onChangeName}
            ref={inputRef}
            size="small"
            status={error ? 'error' : undefined}
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
