import React, { memo, useEffect, useMemo, useState } from 'react';

import { DownOutlined, LayoutOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Badge, Button, Card } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { match } from 'ts-pattern';

import type { AiImageGenerationData } from '@core/helpers/api/ai-image';
import useI18n from '@core/helpers/useI18n';

import { useAiConfigQuery } from '../hooks/useAiConfigQuery';
import { laserFriendlyValue } from '../types';
import { getStyleConfig } from '../utils/categories';
import { getSizePixels } from '../utils/dimensions';

import style from './HistoryCard.module.scss';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const previewImages = item.result_urls;
  const formattedDate = useMemo(() => dayjs(item.created_at).format('YYYY/MM/DD HH:mm'), [item.created_at]);
  const { data: aiConfig } = useAiConfigQuery();
  const isLaserFriendly = useMemo(
    () => item.prompt_data.inputs?.color === laserFriendlyValue,
    [item.prompt_data.inputs],
  );
  const displayInputs = useMemo(() => filterInputs(item.prompt_data.inputs), [item.prompt_data.inputs]);
  const { inputFields } = getStyleConfig(item.prompt_data['style'], aiConfig?.styles);
  const [tipIndex, setTipIndex] = useState<0 | 1 | 2 | 3 | 4>(0);

  const renderStatusBadge = () =>
    match(item.state)
      .with('success', () => (
        <Badge className={classNames(style.statusBadge, style.success)} status="success" text="Success" />
      ))
      .with('fail', () => <Badge className={classNames(style.statusBadge, style.fail)} status="error" text="Failed" />)
      .otherwise(() => <Badge className={style.statusBadge} status="processing" text="Generating" />);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - dayjs(item.created_at).valueOf();

      // update tip index based on elapsed time
      // 0-15s: tip_0
      // 15-30s: tip_1
      // 30-60s: tip_2
      // 60-90s: tip_3
      // >90s: tip_4
      if (elapsed > 90000) {
        setTipIndex(4);
      } else if (elapsed > 60000) {
        setTipIndex(3);
      } else if (elapsed > 30000) {
        setTipIndex(2);
      } else if (elapsed > 15000) {
        setTipIndex(1);
      }
    }, 1000);

    return () => clearInterval(interval);
  });

  return (
    <Card bordered={false} className={style.card} styles={{ body: { padding: 0 } }}>
      <div className={style.cardContent}>
        <div className={style.title} title={item.prompt_data['style']}>
          {getStyleConfig(item.prompt_data['style'], aiConfig?.styles).displayName || 'Customize'}
        </div>

        <div className={style.imageGrid}>
          {previewImages?.length ? (
            previewImages.map((url, index) => (
              <div className={style.imageWrapper} key={index}>
                <img alt={`Generated ${index + 1}`} className={style.image} src={url} />
              </div>
            ))
          ) : (
            <div className={style.noPreview}>
              {item.state === 'fail' ? '❌ Not generated' : lang.beambox.ai_generate.loading[`tip_${tipIndex}`]}
            </div>
          )}
        </div>

        <div className={style.footer}>
          <div className={style.footerLeft}>
            {renderStatusBadge()}
            <span className={style.date}>{formattedDate}</span>
          </div>
          <div className={style.footerRight}>
            <Button className={style.recreateButton} onClick={() => onImport(item)}>
              Recreate
            </Button>
            <Button
              className={classNames(style.dropdownButton, { [style.expanded]: isExpanded })}
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
          <div className={style.error} title={item.fail_msg || 'Unknown error'}>
            Error: {item.fail_msg}
          </div>
        ) : (
          <div className={style.expandedInfo}>
            <div className={style.inputList}>
              {displayInputs.map(([key, value]) => (
                <div className={style.inputRow} key={key}>
                  <span className={style.inputKey}>{inputFields.find((field) => field.key === key)?.label}: </span>
                  <span className={style.inputValue}>{value}</span>
                </div>
              ))}
            </div>
            <div className={style.chipList}>
              <div className={style.chip}>
                <LayoutOutlined className={style.chipIcon} />
                <span>{getSizePixels({ aspectRatio: item.aspect_ratio, size: item.size })}</span>
              </div>

              {isLaserFriendly && (
                <div className={style.chip}>
                  <SafetyCertificateOutlined className={style.chipIcon} />
                  <span>Laser-Friendly</span>
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
