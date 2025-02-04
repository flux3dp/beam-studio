import React from 'react';

import Icon from '@ant-design/icons';
import { ConfigProvider, InputNumber, Modal, Slider } from 'antd';
import classNames from 'classnames';

import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import i18n from '@core/helpers/i18n';
import units from '@core/helpers/units';
import storage from '@core/implementations/storage';

import styles from './ArrayModal.module.scss';

const LANG = i18n.lang.beambox.tool_panels;
const unitSettings: {
  [key: string]: {
    distance: { default: number; max: number; min: number; step?: number };
    precision: number;
  };
} = {
  inch: {
    distance: { default: 1, max: 2, min: 0, step: 0.1 },
    precision: 2,
  },
  mm: {
    distance: { default: 20, max: 50, min: 1 },
    precision: 2,
  },
};

interface Value {
  column: number;
  dx: number;
  dy: number;
  row: number;
}
interface Props {
  onCancel: () => void;
  onOk: (data: Value) => void;
}

const ArrayModal = ({ onCancel, onOk }: Props): React.JSX.Element => {
  const unit = React.useMemo(() => (storage.get('default-units') === 'inches' ? 'inch' : 'mm'), []);
  const setting = unitSettings[unit];
  const [data, setData] = React.useState<Value>({
    column: 3,
    dx: setting.distance.default,
    dy: setting.distance.default,
    row: 3,
  });
  const { column, dx, dy, row } = data;
  const setRow = (val: any) => setData({ ...data, row: val });
  const setColumn = (val: any) => setData({ ...data, column: val });
  const setDx = (val: any) => setData({ ...data, dx: val });
  const setDy = (val: any) => setData({ ...data, dy: val });

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
        cancelText={LANG.cancel}
        centered
        className={styles.modal}
        closeIcon={<Icon className={styles['close-icon']} component={ActionPanelIcons.Delete} />}
        okText={LANG.confirm}
        onCancel={onCancel}
        onOk={() => {
          const dxInMM = +units.convertUnit(data.dx, 'mm', unit).toFixed(2);
          const dyInMM = +units.convertUnit(data.dy, 'mm', unit).toFixed(2);

          onOk({ ...data, dx: dxInMM, dy: dyInMM });
        }}
        open
      >
        <div className={styles.title}>{LANG.grid_array}</div>
        {/* TODO: add preview */}
        <div className={styles.subtitle}>{LANG.array_dimension}</div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.columns}</span>
          <Slider className={styles.slider} max={10} min={1} onChange={setColumn} value={column} />
          <InputNumber
            className={styles.input}
            controls={false}
            min={1}
            onChange={setColumn}
            precision={0}
            size="small"
            type="number"
            value={column}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.rows}</span>
          <Slider className={styles.slider} max={10} min={1} onChange={setRow} value={row} />
          <InputNumber
            className={styles.input}
            controls={false}
            min={1}
            onChange={setRow}
            precision={0}
            size="small"
            type="number"
            value={row}
          />
        </div>
        <div className={styles.subtitle}>{LANG.array_interval}</div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.dx}</span>
          <Slider
            className={styles.slider}
            max={setting.distance.max}
            min={setting.distance.min}
            onChange={setDx}
            step={setting.distance.step}
            value={dx}
          />
          <InputNumber
            className={classNames(styles.input, styles['with-unit'])}
            controls={false}
            min={0}
            onChange={setDx}
            precision={setting.precision}
            prefix={<span className={styles.unit}>{unit}</span>}
            size="small"
            type="number"
            value={dx}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.dy}</span>
          <Slider
            className={styles.slider}
            max={setting.distance.max}
            min={setting.distance.min}
            onChange={setDy}
            step={setting.distance.step}
            value={dy}
          />
          <InputNumber
            className={classNames(styles.input, styles['with-unit'])}
            controls={false}
            min={0}
            onChange={setDy}
            precision={setting.precision}
            prefix={<span className={styles.unit}>{unit}</span>}
            size="small"
            type="number"
            value={dy}
          />
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default ArrayModal;
