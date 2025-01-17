import classNames from 'classnames';
import Icon from '@ant-design/icons';
import React from 'react';
import { ConfigProvider, InputNumber, Modal, Slider } from 'antd';

import ActionPanelIcons from 'app/icons/action-panel/ActionPanelIcons';
import i18n from 'helpers/i18n';
import Select from 'app/widgets/AntdSelect';
import storage from 'implementations/storage';
import units from 'helpers/units';

import styles from './OffsetModal.module.scss';

const LANG = i18n.lang.beambox.tool_panels;
const unitSettings: {
  [key: string]: {
    precision: number;
    distance: { default: number; min: number; max: number; step?: number };
  };
} = {
  mm: {
    precision: 2,
    distance: { default: 5, min: 1, max: 20 },
  },
  inch: {
    precision: 2,
    distance: { default: 0.2, min: 0, max: 1, step: 0.1 },
  },
};
interface Value {
  dir: number;
  distance: number;
  cornerType: 'sharp' | 'round';
}
interface Props {
  onCancel: () => void;
  onOk: (data: Value) => void;
}

const OffsetModal = ({ onCancel, onOk }: Props): JSX.Element => {
  const unit = React.useMemo(() => (storage.get('default-units') === 'inches' ? 'inch' : 'mm'), []);
  const setting = unitSettings[unit];
  const [data, setData] = React.useState<Value>({
    dir: 1,
    distance: setting.distance.default,
    cornerType: 'sharp',
  });
  return (
    <ConfigProvider
      theme={{
        components: {
          Button: { borderRadius: 100 },
          Select: { borderRadius: 100 },
          InputNumber: { borderRadius: 100 },
        },
      }}
    >
      <Modal
        className={styles.modal}
        closeIcon={<Icon className={styles['close-icon']} component={ActionPanelIcons.Delete} />}
        okText={LANG.confirm}
        cancelText={LANG.cancel}
        onOk={() => {
          const distanceInMM = +units.convertUnit(data.distance, 'mm', unit).toFixed(2);
          onOk({ ...data, distance: distanceInMM });
        }}
        onCancel={onCancel}
        centered
        open
      >
        <div className={styles.title}>{LANG.offset}</div>
        {/* TODO: add preview */}
        <div className={styles.field}>
          <span className={styles.label}>{LANG._offset.direction}</span>
          <Select
            className={styles.select}
            value={data.dir}
            onChange={(val) => setData({ ...data, dir: val })}
            options={[
              { value: 1, label: LANG._offset.outward },
              { value: 0, label: LANG._offset.inward },
            ]}
            dropdownMatchSelectWidth={false}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG._offset.corner_type}</span>
          <Select
            className={styles.select}
            value={data.cornerType}
            onChange={(val) => setData({ ...data, cornerType: val })}
            options={[
              { value: 'sharp', label: LANG._offset.sharp },
              { value: 'round', label: LANG._offset.round },
            ]}
            dropdownMatchSelectWidth={false}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG._offset.dist}</span>
          <InputNumber
            className={classNames(styles.input, styles['with-unit'])}
            type="number"
            min={0}
            value={data.distance}
            precision={setting.precision}
            onChange={(val) => setData({ ...data, distance: val })}
            prefix={<span className={styles.unit}>{unit}</span>}
            controls={false}
          />
          <Slider
            className={styles.slider}
            min={setting.distance.min}
            max={setting.distance.max}
            step={setting.distance.step}
            value={data.distance}
            onChange={(val) => setData({ ...data, distance: val })}
          />
        </div>
      </Modal>
    </ConfigProvider>
  );
};
export default OffsetModal;
