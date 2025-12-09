import React, { useMemo, useState } from 'react';

import Icon from '@ant-design/icons';
import { InputNumber } from 'antd';

import constant from '@core/app/actions/beambox/constant';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useStorageStore } from '@core/app/stores/storageStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import { generateSelectedElementArray } from '@core/app/svgedit/operations/clipboard';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { useIsMobile } from '@core/helpers/system-helper';
import units from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';

import styles from './ArrayModal.module.scss';

interface Value {
  column: number;
  dx: number;
  dy: number;
  row: number;
}
interface Props {
  onClose: () => void;
}

const ArrayModal = ({ onClose }: Props): React.JSX.Element => {
  const lang = useI18n().beambox.tool_panels;
  const unit = useStorageStore((state) => (state.isInch ? 'inch' : 'mm'));
  const { distanceDefault, distanceStep, precision } = useMemo(
    () =>
      ({
        inch: { distanceDefault: 1, distanceStep: 0.1, precision: 2 },
        mm: { distanceDefault: 20, distanceStep: 1, precision: 2 },
      })[unit],
    [unit],
  );
  const isMobile = useIsMobile();

  const [data, setData] = useState<Value>({ column: 3, dx: distanceDefault, dy: distanceDefault, row: 3 });
  const { column, dx, dy, row } = data;
  const setRow = (val: null | number) => setData({ ...data, row: val || 1 });
  const setColumn = (val: null | number) => setData({ ...data, column: val || 1 });
  const setDx = (val: null | number) => setData({ ...data, dx: val || 0 });
  const setDy = (val: null | number) => setData({ ...data, dy: val || 0 });

  const onOk = async () => {
    try {
      const dx = +units.convertUnit(data.dx, 'mm', unit).toFixed(2);
      const dy = +units.convertUnit(data.dy, 'mm', unit).toFixed(2);
      const { column, row } = data;
      const { dpmm } = constant;

      await generateSelectedElementArray({ dx: dx * dpmm, dy: dy * dpmm }, { column, row });
      currentFileManager.setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Array creation failed', error);
    } finally {
      onClose();
      setMouseMode('select');
    }
  };

  return (
    <DraggableModal
      cancelText={lang.cancel}
      className={styles.modal}
      closeIcon={<Icon className={styles['close-icon']} component={ActionPanelIcons.Delete} />}
      defaultPosition={isMobile ? undefined : { x: 60, y: -60 }}
      mask={false}
      maskClosable={false}
      okText={lang.confirm}
      onCancel={onClose}
      onOk={onOk}
      open
      title={lang.grid_array}
      width={280}
      xRef={isMobile ? 'center' : 'left'}
      yRef={isMobile ? 'center' : 'bottom'}
    >
      <div className={styles['section-header']}>
        <span className={styles['section-title']}>{lang.array_dimension}</span>
        <div className={styles.line} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>{lang.columns}</span>
        <InputNumber className={styles.input} min={1} onChange={setColumn} precision={0} type="number" value={column} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>{lang.rows}</span>
        <InputNumber className={styles.input} min={1} onChange={setRow} precision={0} type="number" value={row} />
      </div>
      <div className={styles['section-header']}>
        <span className={styles['section-title']}>{lang.array_interval}</span>
        <div className={styles.line} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>X</span>
        <InputNumber
          addonAfter={unit}
          className={styles.input}
          min={0}
          onChange={setDx}
          precision={precision}
          step={distanceStep}
          type="number"
          value={dx}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Y</span>
        <InputNumber
          addonAfter={unit}
          className={styles.input}
          min={0}
          onChange={setDy}
          precision={precision}
          step={distanceStep}
          type="number"
          value={dy}
        />
      </div>
    </DraggableModal>
  );
};

export const showArrayModal = (): void => {
  const id = 'array-modal';

  if (isIdExist(id)) return;

  addDialogComponent(id, <ArrayModal onClose={() => popDialogById(id)} />);
};

export default ArrayModal;
