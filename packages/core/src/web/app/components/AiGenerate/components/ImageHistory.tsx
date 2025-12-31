import React, { memo } from 'react';

import { LeftOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Spin } from 'antd';
import { pick } from 'remeda';
import { match, P } from 'ts-pattern';
import { useShallow } from 'zustand/react/shallow';

import { isMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import { useAiGenerateStore } from '../useAiGenerateStore';

import HistoryCard from './HistoryCard';
import styles from './ImageHistory.module.scss';

const ImageHistory = memo(() => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const { historyError, historyItems, historyLoading, importFromHistory, toggleHistory } = useAiGenerateStore(
    useShallow(pick(['historyError', 'historyItems', 'historyLoading', 'importFromHistory', 'toggleHistory'])),
  );

  const content = match({ historyError, historyItems, historyLoading })
    .with({ historyItems: [], historyLoading: true }, () => (
      <Spin size="large" tip={t.loading.history}>
        <div className={styles.loading} />
      </Spin>
    ))
    .with({ historyError: P.string }, () => (
      <Alert closable description={historyError} message={t.history.error_message} showIcon type="error" />
    ))
    .with({ historyItems: [] }, () => (
      <Empty description={t.history.empty_description} image={Empty.PRESENTED_IMAGE_SIMPLE} />
    ))
    .otherwise(() => (
      <>
        <div className={styles.grid}>
          {historyItems.map((item) => (
            <HistoryCard item={item} key={item.uuid} onImport={importFromHistory} />
          ))}
        </div>
        <div className={styles['info-banner']}>{t.history.storage_notice}</div>
      </>
    ));

  return (
    <div className={styles.container}>
      {!isMobile() && (
        <div className={styles.header}>
          <Button icon={<LeftOutlined />} onClick={toggleHistory} shape="circle" type="text" />
          <span className={styles.title}>{t.history.title}</span>
        </div>
      )}
      {content}
    </div>
  );
});

export default ImageHistory;
