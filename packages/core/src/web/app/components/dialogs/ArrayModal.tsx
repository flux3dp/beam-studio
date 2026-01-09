import React, { useEffect, useMemo, useRef, useState } from 'react';

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
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import units from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './ArrayModal.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

interface ArrayData {
  column: number;
  dx: number;
  dy: number;
  row: number;
}

const ArrayModal = ({ onClose }: { onClose: () => void }): React.JSX.Element => {
  const t = useI18n().beambox.tool_panels;
  const isMobile = useIsMobile();
  const unit = useStorageStore((state) => (state.isInch ? 'inch' : 'mm'));
  const containerRef = useRef<HTMLDivElement>(null);

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

  const cmdRef = useRef<IBatchCommand | null>(null);
  const selectionRef = useRef<SVGElement[]>([]);
  const processing = useRef(false);
  const queueNext = useRef(false);

  // Unified state updater
  const updateValue = (key: keyof ArrayData) => (val: null | number) => {
    setData((prev) => ({ ...prev, [key]: val ?? (key === 'column' || key === 'row' ? 1 : 0) }));
  };

  const handlePreview = async () => {
    if (processing.current) {
      queueNext.current = true;

      return;
    }

    processing.current = true;

    // Undo previous preview
    (cmdRef.current as any)?.unapply();
    cmdRef.current = null;

    // Reset to original selection to ensure base for generation is correct
    if (selectionRef.current.length) {
      svgCanvas.multiSelect(selectionRef.current);
    }

    // Convert values to pixels
    const toPixel = (val: number) => units.convertUnit(val, 'mm', unit) * constant.dpmm;

    const cmd = await generateSelectedElementArray(
      { dx: toPixel(data.dx), dy: toPixel(data.dy) },
      { column: data.column, row: data.row },
      { skipHistory: true },
    );

    if (cmd) cmdRef.current = cmd;

    // Restore original selection state and focus
    if (selectionRef.current.length) svgCanvas.multiSelect(selectionRef.current);

    processing.current = false;

    // Process queued update if one occurred during generation
    if (queueNext.current) {
      queueNext.current = false;
      handlePreview();
    }
  };

  // Initial setup
  useEffect(() => {
    selectionRef.current = [...svgCanvas.getSelectedWithoutTempGroup()];
    handlePreview();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  // Update on change
  useEffect(() => {
    handlePreview();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [data, unit]);

  const onConfirm = () => {
    if (cmdRef.current && !cmdRef.current.isEmpty()) {
      undoManager.addCommandToHistory(cmdRef.current);
      currentFileManager.setHasUnsavedChanges(true);
    }

    close();
  };

  const close = () => {
    onClose();
    setMouseMode('select');
  };

  const onCancel = () => {
    (cmdRef.current as any)?.unapply();
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
    <div ref={containerRef}>
      <DraggableModal
        cancelText={t.cancel}
        className={styles.modal}
        defaultPosition={isMobile ? undefined : { x: 60, y: -60 }}
        maskClosable={false}
        okText={t.confirm}
        onCancel={onCancel}
        onOk={onConfirm}
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
    </div>
  );
};

export const showArrayModal = (): void => {
  const id = 'array-modal';

  if (isIdExist(id)) return;

  addDialogComponent(id, <ArrayModal onClose={() => popDialogById(id)} />);
};

export default ArrayModal;
