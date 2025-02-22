import React from 'react';

import Icon from '@ant-design/icons';
import { ConfigProvider, InputNumber, Modal, Slider } from 'antd';
import classNames from 'classnames';

import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import Select from '@core/app/widgets/AntdSelect';
import i18n from '@core/helpers/i18n';
import units from '@core/helpers/units';
import storage from '@core/implementations/storage';

import styles from './OffsetModal.module.scss';

const LANG = i18n.lang.beambox.tool_panels;
const unitSettings: {
  [key: string]: {
    distance: { default: number; max: number; min: number; step?: number };
    precision: number;
  };
} = {
  inch: {
    distance: { default: 0.2, max: 1, min: 0, step: 0.1 },
    precision: 2,
  },
  mm: {
    distance: { default: 5, max: 20, min: 1 },
    precision: 2,
  },
};

interface Value {
  cornerType: 'round' | 'sharp';
  dir: number;
  distance: number;
}
interface Props {
  onCancel: () => void;
  onOk: (data: Value) => void;
}

const OffsetModal = ({ onCancel, onOk }: Props): React.JSX.Element => {
  const unit = React.useMemo(() => (storage.get('default-units') === 'inches' ? 'inch' : 'mm'), []);
  const setting = unitSettings[unit];
  const [data, setData] = React.useState<Value>({
    cornerType: 'sharp',
    dir: 1,
    distance: setting.distance.default,
  });

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
          const distanceInMM = +units.convertUnit(data.distance, 'mm', unit).toFixed(2);

          onOk({ ...data, distance: distanceInMM });
        }}
        open
      >
        <div className={styles.title}>{LANG.offset}</div>
        {/* TODO: add preview */}
        <div className={styles.field}>
          <span className={styles.label}>{LANG._offset.direction}</span>
          <Select
            className={styles.select}
            dropdownMatchSelectWidth={false}
            onChange={(val) => setData({ ...data, dir: val })}
            options={[
              { label: LANG._offset.outward, value: 1 },
              { label: LANG._offset.inward, value: 0 },
            ]}
            value={data.dir}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG._offset.corner_type}</span>
          <Select
            className={styles.select}
            dropdownMatchSelectWidth={false}
            onChange={(val) => setData({ ...data, cornerType: val })}
            options={[
              { label: LANG._offset.sharp, value: 'sharp' },
              { label: LANG._offset.round, value: 'round' },
            ]}
            value={data.cornerType}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG._offset.dist}</span>
          <InputNumber
            className={classNames(styles.input, styles['with-unit'])}
            controls={false}
            min={0}
            onChange={(val) => setData({ ...data, distance: val })}
            precision={setting.precision}
            prefix={<span className={styles.unit}>{unit}</span>}
            type="number"
            value={data.distance}
          />
          <Slider
            className={styles.slider}
            max={setting.distance.max}
            min={setting.distance.min}
            onChange={(val) => setData({ ...data, distance: val })}
            step={setting.distance.step}
            value={data.distance}
          />
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default OffsetModal;
