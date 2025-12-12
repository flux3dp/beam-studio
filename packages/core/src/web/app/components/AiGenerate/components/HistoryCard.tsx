import React, { memo, useCallback, useMemo, useState } from 'react';

import {
  DownloadOutlined,
  DownOutlined,
  ImportOutlined,
  LayoutOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Badge, Button, Card } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { match } from 'ts-pattern';

import { importAiImage } from '@core/app/svgedit/operations/import/importAiImage';
import type { AiImageGenerationData } from '@core/helpers/api/ai-image';
import useI18n from '@core/helpers/useI18n';

import { useAiConfigQuery } from '../hooks/useAiConfigQuery';
import { useTipIndex } from '../hooks/useTipIndex';
import { laserFriendlyValue } from '../types';
import { getStyleConfig } from '../utils/categories';
import { getSizePixels } from '../utils/dimensions';
import { handleDownload } from '../utils/handleDownload';

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

const UnmemorizedHistoryCard = ({ item, onImport }: HistoryCardProps) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const [isExpanded, setIsExpanded] = useState(false);
  const [importingUrl, setImportingUrl] = useState<null | string>(null);
  const previewImages = item.result_urls;
  const formattedDate = useMemo(() => dayjs(item.created_at).format('YYYY/MM/DD HH:mm'), [item.created_at]);
  const { data: aiConfig } = useAiConfigQuery();
  const isLaserFriendly = useMemo(
    () => item.prompt_data.inputs?.color === laserFriendlyValue,
    [item.prompt_data.inputs],
  );
  const displayInputs = useMemo(() => filterInputs(item.prompt_data.inputs), [item.prompt_data.inputs]);
  const { inputFields } = getStyleConfig(item.prompt_data['style'], aiConfig?.styles);
  const tipIndex = useTipIndex(dayjs(item.created_at).valueOf());

  const handleImageImport = useCallback(async (url: string) => {
    setImportingUrl(url);
    try {
      await importAiImage(url);
    } finally {
      setImportingUrl(null);
    }
  }, []);

  const renderStatusBadge = () =>
    match(item.state)
      .with('success', () => (
        <Badge
          className={classNames(styles.statusBadge, styles.success)}
          status="success"
          text={t.history.status_success}
        />
      ))
      .with('fail', () => (
        <Badge className={classNames(styles.statusBadge, styles.fail)} status="error" text={t.history.status_failed} />
      ))
      .otherwise(() => <Badge className={styles.statusBadge} status="processing" text={t.history.status_generating} />);

  return (
    <Card bordered={false} className={styles.card} styles={{ body: { padding: 0 } }}>
      <div className={styles.cardContent}>
        <div className={styles.title} title={item.prompt_data['style']}>
          {getStyleConfig(item.prompt_data['style'], aiConfig?.styles).displayName || t.style.customize}
        </div>

        <div className={styles.imageGrid}>
          {previewImages?.length ? (
            previewImages.map((url, index) => (
              <div className={styles.imageWrapper} key={index}>
                <img alt={`Generated ${index + 1}`} className={styles.image} src={url} />
                <div className={styles.overlay}>
                  <Button
                    className={styles.actionButton}
                    icon={<ImportOutlined />}
                    loading={importingUrl === url}
                    onClick={() => handleImageImport(url)}
                    size="small"
                    type="primary"
                  >
                    {t.results.import}
                  </Button>
                  <Button
                    className={styles.actionButton}
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(url)}
                    size="small"
                  >
                    {t.results.download}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noPreview}>
              {item.state === 'fail' ? t.history.not_generated : t.loading[`tip_${tipIndex}`]}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {renderStatusBadge()}
            <span className={styles.date}>{formattedDate}</span>
          </div>
          <div className={styles.footerRight}>
            <Button className={styles.recreateButton} onClick={() => onImport(item)}>
              {t.history.recreate}
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
            <div className={styles.inputList}>
              {displayInputs.map(([key, value]) => (
                <div className={styles.inputRow} key={key}>
                  <span className={styles.inputKey}>{inputFields.find((field) => field.key === key)?.label}: </span>
                  <span className={styles.inputValue}>{value}</span>
                </div>
              ))}
            </div>
            <div className={styles.chipList}>
              <div className={styles.chip}>
                <LayoutOutlined className={styles.chipIcon} />
                <span>{getSizePixels({ aspectRatio: item.aspect_ratio, size: item.size })}</span>
              </div>

              {isLaserFriendly && (
                <div className={styles.chip}>
                  <SafetyCertificateOutlined className={styles.chipIcon} />
                  <span>{t.form.laser_friendly}</span>
                </div>
              )}
            </div>
          </div>
        ))}
    </Card>
  );
};

const HistoryCard = memo(UnmemorizedHistoryCard);

export default HistoryCard;
