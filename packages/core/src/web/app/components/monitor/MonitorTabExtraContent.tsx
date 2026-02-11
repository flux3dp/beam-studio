import React, { use } from 'react';

import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';

import { ItemType, Mode } from '@core/app/constants/monitor-constants';
import { MonitorContext } from '@core/app/contexts/MonitorContext';

import styles from './MonitorTabExtraContent.module.scss';

const MonitorTabExtraContent = (): React.ReactNode => {
  const { currentPath, highlightedItem, mode, onDownload, showUploadDialog } = use(MonitorContext);

  if (mode !== Mode.FILE) {
    return null;
  }

  const canDownload = highlightedItem?.type === ItemType.FILE;
  const canUpload = currentPath.length > 0;

  return (
    <>
      <button className={styles.btn} disabled={!canUpload} onClick={showUploadDialog} type="button">
        <UploadOutlined />
      </button>
      <button className={styles.btn} disabled={!canDownload} onClick={onDownload} type="button">
        <DownloadOutlined />
      </button>
    </>
  );
};

export default MonitorTabExtraContent;
