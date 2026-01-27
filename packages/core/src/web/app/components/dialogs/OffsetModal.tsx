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
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import usePreviewModal from '@core/helpers/hooks/usePreviewModal';
import { useIsMobile } from '@core/helpers/system-helper';
import units from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';

import styles from './OffsetModal.module.scss';

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
  const {
    beambox: { tool_panels: lang },
    global: tGlobal,
  } = useI18n();
  const unit = useStorageStore((state) => (state.isInch ? 'inch' : 'mm'));
  const { distance, preciseDistance, precision } = useMemo(() => unitSettings[unit], [unit]);
  const isMobile = useIsMobile();

  useNewShortcutsScope();

  const [offset, setOffset] = useState<OffsetProp>({
    cornerType: 'round',
    distance: distance.default,
    mode: 'outward',
  });

  const getDistance = (mode: OffsetProp['mode']) => (['expand', 'shrink'].includes(mode) ? preciseDistance : distance);

  // Preview generation function
  const generatePreview = useCallback(async () => {
    const distanceMm = +units.convertUnit(offset.distance, 'mm', unit).toFixed(2);
    const { cornerType, mode } = offset;
    const { dpmm } = constant;

    return offsetElements(mode, distanceMm * dpmm, cornerType, undefined, { addToHistory: false });
  }, [offset, unit]);

  const { cancelPreview, commitPreview, handlePreview, previewEnabled, setPreviewEnabled } = usePreviewModal({
    generatePreview,
    key: 'offset',
    selectionMode: 'inserted',
  });

  // Generate preview on mount and when offset/unit/previewEnabled changes
  useEffect(() => {
    handlePreview();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [offset.distance, offset.mode, offset.cornerType, unit, previewEnabled]);

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
          onChange={(dist) => setOffset({ ...offset, distance: dist! })}
          precision={precision}
          type="number"
          value={offset.distance}
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
