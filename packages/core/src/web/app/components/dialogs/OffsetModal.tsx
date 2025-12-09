import React, { useMemo, useState } from 'react';

import Icon from '@ant-design/icons';
import { InputNumber } from 'antd';

import constant from '@core/app/actions/beambox/constant';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useStorageStore } from '@core/app/stores/storageStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import Select from '@core/app/widgets/AntdSelect';
import DraggableModal from '@core/app/widgets/DraggableModal';
import offsetElements from '@core/helpers/clipper/offset';
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
  inch: {
    distance: { default: 0.2 },
    preciseDistance: { default: 0.002 },
    precision: 2,
  },
  mm: {
    distance: { default: 3 },
    preciseDistance: { default: 0.05 },
    precision: 2,
  },
};

interface Props {
  onClose: () => void;
}

const OffsetModal = ({ onClose }: Props): React.JSX.Element => {
  const lang = useI18n().beambox.tool_panels;
  const unit = useStorageStore((state) => (state.isInch ? 'inch' : 'mm'));
  const { distance, preciseDistance, precision } = useMemo(() => unitSettings[unit], [unit]);
  const isMobile = useIsMobile();
  const [offset, setOffset] = useState<OffsetProp>({
    cornerType: 'round',
    distance: distance.default,
    mode: 'outward',
  });

  const getDistance = (mode: OffsetProp['mode']) => {
    return ['expand', 'shrink'].includes(mode) ? preciseDistance : distance;
  };

  const onOk = async () => {
    try {
      const distance = +units.convertUnit(offset.distance, 'mm', unit).toFixed(2);
      const { cornerType, mode } = offset;
      const { dpmm } = constant;

      await offsetElements(mode, distance * dpmm, cornerType);

      currentFileManager.setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Offset failed', error);
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
        <InputNumber
          addonAfter={unit}
          className={styles.input}
          min={0}
          onChange={(distance) => setOffset({ ...offset, distance: distance! })}
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
