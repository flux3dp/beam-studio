import classNames from 'classnames';
import React from 'react';
import Icon from '@ant-design/icons';
import { ConfigProvider, InputNumber, Modal, Slider } from 'antd';

import ActionPanelIcons from 'app/icons/action-panel/ActionPanelIcons';
import i18n from 'helpers/i18n';
import storage from 'implementations/storage';
import units from 'helpers/units';

import styles from './ArrayModal.module.scss';

const LANG = i18n.lang.beambox.tool_panels;
const unitSettings: {
  [key: string]: {
    precision: number;
    distance: { default: number; min: number; max: number; step?: number };
  };
} = {
  mm: {
    precision: 2,
    distance: { default: 20, min: 1, max: 50 },
  },
  inch: {
    precision: 2,
    distance: { default: 1, min: 0, max: 2, step: 0.1 },
  },
};

interface Value {
  row: number;
  column: number;
  dx: number;
  dy: number;
}
interface Props {
  onCancel: () => void;
  onOk: (data: Value) => void;
}

const ArrayModal = ({ onCancel, onOk }: Props): JSX.Element => {
  const unit = React.useMemo(() => (storage.get('default-units') === 'inches' ? 'inch' : 'mm'), []);
  const setting = unitSettings[unit];
  const [data, setData] = React.useState<Value>({
    row: 3,
    column: 3,
    dx: setting.distance.default,
    dy: setting.distance.default,
  });
  const { row, column, dx, dy } = data;
  const setRow = (val) => setData({ ...data, row: val });
  const setColumn = (val) => setData({ ...data, column: val });
  const setDx = (val) => setData({ ...data, dx: val });
  const setDy = (val) => setData({ ...data, dy: val });
  return (
    <ConfigProvider
      theme={{
        components: {
          Button: { borderRadius: 100 },
          InputNumber: { borderRadiusSM: 100 },
        },
      }}
    >
      <Modal
        className={styles.modal}
        closeIcon={<Icon className={styles['close-icon']} component={ActionPanelIcons.Delete} />}
        okText={LANG.confirm}
        cancelText={LANG.cancel}
        onOk={() => {
          const dxInMM = +units.convertUnit(data.dx, 'mm', unit).toFixed(2);
          const dyInMM = +units.convertUnit(data.dy, 'mm', unit).toFixed(2);
          onOk({ ...data, dx: dxInMM, dy: dyInMM });
        }}
        onCancel={onCancel}
        centered
        open
      >
        <div className={styles.title}>{LANG.grid_array}</div>
        {/* TODO: add preview */}
        <div className={styles.subtitle}>{LANG.array_dimension}</div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.columns}</span>
          <Slider className={styles.slider} min={1} max={10} value={column} onChange={setColumn} />
          <InputNumber
            className={styles.input}
            type="number"
            size="small"
            min={1}
            precision={0}
            value={column}
            onChange={setColumn}
            controls={false}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.rows}</span>
          <Slider className={styles.slider} min={1} max={10} value={row} onChange={setRow} />
          <InputNumber
            className={styles.input}
            type="number"
            size="small"
            min={1}
            precision={0}
            value={row}
            onChange={setRow}
            controls={false}
          />
        </div>
        <div className={styles.subtitle}>{LANG.array_interval}</div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.dx}</span>
          <Slider
            className={styles.slider}
            min={setting.distance.min}
            max={setting.distance.max}
            step={setting.distance.step}
            value={dx}
            onChange={setDx}
          />
          <InputNumber
            className={classNames(styles.input, styles['with-unit'])}
            type="number"
            size="small"
            min={0}
            precision={setting.precision}
            value={dx}
            onChange={setDx}
            prefix={<span className={styles.unit}>{unit}</span>}
            controls={false}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.dy}</span>
          <Slider
            className={styles.slider}
            min={setting.distance.min}
            max={setting.distance.max}
            step={setting.distance.step}
            value={dy}
            onChange={setDy}
          />
          <InputNumber
            className={classNames(styles.input, styles['with-unit'])}
            type="number"
            size="small"
            min={0}
            precision={setting.precision}
            value={dy}
            onChange={setDy}
            prefix={<span className={styles.unit}>{unit}</span>}
            controls={false}
          />
        </div>
      </Modal>
    </ConfigProvider>
  );
};
export default ArrayModal;
