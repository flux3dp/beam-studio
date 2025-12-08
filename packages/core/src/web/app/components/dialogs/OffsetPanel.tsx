import React, { useEffect, useRef, useState } from 'react';

import Icon from '@ant-design/icons';
import { Button, ConfigProvider, InputNumber, Modal } from 'antd';
import classNames from 'classnames';
import Draggable from 'react-draggable';

import Constant from '@core/app/actions/beambox/constant';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useStorageStore } from '@core/app/stores/storageStore';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import styles from '@core/app/views/beambox/ToolPanels/OffsetModal.module.scss';
import Select from '@core/app/widgets/AntdSelect';
import offsetElements from '@core/helpers/clipper/offset';
import units from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';

const _mmTopixel = (pixel_input: number) => {
  const { dpmm } = Constant;

  return Number(pixel_input * dpmm);
};

export type OffsetProp = {
  cornerType: 'round' | 'sharp';
  distance: number;
  mode: 'expand' | 'inward' | 'outward' | 'shrink';
};

type Distance = { default: number; max: number; min: number; step?: number };

const unitSettings: Record<'inch' | 'mm', { distance: Distance; preciseDistance: Distance; precision: number }> = {
  inch: {
    distance: { default: 0.2, max: 1, min: 0, step: 0.1 },
    preciseDistance: { default: 0.002, max: 0.04, min: 0, step: 0.01 },
    precision: 2,
  },
  mm: {
    distance: { default: 3, max: 20, min: 1 },
    preciseDistance: { default: 0.05, max: 1, min: 0.01, step: 0.01 },
    precision: 2,
  },
};

interface Props {
  onCancel: () => void;
  onOk: (offset: OffsetProp) => void;
}

const OffsetModal = ({ onCancel, onOk }: Props): React.JSX.Element => {
  const lang = useI18n().beambox.tool_panels;
  const unit = useStorageStore((state) => (state['default-units'] === 'inches' ? 'inch' : 'mm'));
  const setting = unitSettings[unit];

  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 600);

  const [offset, setOffset] = useState<OffsetProp>({
    cornerType: 'round',
    distance: setting.distance.default,
    mode: 'outward',
  });

  const draggleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 600);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getDistance = (mode: OffsetProp['mode']) => {
    if (['expand', 'shrink'].includes(mode)) {
      return setting.preciseDistance;
    }

    return setting.distance;
  };

  const handleConfirm = () => {
    const distanceInMM = +units.convertUnit(offset.distance, 'mm', unit).toFixed(2);

    onOk({ ...offset, distance: distanceInMM });
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
          Select: { borderRadius: 6 },
        },
      }}
    >
      <Modal
        cancelText={lang.cancel}
        className={classNames(styles.modal, { [styles.desktop]: isDesktop })}
        closeIcon={
          <Icon className={styles['close-icon']} component={ActionPanelIcons.Delete} style={{ paddingTop: 5 }} />
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
          top: 'calc(100vh - 350px)',
        }}
        styles={{
          header: {
            borderBottom: 'none',
            marginBottom: 0,
          },
          mask: { backgroundColor: 'transparent' },
        }}
        title={
          <div className={styles.title} style={{ margin: 0 }}>
            {lang.offset}
          </div>
        }
        width={350}
      >
        <div className={styles.field}>
          <span className={styles.label}>{lang._offset.direction}</span>
          <Select
            className={styles.select}
            onChange={(mode) => {
              setOffset({ ...offset, distance: getDistance(mode).default, mode });
            }}
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
            className={classNames(styles.input, styles['with-unit'])}
            min={0}
            onChange={(distance) => setOffset({ ...offset, distance: distance! })}
            precision={setting.precision}
            type="number"
            value={offset.distance}
          />
        </div>

        <div className={styles.footer} style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
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

export const showOffsetModal = (): void => {
  const id = 'offset-modal';

  if (isIdExist(id)) return;

  addDialogComponent(
    id,
    <OffsetModal
      onCancel={() => popDialogById(id)}
      onOk={async (offset) => {
        try {
          const { cornerType, distance, mode } = offset;

          await offsetElements(mode, _mmTopixel(distance), cornerType);

          popDialogById(id);
          setMouseMode('select');
          currentFileManager.setHasUnsavedChanges(true);
        } catch (error) {
          console.error('Offset failed', error);
        }
      }}
    />,
  );
};

export default OffsetModal;
