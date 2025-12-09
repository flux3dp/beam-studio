import React, { memo } from 'react';

import { Alert, Empty, Spin } from 'antd';
import { pick } from 'remeda';
import { useShallow } from 'zustand/react/shallow';

import useI18n from '@core/helpers/useI18n';

import { useAiGenerateStore } from '../useAiGenerateStore';

import HistoryCard from './HistoryCard';
import style from './ImageHistory.module.scss';

const UnmemorizedImageHistory = () => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;

  const { historyError, historyItems, historyLoading, importFromHistory } = useAiGenerateStore(
    useShallow(pick(['historyError', 'historyItems', 'historyLoading', 'importFromHistory'])),
  );

  // Initial Loading State
  if (historyLoading && historyItems.length === 0) {
    return (
      <div className={style.container}>
        <Spin size="large" tip={t.loading_history}>
          <div className={style.loading} />
        </Spin>
      </div>
    );
  }

  // Error State
  if (historyError) {
    return (
      <div className={style.container}>
        <Alert closable description={historyError} message={t.history_error_message} showIcon type="error" />
      </div>
    );
  }

  // Empty State
  if (historyItems.length === 0) {
    return (
      <div className={style.container}>
        <Empty description={t.empty_history_description} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  // List Content
  return (
    <>
      <h3 className={style.title}>{t.generation_history}</h3>

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
