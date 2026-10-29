import React from 'react';

import { CloudDownloadOutlined, CloudOutlined, CloudSyncOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Segmented, Tag, Tooltip, Typography } from 'antd';
import classNames from 'classnames';
import { sprintf } from 'sprintf-js';

import { getPromarkWorkareaOptions, LaserType } from '@core/app/constants/promark-constants';
import Select from '@core/app/widgets/AntdSelect';
import { normalizeLensProfileKey } from '@core/helpers/device/promark/lens-profiles';
import useI18n from '@core/helpers/useI18n';
import type { LensProfileKey, PromarkInfo } from '@core/interfaces/Promark';

import styles from './Block.module.scss';
import type { LensProfileStatus } from './useLensProfiles';
import { describeLensProfileKey } from './useLensProfiles';

interface LensProfileBlockProps {
  canUseCloud: boolean;
  info: PromarkInfo;
  /** other lenses whose edits are out of range */
  invalidProfiles: LensProfileKey[];
  isDefault: boolean;
  isSynced: boolean;
  onChange: (key: LensProfileKey) => void;
  onSetDefault: () => void;
  onUseCloud: () => void;
  status: LensProfileStatus;
  value: LensProfileKey;
}

/** Picks which field lens the parameters below belong to, and shows its saved, default and cloud state. */
const LensProfileBlock = ({
  canUseCloud,
  info,
  invalidProfiles,
  isDefault,
  isSynced,
  onChange,
  onSetDefault,
  onUseCloud,
  status,
  value,
}: LensProfileBlockProps): React.JSX.Element => {
  const {
    beambox: { document_panel: tDocu },
    promark_settings: t,
  } = useI18n();
  const { laserType, watt } = info;
  const innerEngravingAvailable = normalizeLensProfileKey(laserType, { ...value, innerEngraving: true }).innerEngraving;
  const handleChange = (key: LensProfileKey) => onChange(normalizeLensProfileKey(laserType, key));
  const otherInvalid = invalidProfiles.filter(
    (key) => key.workarea !== value.workarea || key.innerEngraving !== value.innerEngraving,
  );

  const renderStatus = () => {
    if (status.state === 'edited') return <Tag color="processing">{t.lens_edited}</Tag>;

    if (status.state === 'unset') return <Tag>{t.lens_unset}</Tag>;

    return (
      <Flex align="center" gap={4}>
        <Tag color="success">{t.lens_saved}</Tag>
        {status.inherited && (
          <span className={styles.hint}>
            {status.inherited === 'default' ? t.lens_inherit_default : t.lens_inherit_legacy}
          </span>
        )}
      </Flex>
    );
  };

  return (
    <Flex className={classNames(styles.block, styles['full-row'])} gap={8} vertical>
      <div className={styles.title}>
        <Flex align="center" gap={4}>
          {t.lens}
          <Tooltip title={t.lens_hint}>
            <QuestionCircleOutlined className={styles.tooltip} />
          </Tooltip>
        </Flex>
      </div>
      <Flex align="center" className={styles.row} gap={16} wrap>
        <Flex align="center" gap={8}>
          <span className={styles.label}>{tDocu.laser_source}</span>
          <span data-testid="lens-laser-source">{`${LaserType[laserType]} - ${watt}W`}</span>
        </Flex>
        <Flex align="center" gap={8}>
          <span className={styles.label}>{tDocu.workarea}</span>
          <Select
            data-testid="lens-workarea"
            onChange={(workarea: number) => handleChange({ ...value, workarea })}
            options={getPromarkWorkareaOptions(laserType).map((workarea) => ({
              label: `${workarea} mm`,
              value: workarea,
            }))}
            size="small"
            value={value.workarea}
          />
        </Flex>
        {laserType === LaserType.UV && (
          <Flex align="center" gap={8}>
            <span className={styles.label}>{t.engraving_mode}</span>
            <Segmented
              onChange={(mode) => handleChange({ ...value, innerEngraving: mode === 'inner' })}
              options={[
                { label: t.flat, value: 'flat' },
                { disabled: !innerEngravingAvailable, label: t.inner_engraving, value: 'inner' },
              ]}
              size="small"
              value={value.innerEngraving ? 'inner' : 'flat'}
            />
          </Flex>
        )}
      </Flex>
      <Flex align="center" gap={8} wrap>
        {renderStatus()}
        {isDefault ? (
          <Tooltip title={t.lens_default_hint}>
            <Tag color="gold">{t.lens_default}</Tag>
          </Tooltip>
        ) : (
          <Button data-testid="set-default-lens" onClick={onSetDefault} size="small">
            {t.set_as_default}
          </Button>
        )}
        {isSynced ? (
          <Tag color="success" icon={<CloudOutlined />}>
            {t.lens_synced}
          </Tag>
        ) : (
          <Tag icon={<CloudSyncOutlined />}>{t.lens_not_synced}</Tag>
        )}
        {canUseCloud && (
          <Button
            data-testid="use-cloud-lens"
            icon={<CloudDownloadOutlined />}
            iconPosition="end"
            onClick={onUseCloud}
            size="small"
          >
            {t.use_cloud_parameters}
          </Button>
        )}
      </Flex>
      {otherInvalid.length > 0 && (
        <Typography.Text className={styles.error} type="danger">
          {sprintf(
            t.lens_profile_errors,
            otherInvalid.map((key) => describeLensProfileKey(key, laserType, t)).join('、'),
          )}
        </Typography.Text>
      )}
    </Flex>
  );
};

export default LensProfileBlock;
