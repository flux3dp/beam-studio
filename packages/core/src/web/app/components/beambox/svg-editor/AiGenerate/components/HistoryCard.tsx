import React, { memo, useMemo } from 'react';

import { DownOutlined } from '@ant-design/icons';
import { Badge, Button, Card } from 'antd';
import classNames from 'classnames';
import { match } from 'ts-pattern';

import type { AiImageGenerationData } from '@core/helpers/api/ai-image';

import { useAiConfigQuery } from '../hooks/useAiConfigQuery';
import { getStyleConfig } from '../utils/categories';

import styles from './HistoryCard.module.scss';

interface HistoryCardProps {
  item: AiImageGenerationData;
  onImport: (item: AiImageGenerationData) => void;
}

// New date formatter to match the image design (e.g., 2025/11/4 11:35)
const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

const UnmemorizedHistoryCard = ({ item, onImport }: HistoryCardProps) => {
  const previewImages = item.result_urls;
  const formattedDate = useMemo(() => formatDate(item.created_at), [item.created_at]);
  const { data: aiConfig } = useAiConfigQuery();

  const renderStatusBadge = () =>
    match(item.state)
      .with('success', () => (
        <Badge className={classNames(styles.statusBadge, styles.success)} status="success" text="Success" />
      ))
      .with('fail', () => (
        <Badge className={classNames(styles.statusBadge, styles.fail)} status="error" text="Failed" />
      ))
      .otherwise(() => <Badge className={styles.statusBadge} status="processing" text="Generating" />);

  return (
    <Card bordered={false} className={styles.card} styles={{ body: { padding: 0 } }}>
      <div className={styles.cardContent}>
        <div className={styles.title} title={item.prompt_data['style']}>
          {getStyleConfig(item.prompt_data['style'], aiConfig?.styles).displayName || 'Customize'}
        </div>

        <div className={styles.imageGrid}>
          {previewImages?.length ? (
            previewImages.map((url, index) => (
              <div className={styles.imageWrapper} key={index}>
                <img alt={`Generated ${index + 1}`} className={styles.image} src={url} />
              </div>
            ))
          ) : (
            <div className={styles.noPreview}>{item.state === 'fail' ? '❌ Not generated' : '⏳ Generating...'}</div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {renderStatusBadge()}
            <span className={styles.date}>{formattedDate}</span>
          </div>
          <div className={styles.footerRight}>
            <Button className={styles.recreateButton} onClick={() => onImport(item)}>
              Recreate
            </Button>
            <Button className={styles.dropdownButton} icon={<DownOutlined />} size="small" type="text" />
          </div>
        </div>

        {item.state === 'fail' && item.fail_msg && (
          <div className={styles.error} title={item.fail_msg}>
            Error: {item.fail_msg}
          </div>
        )}
      </div>
    </Card>
  );
};

const HistoryCard = memo(UnmemorizedHistoryCard);

export default HistoryCard;
