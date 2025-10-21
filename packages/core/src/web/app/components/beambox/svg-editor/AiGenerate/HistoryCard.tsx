import React, { memo } from 'react';

import { ImportOutlined } from '@ant-design/icons';
import { Badge, Button, Card } from 'antd';
import { match } from 'ts-pattern';

import type { AiImageGenerationData } from '@core/helpers/api/ai-image';

import styles from './HistoryCard.module.scss';
import { formatRelativeTime, getAspectRatioLabel, getImageSizeLabel } from './utils';

interface HistoryCardProps {
  item: AiImageGenerationData;
  onImport: (item: AiImageGenerationData) => void;
}

const UnmemorizedHistoryCard = ({ item, onImport }: HistoryCardProps) => {
  const getStatusBadge = () =>
    match(item.state)
      .with('success', () => <Badge status="success" text="Success" />)
      .with('fail', () => <Badge status="error" text="Failed" />)
      .with('waiting', 'pending', () => <Badge status="processing" text="Generating" />)
      .otherwise(() => null);

  const getModelTypeBadge = () => (
    <span className={styles['model-badge']}>{item.model_type === 'edit' ? '🖼️ Edit' : '✨ Text-to-Image'}</span>
  );

  const getPreviewImage = () => {
    if (item.result_urls && item.result_urls.length > 0) {
      return item.result_urls[0];
    }

    return null;
  };

  const previewImg = getPreviewImage();

  return (
    <Card className={styles.card}>
      <div className={styles.preview}>
        {previewImg ? (
          <img alt="Generated" className={styles.image} src={previewImg} />
        ) : (
          <div className={styles['no-preview']}>{item.state === 'fail' ? '❌ Failed' : '⏳ Generating...'}</div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          {getStatusBadge()}
          {getModelTypeBadge()}
        </div>

        <p className={styles.prompt} title={item.prompt}>
          {item.prompt}
        </p>

        <div className={styles.metadata}>
          <span className={styles['metadata-item']}>
            {getImageSizeLabel(item.image_size)} {getAspectRatioLabel(item.image_size)}
          </span>
          <span className={styles['metadata-separator']}>•</span>
          <span className={styles['metadata-item']}>{item.image_resolution}</span>
          <span className={styles['metadata-separator']}>•</span>
          <span className={styles['metadata-item']}>Count: {item.max_images}</span>
        </div>

        <div className={styles.footer}>
          <span className={styles.time}>{formatRelativeTime(item.created_at)}</span>
          <Button
            disabled={item.state !== 'success'}
            icon={<ImportOutlined />}
            onClick={() => onImport(item)}
            size="small"
            type="primary"
          >
            Import
          </Button>
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
