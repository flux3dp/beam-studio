import React, { memo, useCallback, useMemo, useState } from 'react';

import { DownOutlined, LayoutOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Badge, Button, Card, ConfigProvider } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { match } from 'ts-pattern';

import { importAiImage } from '@core/app/svgedit/operations/import/importAiImage';
import type { AiImageGenerationData } from '@core/helpers/api/ai-image';
import { isMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import { LASER_FRIENDLY_VALUE } from '../constants';
import { useAiConfigQuery } from '../hooks/useAiConfigQuery';
import { useTipIndex } from '../hooks/useTipIndex';
import { getStyleConfig } from '../utils/categories';
import { getSizePixels } from '../utils/dimensions';

import styles from './HistoryCard.module.scss';
import ImageCard from './ImageCard';

interface HistoryCardProps {
  item: AiImageGenerationData;
  onImport: (item: AiImageGenerationData) => void;
}

const HistoryCard = memo(({ item, onImport }: HistoryCardProps) => {
  const lang = useI18n();
  const t = lang.beambox.ai_generate;
  const [isExpanded, setIsExpanded] = useState(false);
  const [importingUrl, setImportingUrl] = useState<null | string>(null);
  const {
    data: { styles: aiStyles },
  } = useAiConfigQuery();
  const tipIndex = useTipIndex(dayjs(item.created_at).valueOf());
  const formattedDate = useMemo(() => dayjs(item.created_at).format('YYYY/MM/DD HH:mm'), [item.created_at]);
  const style = useMemo(() => getStyleConfig(item.prompt_data['style'], aiStyles), [item.prompt_data, aiStyles]);
  const isLaserFriendly = item.prompt_data.inputs?.color === LASER_FRIENDLY_VALUE;
  const onMobile = useMemo(() => isMobile(), []);
  const displayInputs = useMemo(
    () =>
      Object.entries(item.prompt_data.inputs || {}).filter(
        ([key, value]) =>
          value.trim() !== '' && key !== 'image_counts' && !(key === 'color' && value === LASER_FRIENDLY_VALUE),
      ),
    [item.prompt_data.inputs],
  );

  const handleImportImage = useCallback(async (url: string) => {
    setImportingUrl(url);

    try {
      await importAiImage(url);
    } finally {
      setImportingUrl(null);
    }
  }, []);

  const statusBadge = match(item.state)
    .with('success', () => (
      <Badge className={classNames(styles.badge, styles.success)} status="success" text={t.history.status_success} />
    ))
    .with('fail', () => (
      <Badge className={classNames(styles.badge, styles.fail)} status="error" text={t.history.status_failed} />
    ))
    .otherwise(() => <Badge className={styles.badge} status="processing" text={t.history.status_generating} />);

  const LayoutWrapper = onMobile ? ConfigProvider : React.Fragment;
  const layoutProps = onMobile ? { theme: { components: { Button: { borderRadius: 10, borderRadiusLG: 10 } } } } : {};

  return (
    <Card bordered={false} className={styles.card} styles={{ body: { padding: 0 } }}>
      <div className={styles.content}>
        <div className={styles.header} title={item.prompt_data['style']}>
          {style.displayName || t.style.customize}
        </div>

        <div className={styles.grid}>
          {item.result_urls?.length ? (
            item.result_urls.map((url) => (
              <ImageCard
                aspectRatio="4:3"
                isImporting={importingUrl === url}
                key={url}
                onImport={handleImportImage}
                size="small"
                url={url}
              />
            ))
          ) : (
            <div className={styles.placeholder}>
              {item.state === 'fail' ? t.history.not_generated : t.loading[`tip_${tipIndex}`]}
            </div>
          )}
        </div>

        <LayoutWrapper {...layoutProps}>
          <div className={classNames(styles.footer, { [styles.mobile]: onMobile })}>
            <div className={styles.info}>
              {statusBadge}
              <span className={styles.date}>{formattedDate}</span>
            </div>
            <div className={styles.actions}>
              <Button block={onMobile} className={styles.btnRecreate} onClick={() => onImport(item)}>
                {t.history.recreate}
              </Button>
              <Button
                block={onMobile}
                className={classNames(styles.btnDetail, { [styles.expanded]: isExpanded })}
                icon={!onMobile && <DownOutlined />}
                onClick={() => setIsExpanded(!isExpanded)}
                size={onMobile ? 'middle' : 'small'}
                type={onMobile ? 'default' : 'text'}
              >
                {onMobile ? (
                  <>
                    <DownOutlined className={styles.iconMobile} />
                    {t.history.detail}
                  </>
                ) : null}
              </Button>
            </div>
          </div>
        </LayoutWrapper>
      </div>

      {isExpanded && (
        <div className={styles.details}>
          {item.state === 'fail' ? (
            <div className={styles.error} title={item.fail_msg || ''}>
              Error: {item.fail_msg}
            </div>
          ) : (
            <>
              <div className={styles.inputs}>
                {displayInputs.map(([key, value]) => (
                  <div className={styles.row} key={key}>
                    <strong>{style.inputFields?.find((f) => f.key === key)?.label || key}: </strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
              <div className={styles.chips}>
                <div className={styles.chip}>
                  <LayoutOutlined />
                  {getSizePixels({ aspectRatio: item.aspect_ratio, size: item.size })}
                </div>
                {isLaserFriendly && (
                  <div className={styles.chip}>
                    <SafetyCertificateOutlined />
                    {t.form.laser_friendly}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
});

export default HistoryCard;
