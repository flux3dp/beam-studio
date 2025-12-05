import React, { memo, useMemo, useState } from 'react';

import { DownOutlined, ExpandOutlined, FileTextOutlined } from '@ant-design/icons';
import { Badge, Button, Card } from 'antd';
import classNames from 'classnames';
import { match } from 'ts-pattern';

import type { AiImageGenerationData } from '@core/helpers/api/ai-image';

import { useAiConfigQuery } from '../hooks/useAiConfigQuery';
import { laserFriendlyValue } from '../types';
import { getStyleConfig } from '../utils/categories';
import { getSizePixels } from '../utils/dimensions';

import styles from './HistoryCard.module.scss';

interface HistoryCardProps {
  item: AiImageGenerationData;
  onImport: (item: AiImageGenerationData) => void;
}

const filterInputs = (inputs: Record<string, string>) =>
  Object.entries(inputs).filter(
    ([key, value]) =>
      value.trim() !== '' &&
      //
      key !== 'image_counts' &&
      !(key === 'color' && value === laserFriendlyValue),
  );

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
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Get inputs to display as chips
  const inputChips = useMemo(() => {
    const inputs = item.prompt_data.inputs || {};

    return filterInputs(inputs);
  }, [item.prompt_data.inputs]);

  return (
    <Card bordered={false} className={styles.card} styles={{ body: { padding: 0 } }}>
      <div className={styles.cardContent}>
        <div className={styles.title} title={item.prompt_data['style']}>
          {getStyleConfig(item.prompt_data['style'], aiConfig?.styles).displayName || 'Customize'}
        </div>

        <div className={styles.imageGrid}>
          {previewImages?.length &&
            previewImages.map((url, index) => (
              <div className={styles.imageWrapper} key={index}>
                <img alt={`Generated ${index + 1}`} className={styles.image} src={url} />
              </div>
            ))}
          {/* {previewImages?.length ? (
            previewImages.map((url, index) => (
              <div className={styles.imageWrapper} key={index}>
                <img alt={`Generated ${index + 1}`} className={styles.image} src={url} />
              </div>
            ))
          ) : (
            <div className={styles.noPreview}>{item.state === 'fail' ? '❌ Not generated' : '⏳ Generating...'}</div>
          )} */}
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
            <Button
              className={classNames(styles.dropdownButton, { [styles.expanded]: isExpanded })}
              icon={<DownOutlined />}
              onClick={() => setIsExpanded(!isExpanded)}
              size="small"
              type="text"
            />
          </div>
        </div>
      </div>

      {isExpanded &&
        (item.state === 'fail' ? (
          <div className={styles.error} title={item.fail_msg || 'Unknown error'}>
            Error: {item.fail_msg}
          </div>
        ) : (
          <div className={styles.expandedInfo}>
            <div className={styles.chipList}>
              <div className={styles.chip}>
                <ExpandOutlined className={styles.chipIcon} />
                <span>{getSizePixels({ aspectRatio: item.aspect_ratio, size: item.size })}</span>
              </div>

              {inputChips.map(([key, value]) => (
                <div className={styles.chip} key={key} title={`${key}: ${value}`}>
                  <FileTextOutlined className={styles.chipIcon} />
                  <span className={styles.chipText}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </Card>
  );
};

const HistoryCard = memo(UnmemorizedHistoryCard);

export default HistoryCard;
