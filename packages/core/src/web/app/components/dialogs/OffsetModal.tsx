import React, { useEffect, useMemo, useRef, useState } from 'react';

import constant from '@core/app/actions/beambox/constant';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useStorageStore } from '@core/app/stores/storageStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import undoManager from '@core/app/svgedit/history/undoManager';
import Select from '@core/app/widgets/AntdSelect';
import DraggableModal from '@core/app/widgets/DraggableModal';
import UnitInput from '@core/app/widgets/UnitInput';
import offsetElements from '@core/helpers/clipper/offset';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import units from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './OffsetModal.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

type OffsetProp = {
  cornerType: 'round' | 'sharp';
  distance: number;
  mode: 'expand' | 'inward' | 'outward' | 'shrink';
};

type Distance = { default: number };

const unitSettings: Record<'inch' | 'mm', { distance: Distance; preciseDistance: Distance; precision: number }> = {
  inch: { distance: { default: 0.2 }, preciseDistance: { default: 0.002 }, precision: 2 },
  mm: { distance: { default: 3 }, preciseDistance: { default: 0.05 }, precision: 2 },
};

interface Props {
  onClose: () => void;
}

const OffsetModal = ({ onClose }: Props): React.JSX.Element => {
  const lang = useI18n().beambox.tool_panels;
  const unit = useStorageStore((state) => (state.isInch ? 'inch' : 'mm'));
  const { distance, preciseDistance, precision } = useMemo(() => unitSettings[unit], [unit]);
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  useNewShortcutsScope();

  const [offset, setOffset] = useState<OffsetProp>({
    cornerType: 'round',
    distance: distance.default,
    mode: 'outward',
  });

  const batchCmd = useRef<IBatchCommand | null>(null);
  const originalSelection = useRef<SVGElement[]>([]);
  const isGenerating = useRef(false);
  const pendingPreview = useRef(false);

  const getDistance = (mode: OffsetProp['mode']) => (['expand', 'shrink'].includes(mode) ? preciseDistance : distance);

  const handlePreview = async () => {
    // If already generating, mark that we need another preview after current one finishes
    if (isGenerating.current) {
      pendingPreview.current = true;

      return;
    }

    isGenerating.current = true;

    // Unapply previous preview if exists
    (batchCmd.current as any)?.unapply();
    batchCmd.current = null;

    // Restore original selection before generating new preview
    if (originalSelection.current.length > 0) {
      svgCanvas.selectOnly(originalSelection.current, true);
    }

    const distanceMm = +units.convertUnit(offset.distance, 'mm', unit).toFixed(2);
    const { cornerType, mode } = offset;
    const { dpmm } = constant;

    const cmd = await offsetElements(mode, distanceMm * dpmm, cornerType, undefined, { skipHistory: true });

    if (cmd) {
      batchCmd.current = cmd;
    }

    // Restore original selection after preview (offsetElements selects the new element)
    if (originalSelection.current.length > 0) {
      svgCanvas.selectOnly(originalSelection.current, true);
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
  }, [offset.distance, offset.mode, offset.cornerType, unit]);

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
        title={lang.offset}
        width={350}
        xRef={isMobile ? 'center' : 'left'}
        yRef={isMobile ? 'center' : 'bottom'}
      >
        <div className={styles.field}>
          <span className={styles.label}>{lang._offset.direction}</span>
          <Select
            className={styles.select}
            onChange={(mode) => setOffset({ ...offset, distance: getDistance(mode).default, mode })}
            options={[
              { label: lang._offset.outward, value: 'outward' },
              { label: lang._offset.inward, value: 'inward' },
            ]}
            popupMatchSelectWidth={false}
            value={offset.mode}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{lang._offset.corner_type}</span>
          <Select
            className={styles.select}
            data-testid="offset-corner"
            onChange={(val) => setOffset({ ...offset, cornerType: val })}
            options={[
              { label: lang._offset.round, value: 'round' },
              { label: lang._offset.sharp, value: 'sharp' },
            ]}
            popupMatchSelectWidth={false}
            value={offset.cornerType}
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.field}>
          <span className={styles.label}>{lang._offset.dist}</span>
          <UnitInput
            addonAfter={unit}
            className={styles.input}
            data-testid="offset-distance"
            min={0}
            onChange={(distance) => setOffset({ ...offset, distance: distance! })}
            precision={precision}
            type="number"
            value={offset.distance}
          />
        </div>
      </DraggableModal>
    </div>
  );
};

export const showOffsetModal = (): void => {
  const id = 'offset-modal';

  if (isIdExist(id)) return;

  addDialogComponent(id, <OffsetModal onClose={() => popDialogById(id)} />);
};

export default OffsetModal;
