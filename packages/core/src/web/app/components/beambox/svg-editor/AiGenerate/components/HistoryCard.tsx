import React, { memo } from 'react';

import { ImportOutlined } from '@ant-design/icons';
import { Badge, Button, Card } from 'antd';
import { match, P } from 'ts-pattern';

import type { AiImageGenerationData } from '@core/helpers/api/ai-image';

import styles from './HistoryCard.module.scss';

interface HistoryCardProps {
  item: AiImageGenerationData;
  onImport: (item: AiImageGenerationData) => void;
}

/**
 * Format a timestamp to a relative time string (e.g., "2 hours ago")
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted relative time string
 */
const formatRelativeTime = (timestamp: string): string => {
  const now = Date.now();
  const date = new Date(timestamp);
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';

  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

const getStatusBadge = (state: string) =>
  match(state)
    .with('success', () => <Badge status="success" text="Success" />)
    .with('fail', () => <Badge status="error" text="Failed" />)
    .with('waiting', 'pending', () => <Badge status="processing" text="Generating" />)
    .otherwise(() => null);

const getImageSizeLabel = (imageSize: string): string =>
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
    .with(P.string.includes('21_9'), () => '21:9')
    .otherwise(() => '1:1');

const UnmemorizedHistoryCard = ({ item, onImport }: HistoryCardProps) => {
  const getModelTypeBadge = () => (
    <span className={styles['model-badge']}>{item.model_type === 'edit' ? '🖼️ Edit' : '✨ Text-to-Image'}</span>
  );

  const previewImg = item.result_urls && item.result_urls.length > 0 ? item.result_urls[0] : null;

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
          {getStatusBadge(item.state)}
          {getModelTypeBadge()}
        </div>

        {/* <p className={styles.prompt} title={item.prompt}>
          {item.prompt}
        </p> */}

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
