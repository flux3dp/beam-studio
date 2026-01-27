import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Checkbox } from 'antd';

import constant from '@core/app/actions/beambox/constant';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useStorageStore } from '@core/app/stores/storageStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import undoManager from '@core/app/svgedit/history/undoManager';
import { generateSelectedElementArray } from '@core/app/svgedit/operations/clipboard';
import DraggableModal from '@core/app/widgets/DraggableModal';
import UnitInput from '@core/app/widgets/UnitInput';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import usePreviewModal from '@core/helpers/hooks/usePreviewModal';
import { useIsMobile } from '@core/helpers/system-helper';
import units from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';

import styles from './ArrayModal.module.scss';

interface ArrayData {
  column: number;
  dx: number;
  dy: number;
  row: number;
}

const ArrayModal = ({ onClose }: { onClose: () => void }): React.JSX.Element => {
  const {
    beambox: { tool_panels: t },
    global: tGlobal,
  } = useI18n();
  const isMobile = useIsMobile();
  const unit = useStorageStore((state) => (state.isInch ? 'inch' : 'mm'));

  useNewShortcutsScope();

  // Configuration based on unit
  const config = useMemo(
    () =>
      ({
        inch: { default: 1, precision: 2, step: 0.1 },
        mm: { default: 20, precision: 2, step: 1 },
      })[unit],
    [unit],
  );

  const [data, setData] = useState<ArrayData>({
    column: 3,
    dx: config.default,
    dy: config.default,
    row: 3,
  });

  // Preview generation function
  const generatePreview = useCallback(async () => {
    const toPixel = (val: number) => units.convertUnit(val, 'mm', unit) * constant.dpmm;

    return generateSelectedElementArray(
      { dx: toPixel(data.dx), dy: toPixel(data.dy) },
      { column: data.column, row: data.row },
      { addToHistory: false },
    );
  }, [data, unit]);

  const { cancelPreview, commitPreview, handlePreview, previewEnabled, setPreviewEnabled } = usePreviewModal({
    generatePreview,
    key: 'array',
    selectionMode: 'all',
  });

  // Unified state updater
  const updateValue = (key: keyof ArrayData) => (val: null | number) => {
    const isCountField = key === 'column' || key === 'row';
    const defaultValue = isCountField ? 1 : 0;

    setData((prev) => ({ ...prev, [key]: val ?? defaultValue }));
  };

  // Generate preview on mount and when data/unit/previewEnabled changes
  useEffect(() => {
    handlePreview();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [data, unit, previewEnabled]);

  const onConfirm = async () => {
    const cmd = await commitPreview();

    if (cmd && !cmd.isEmpty()) {
      undoManager.addCommandToHistory(cmd);
      currentFileManager.setHasUnsavedChanges(true);
    }

    close();
  };

  const close = () => {
    onClose();
    setMouseMode('select');
  };

  const onCancel = () => {
    cancelPreview();
    close();
  };

  // Render Helpers
  const renderField = (
    label: string,
    key: keyof ArrayData,
    min: number,
    precision: number,
    step?: number,
    addon?: string,
  ) => (
    <div className={styles.field} key={key}>
      <span className={styles.label}>{label}</span>
      <UnitInput
        addonAfter={addon}
        className={styles.input}
        data-testid={key}
        min={min}
        onChange={updateValue(key)}
        precision={precision}
        step={step}
        type="number"
        value={data[key]}
      />
    </div>
  );

  return (
    <DraggableModal
      className={styles.modal}
      defaultPosition={isMobile ? undefined : { x: 60, y: -60 }}
      footer={
        <div className={styles.footer}>
          <Checkbox
            checked={previewEnabled}
            className={styles.checkbox}
            onChange={(e) => setPreviewEnabled(e.target.checked)}
          >
            {tGlobal.preview}
          </Checkbox>
          <Button onClick={onCancel}>{t.cancel}</Button>
          <Button onClick={onConfirm} type="primary">
            {t.confirm}
          </Button>
        </div>
      }
      maskClosable={false}
      onCancel={onCancel}
      open
      title={t.grid_array}
      width={280}
      xRef={isMobile ? 'center' : 'left'}
      yRef={isMobile ? 'center' : 'bottom'}
    >
      <div className={styles['section-header']}>
        <span className={styles['section-title']}>{t.array_dimension}</span>
        <div className={styles.line} />
      </div>
      {renderField(t.columns, 'column', 1, 0)}
      {renderField(t.rows, 'row', 1, 0)}

      <div className={styles['section-header']}>
        <span className={styles['section-title']}>{t.array_interval}</span>
        <div className={styles.line} />
      </div>
      {renderField('X', 'dx', 0, config.precision, config.step, unit)}
      {renderField('Y', 'dy', 0, config.precision, config.step, unit)}
    </DraggableModal>
  );
};

export const showArrayModal = (): void => {
  const id = 'array-modal';

  if (isIdExist(id)) return;

  addDialogComponent(id, <ArrayModal onClose={() => popDialogById(id)} />);
};

export default ArrayModal;
