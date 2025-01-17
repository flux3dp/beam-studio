import React, { useContext } from 'react';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';

import { Mode, ItemType } from 'app/constants/monitor-constants';
import { MonitorContext } from 'app/contexts/MonitorContext';
import styles from './MonitorTabExtraContent.module.scss';

const MonitorTabExtraContent = (): JSX.Element => {
  const { currentPath, mode, highlightedItem, onDownload, showUploadDialog } = useContext(MonitorContext);

  if (mode !== Mode.FILE) return null;
  const canDownload = highlightedItem?.type === ItemType.FILE;
  const canUpload = currentPath.length > 0;
  return (
    <>
      <button type="button" className={styles.btn} disabled={!canUpload} onClick={showUploadDialog}>
        <UploadOutlined />
      </button>
      <button type="button" className={styles.btn} disabled={!canDownload} onClick={onDownload}>
        <DownloadOutlined />
      </button>
    </>
  );
};

export default MonitorTabExtraContent;
