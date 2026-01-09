import React, { useEffect, useMemo, useRef, useState } from 'react';

import { InputNumber } from 'antd';

import constant from '@core/app/actions/beambox/constant';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useStorageStore } from '@core/app/stores/storageStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import undoManager from '@core/app/svgedit/history/undoManager';
import { generateSelectedElementArray } from '@core/app/svgedit/operations/clipboard';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import units from '@core/helpers/units';
import { useFocusScope } from '@core/helpers/useFocusScope';
import useI18n from '@core/helpers/useI18n';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './ArrayModal.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

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
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusScope(containerRef);

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

  const batchCmd = useRef<IBatchCommand | null>(null);
  const originalSelection = useRef<SVGElement[]>([]);
  const isGenerating = useRef(false);
  const pendingPreview = useRef(false);

  const handlePreview = async () => {
    // If already generating, mark that we need another preview after current one finishes
    if (isGenerating.current) {
      pendingPreview.current = true;

      return;
    }

    isGenerating.current = true;

    // Record the currently focused element before canvas operations
    const focusedElement = document.activeElement as HTMLElement | null;

    console.log('focusedElement', focusedElement);

    // Unapply previous preview if exists
    if (batchCmd.current) {
      (batchCmd.current as { unapply: (handler?: unknown) => void }).unapply();
      batchCmd.current = null;
    }

    // Restore original selection before generating new preview
    if (originalSelection.current.length > 0) {
      svgCanvas.multiSelect(originalSelection.current);
    }

    const dxMm = +units.convertUnit(data.dx, 'mm', unit).toFixed(2);
    const dyMm = +units.convertUnit(data.dy, 'mm', unit).toFixed(2);
    const { dpmm } = constant;

    const cmd = await generateSelectedElementArray(
      { dx: dxMm * dpmm, dy: dyMm * dpmm },
      { column: data.column, row: data.row },
      { skipHistory: true },
    );

    if (cmd) {
      batchCmd.current = cmd;
    }

    // Restore original selection after generation (generateSelectedElementArray selects generated elements)
    if (originalSelection.current.length > 0) {
      svgCanvas.multiSelect(originalSelection.current);
    }

    // Restore focus to the previously focused element (keeps useFocusScope active)
    if (focusedElement) {
      focusedElement.focus();
    }

    isGenerating.current = false;

    // If another preview was requested while we were generating, run it now
    if (pendingPreview.current) {
      pendingPreview.current = false;
      handlePreview();
    }
  };

  useEffect(() => {
    // Store original selection on mount and run initial preview
    originalSelection.current = [...svgCanvas.getSelectedWithoutTempGroup()];
    handlePreview();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handlePreview();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [data.column, data.row, data.dx, data.dy, unit]);

  const onOk = () => {
    if (batchCmd.current && !batchCmd.current.isEmpty()) {
      undoManager.addCommandToHistory(batchCmd.current);
      currentFileManager.setHasUnsavedChanges(true);
    }

    onClose();
    setMouseMode('select');
  };

  const handleCancel = () => {
    // Revert all preview changes
    if (batchCmd.current) {
      (batchCmd.current as { unapply: (handler?: unknown) => void }).unapply();
    }

    onClose();
    setMouseMode('select');
  };

  return (
    <div ref={containerRef}>
      <DraggableModal
        cancelText={lang.cancel}
        className={styles.modal}
        defaultPosition={isMobile ? undefined : { x: 60, y: -60 }}
        maskClosable={false}
        okText={lang.confirm}
        onCancel={handleCancel}
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
          <InputNumber
            className={styles.input}
            data-testid="columns"
            min={1}
            onChange={setColumn}
            precision={0}
            type="number"
            value={column}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{lang.rows}</span>
          <InputNumber
            className={styles.input}
            data-testid="rows"
            min={1}
            onChange={setRow}
            precision={0}
            type="number"
            value={row}
          />
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
            data-testid="array_dx"
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
            data-testid="array_dy"
            min={0}
            onChange={setDy}
            precision={precision}
            step={distanceStep}
            type="number"
            value={dy}
          />
        </div>
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
