import React, { useState } from 'react';

import Icon from '@ant-design/icons';
import { ConfigProvider, InputNumber, Modal, Slider } from 'antd';
import classNames from 'classnames';

import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import { useStorageStore } from '@core/app/stores/storageStore';
import Select from '@core/app/widgets/AntdSelect';
import i18n from '@core/helpers/i18n';
import units from '@core/helpers/units';

import styles from './OffsetModal.module.scss';
import type { OffsetProp } from './OffsetPanel';

const LANG = i18n.lang.beambox.tool_panels;

type Distance = { default: number; max: number; min: number; step?: number };

const unitSettings: Record<'inch' | 'mm', { distance: Distance; preciseDistance: Distance; precision: number }> = {
  inch: {
    distance: { default: 0.2, max: 1, min: 0, step: 0.1 },
    preciseDistance: { default: 0.002, max: 0.04, min: 0, step: 0.01 },
    precision: 2,
  },
  mm: {
    distance: { default: 5, max: 20, min: 1 },
    preciseDistance: { default: 0.05, max: 1, min: 0.01, step: 0.01 },
    precision: 2,
  },
};

interface Props {
  onCancel: () => void;
  onOk: (offset: OffsetProp) => void;
}

const OffsetModal = ({ onCancel, onOk }: Props): React.JSX.Element => {
  const unit = useStorageStore((state) => (state['default-units'] === 'inches' ? 'inch' : 'mm'));
  const setting = unitSettings[unit];
  const [offset, setOffset] = useState<OffsetProp>({
    cornerType: 'sharp',
    distance: setting.distance.default,
    mode: 'outward',
  });

  const getDistance = (mode: OffsetProp['mode']) => {
    if (['expand', 'shrink'].includes(mode)) {
      return setting.preciseDistance;
    }

    return setting.distance;
  };

  const distance = getDistance(offset.mode);

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: { borderRadius: 100 },
          InputNumber: { borderRadius: 100 },
          Select: { borderRadius: 100 },
        },
      }}
    >
      <Modal
        cancelText={LANG.cancel}
        centered
        className={styles.modal}
        closeIcon={<Icon className={styles['close-icon']} component={ActionPanelIcons.Delete} />}
        okText={LANG.confirm}
        onCancel={onCancel}
        onOk={() => {
          const distanceInMM = +units.convertUnit(offset.distance, 'mm', unit).toFixed(2);

          onOk({ ...offset, distance: distanceInMM });
        }}
        open
      >
        <div className={styles.title}>{LANG.offset}</div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG._offset.direction}</span>
          <Select
            className={styles.select}
            onChange={(mode) => {
              setOffset({ ...offset, distance: getDistance(mode).default, mode });
            }}
            options={[
              { label: LANG._offset.outward, value: 'outward' },
              { label: LANG._offset.inward, value: 'inward' },
              // { label: LANG._offset.expand, value: 'expand' },
              // { label: LANG._offset.shrink, value: 'shrink' },
            ]}
            popupMatchSelectWidth={false}
            value={offset.mode}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG._offset.corner_type}</span>
          <Select
            className={styles.select}
            onChange={(val) => setOffset({ ...offset, cornerType: val })}
            options={[
              { label: LANG._offset.sharp, value: 'sharp' },
              { label: LANG._offset.round, value: 'round' },
            ]}
            popupMatchSelectWidth={false}
            value={offset.cornerType}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG._offset.dist}</span>
          <InputNumber
            className={classNames(styles.input, styles['with-unit'])}
            controls={false}
            min={0}
            onChange={(distance) => setOffset({ ...offset, distance: distance! })}
            precision={setting.precision}
            prefix={<span className={styles.unit}>{unit}</span>}
            type="number"
            value={offset.distance}
          />
          <Slider
            className={styles.slider}
            max={distance.max}
            min={distance.min}
            onChange={(distance) => setOffset({ ...offset, distance })}
            step={distance.step}
            value={offset.distance}
          />
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default OffsetModal;
