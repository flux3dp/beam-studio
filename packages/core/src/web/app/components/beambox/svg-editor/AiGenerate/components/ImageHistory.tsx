import React, { memo } from 'react';

import { LeftOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Spin } from 'antd';
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
        <Spin size="large" tip={t.loading.history}>
          <div className={style.loading} />
        </Spin>
      </div>
    );
  }

  // Error State
  if (historyError) {
    return (
      <div className={style.container}>
        <Alert closable description={historyError} message={t.history.error_message} showIcon type="error" />
      </div>
    );
  }

  // Empty State
  if (historyItems.length === 0) {
    return (
      <div className={style.container}>
        <Empty description={t.history.empty_description} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  // List Content
  return (
    <>
      <div className={style.title}>
        <Button
          icon={<LeftOutlined />}
          onClick={() => useAiGenerateStore.setState({ showHistory: false })}
          shape="circle"
          type="text"
        />
        {t.history.title}
      </div>

      <div className={style.grid}>
        {historyItems.map((item) => (
          <HistoryCard item={item} key={item.uuid} onImport={importFromHistory} />
        ))}
      </div>

      <div className={style['info-banner']}>{t.history.storage_notice}</div>
    </>
  );
};

const ImageHistory = memo(UnmemorizedImageHistory);

export default ImageHistory;
