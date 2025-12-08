import React, { memo } from 'react';

import { Alert, Empty, Spin } from 'antd';
import { pick } from 'remeda';
import { useShallow } from 'zustand/react/shallow';

import { useAiGenerateStore } from '../useAiGenerateStore';

import HistoryCard from './HistoryCard';
import style from './ImageHistory.module.scss';

const UnmemorizedImageHistory = () => {
  const { historyError, historyItems, historyLoading, importFromHistory } = useAiGenerateStore(
    useShallow(pick(['historyError', 'historyItems', 'historyLoading', 'importFromHistory'])),
  );

  // Initial Loading State
  if (historyLoading && historyItems.length === 0) {
    return (
      <div className={style.container}>
        <Spin size="large" tip="Loading history...">
          <div className={style.loading} />
        </Spin>
      </div>
    );
  }

  // Error State
  if (historyError) {
    return (
      <div className={style.container}>
        <Alert closable description={historyError} message="Failed to load history" showIcon type="error" />
      </div>
    );
  }

  // Empty State
  if (historyItems.length === 0) {
    return (
      <div className={style.container}>
        <Empty description="No generation history yet. Start creating!" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  // List Content
  return (
    <>
      <h3 className={style.title}>Generation History</h3>

      <div className={style.grid}>
        {historyItems.map((item) => (
          <HistoryCard item={item} key={item.uuid} onImport={importFromHistory} />
        ))}
      </div>
    </>
  );
};

const ImageHistory = memo(UnmemorizedImageHistory);

export default ImageHistory;
