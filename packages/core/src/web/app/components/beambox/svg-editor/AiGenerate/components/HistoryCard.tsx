import React, { memo, useMemo } from 'react';

import { ImportOutlined } from '@ant-design/icons';
import { Badge, Button, Card } from 'antd';
import { match, P } from 'ts-pattern';

import type { AiImageGenerationData } from '@core/helpers/api/ai-image';

import styles from './HistoryCard.module.scss';

interface HistoryCardProps {
  item: AiImageGenerationData;
  onImport: (item: AiImageGenerationData) => void;
}

const formatRelativeTime = (timestamp: string): string => {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

  if (seconds < 60) return 'Just now';

  const units = [
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const { label, seconds: unitSeconds } of units) {
    const count = Math.floor(seconds / unitSeconds);

    if (count >= 1) return `${count} ${label}${count !== 1 ? 's' : ''} ago`;
  }

  return 'Recently';
};

const getImageOrientationLabel = (imageSize: string): string =>
  match(imageSize)
    .with(P.string.includes('square'), () => 'Square')
    .with(P.string.includes('landscape'), () => 'Landscape')
    .with(P.string.includes('portrait'), () => 'Portrait')
    .otherwise((imageSize) => imageSize);

const getAspectRatioLabel = (imageSize: string): string =>
  match(imageSize)
    .with(P.string.includes('16_9'), () => '16:9')
    .with(P.string.includes('4_3'), () => '4:3')
    .with(P.string.includes('3_2'), () => '3:2')
    .otherwise(() => '1:1');

const UnmemorizedHistoryCard = ({ item, onImport }: HistoryCardProps) => {
  const previewImg = item.result_urls?.[0];
  const relativeTime = useMemo(() => formatRelativeTime(item.created_at), [item.created_at]);

  const renderStatusBadge = () =>
    match(item.state)
      .with('success', () => <Badge status="success" text="Success" />)
      .with('fail', () => <Badge status="error" text="Failed" />)
      .otherwise(() => <Badge status="processing" text="Generating" />);

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
          {renderStatusBadge()}
          <span className={styles['model-badge']}>{item.model_type === 'edit' ? '🖼️ Edit' : '✨ Text-to-Image'}</span>
        </div>

        <div className={styles.metadata}>
          <span className={styles['metadata-item']}>
            {getImageOrientationLabel(item.image_size)} {getAspectRatioLabel(item.image_size)}
          </span>
          <span className={styles['metadata-separator']}>•</span>
          <span className={styles['metadata-item']}>{item.image_resolution}</span>
          <span className={styles['metadata-separator']}>•</span>
          <span className={styles['metadata-item']}>Count: {item.max_images}</span>
        </div>

        <div className={styles.footer}>
          <span className={styles.time}>{relativeTime}</span>
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
