import React, { memo } from 'react';

import { Alert, Empty, Spin } from 'antd';

import { useAiGenerateStore } from '../useAiGenerateStore';

import HistoryCard from './HistoryCard';
import styles from './ImageHistory.module.scss';

const UnmemorizedImageHistory = () => {
  const { historyError, historyItems, historyLoading, importFromHistory } = useAiGenerateStore();

  if (historyLoading && historyItems.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Spin size="large" />
          <p className={styles['loading-text']}>Loading history...</p>
        </div>
      </div>
    );
  }

  if (historyError) {
    return (
      <div className={styles.container}>
        <Alert closable description={historyError} message="Failed to load history" showIcon type="error" />
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className={styles.container}>
        <Empty description="No generation history yet. Start creating!" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Generation History</h3>

      <div className={styles.grid}>
        {historyItems.map((item) => (
          <HistoryCard item={item} key={item.uuid} onImport={importFromHistory} />
        ))}
      </div>

      {historyLoading && historyItems.length > 0 && (
        <div className={styles['loading-more']}>
          <Spin />
          <span>Loading more...</span>
        </div>
      )}
    </div>
  );
};

const ImageHistory = memo(UnmemorizedImageHistory);

export default ImageHistory;
