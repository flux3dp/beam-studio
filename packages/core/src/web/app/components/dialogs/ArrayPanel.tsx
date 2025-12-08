import React, { useEffect, useRef, useState } from 'react';

import Icon from '@ant-design/icons';
import { Button, ConfigProvider, InputNumber, Modal } from 'antd';
import classNames from 'classnames';
import Draggable from 'react-draggable';

import constant from '@core/app/actions/beambox/constant';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useStorageStore } from '@core/app/stores/storageStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import { generateSelectedElementArray } from '@core/app/svgedit/operations/clipboard';
import styles from '@core/app/views/beambox/ToolPanels/ArrayModal.module.scss';
import units from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';

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

export interface Value {
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
  const lang = useI18n().beambox.tool_panels;
  const unit = useStorageStore((state: any) => (state?.isInch ? 'inch' : 'mm')) as 'inch' | 'mm';
  const setting = unitSettings[unit];

  const draggleRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 600);

  const [data, setData] = useState<Value>({
    column: 3,
    dx: 50,
    dy: 50,
    row: 3,
  });
  const { column, dx, dy, row } = data;

  const setRow = (val: null | number) => setData({ ...data, row: val || 1 });
  const setColumn = (val: null | number) => setData({ ...data, column: val || 1 });
  const setDx = (val: null | number) => setData({ ...data, dx: val || 0 });
  const setDy = (val: null | number) => setData({ ...data, dy: val || 0 });

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 600);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleConfirm = () => {
    const dxInMM = +units.convertUnit(data.dx, 'mm', unit).toFixed(2);
    const dyInMM = +units.convertUnit(data.dy, 'mm', unit).toFixed(2);

    onOk({ ...data, dx: dxInMM, dy: dyInMM });
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: { borderRadius: 6 },
          InputNumber: {
            borderRadius: 6,
            colorFillAlter: '#f5f5f5',
          },
        },
      }}
    >
      <Modal
        cancelText={lang.cancel}
        className={classNames(styles.modal, { [styles.desktop]: isDesktop })}
        closeIcon={
          <Icon className={styles['close-icon']} component={ActionPanelIcons.Delete} style={{ paddingTop: 10 }} />
        }
        footer={null}
        mask={false}
        maskClosable={false}
        modalRender={(modal) => (
          <Draggable cancel=".ant-select, .ant-input-number, button, input" nodeRef={draggleRef}>
            <div ref={draggleRef} style={{ cursor: 'move', paddingBottom: 1 }}>
              {modal}
            </div>
          </Draggable>
        )}
        okText={lang.confirm}
        onCancel={onCancel}
        open
        style={{
          left: 100,
          margin: 0,
          padding: 0,
          position: 'absolute',
          top: 'calc(100vh - 430px)',
        }}
        title={
          <div className={styles.title} style={{ margin: 0 }}>
            {lang.grid_array}
          </div>
        }
        width={280}
      >
        <div className={styles['section-header']}>
          <span className={styles['section-title']}>{lang.array_dimension}</span>
          <div className={styles.line} />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>{lang.columns}</span>
          <InputNumber
            className={styles.input}
            min={1}
            onChange={setColumn}
            precision={0}
            type="number"
            value={column}
          />
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
            className={classNames(styles.input, styles['with-unit'])}
            min={0}
            onChange={setDx}
            precision={setting.precision}
            type="number"
            value={dx}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Y</span>
          <InputNumber
            addonAfter={unit}
            className={classNames(styles.input, styles['with-unit'])}
            min={0}
            onChange={setDy}
            precision={setting.precision}
            type="number"
            value={dy}
          />
        </div>

        <div className={styles.footer}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            {lang.cancel}
          </Button>
          <Button onClick={handleConfirm} type="primary">
            {lang.confirm}
          </Button>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export const showArrayModal = (): void => {
  const id = 'array-modal';

  if (isIdExist(id)) return;

  addDialogComponent(
    id,
    <ArrayModal
      onCancel={() => popDialogById(id)}
      onOk={async (data) => {
        try {
          const { column, dx, dy, row } = data;
          const { dpmm } = constant;

          await generateSelectedElementArray({ dx: dx * dpmm, dy: dy * dpmm }, { column, row });
          popDialogById(id);
          setMouseMode('select');
          currentFileManager.setHasUnsavedChanges(true);
        } catch (error) {
          console.error('Array creation failed', error);
        }
      }}
    />,
  );
};

export default ArrayModal;
