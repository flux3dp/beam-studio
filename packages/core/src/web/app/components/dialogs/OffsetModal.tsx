import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Checkbox } from 'antd';

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
import type { CornerType, OffsetMode } from '@core/helpers/clipper/offset/constants';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import usePreviewModal from '@core/helpers/hooks/usePreviewModal';
import { useIsMobile } from '@core/helpers/system-helper';
import type { DisplayUnit } from '@core/helpers/units';
import units from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';

import styles from './OffsetModal.module.scss';

interface OffsetData {
  cornerType: CornerType;
  distances: Record<OffsetMode, number>;
  mode: OffsetMode;
}

const unitSettings: Record<DisplayUnit, { precision: number }> = {
  inch: { precision: 2 },
  mm: { precision: 2 },
};

const defaultDistances: Record<DisplayUnit, Record<OffsetMode, number>> = {
  inch: { expand: 0.002, inward: 0.2, outward: 0.2, shrink: 0.002 },
  mm: { expand: 0.05, inward: 3, outward: 3, shrink: 0.05 },
};

// In-memory storage for offset config (persists across modal open/close, resets on page reload).
// Distances are stored in the unit active at save time; discarded if the unit changes.
let sessionConfig: null | { data: OffsetData; unit: DisplayUnit } = null;

interface Props {
  onClose: () => void;
}

const OffsetModal = ({ onClose }: Props): React.JSX.Element => {
  const {
    beambox: { tool_panels: lang },
    global: tGlobal,
  } = useI18n();
  const unit = useStorageStore((state) => (state.isInch ? 'inch' : 'mm'));
  const { precision } = useMemo(() => unitSettings[unit], [unit]);
  const isMobile = useIsMobile();

  useNewShortcutsScope();

  const [data, setData] = useState<OffsetData>(() =>
    sessionConfig?.unit === unit
      ? sessionConfig.data
      : { cornerType: 'round', distances: { ...defaultDistances[unit] }, mode: 'outward' },
  );

  // Save config to in-memory store on change
  useEffect(() => {
    sessionConfig = { data, unit };
  }, [data, unit]);

  const distance = data.distances[data.mode];

  // Preview generation function
  const generatePreview = useCallback(async () => {
    const { cornerType, distances, mode } = data;
    const distanceMm = +units.convertUnit(distances[mode], 'mm', unit).toFixed(2);
    const { dpmm } = constant;

    return offsetElements(mode, distanceMm * dpmm, cornerType, undefined, { addToHistory: false });
  }, [data, unit]);

  const { cancelPreview, commitPreview, handlePreview, previewEnabled, setPreviewEnabled } = usePreviewModal({
    generatePreview,
    key: 'offset',
    selectionMode: 'inserted',
  });

  // Generate preview on mount and when data/unit/previewEnabled changes
  useEffect(() => {
    handlePreview();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [data, unit, previewEnabled]);

  const close = () => {
    onClose();
    setMouseMode('select');
  };

  const onOk = async () => {
    const cmd = await commitPreview();

    if (cmd && !cmd.isEmpty()) {
      undoManager.addCommandToHistory(cmd);
      currentFileManager.setHasUnsavedChanges(true);
    }

    close();
  };

  const handleCancel = () => {
    cancelPreview();
    close();
  };

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
          <Button onClick={handleCancel}>{lang.cancel}</Button>
          <Button onClick={onOk} type="primary">
            {lang.confirm}
          </Button>
        </div>
      }
      maskClosable={false}
      onCancel={handleCancel}
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
          onChange={(val: OffsetMode) => setData((prev) => ({ ...prev, mode: val }))}
          options={[
            { label: lang._offset.outward, value: 'outward' },
            { label: lang._offset.inward, value: 'inward' },
          ]}
          popupMatchSelectWidth={false}
          value={data.mode}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>{lang._offset.corner_type}</span>
        <Select
          className={styles.select}
          data-testid="offset-corner"
          onChange={(val) => setData((prev) => ({ ...prev, cornerType: val }))}
          options={[
            { label: lang._offset.round, value: 'round' },
            { label: lang._offset.sharp, value: 'sharp' },
          ]}
          popupMatchSelectWidth={false}
          value={data.cornerType}
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
          onChange={(dist) => {
            if (dist != null) setData((prev) => ({ ...prev, distances: { ...prev.distances, [prev.mode]: dist } }));
          }}
          precision={precision}
          type="number"
          value={distance}
        />
      </div>
    </DraggableModal>
  );
};

export const showOffsetModal = (): void => {
  const id = 'offset-modal';

  if (isIdExist(id)) return;

  addDialogComponent(id, <OffsetModal onClose={() => popDialogById(id)} />);
};

export default OffsetModal;
