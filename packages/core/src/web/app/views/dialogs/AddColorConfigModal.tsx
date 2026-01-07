import React, { useRef, useState } from 'react';

import type { ColorConfig } from '@core/app/constants/color-constants';
import ColorPicker from '@core/app/widgets/ColorPicker';
import DraggableModal from '@core/app/widgets/DraggableModal';
import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import styles from './AddColorConfigModal.module.scss';

interface Props {
  handleAddConfig: (config: ColorConfig) => void;
  onClose: () => void;
}

const AddColorConfigModal = ({ handleAddConfig, onClose }: Props): React.JSX.Element => {
  const lang = useI18n().beambox.layer_color_config_panel;
  const [newColor, setNewColor] = useState('#FFFFFF');
  const powerRef = useRef(50);
  const speedRef = useRef(10);
  const repeatRef = useRef(1);

  return (
    <DraggableModal
      okText={lang.add}
      onCancel={onClose}
      onOk={() =>
        handleAddConfig({
          color: newColor,
          power: powerRef.current,
          repeat: repeatRef.current,
          speed: speedRef.current,
        })
      }
      open
      title={lang.add_config}
    >
      <div className={styles.container}>
        <div className={styles['input-row']}>
          <div className={styles.label}>{lang.color}</div>
          <div className={styles['color-input']}>
            <ColorPicker initColor={newColor} onChange={setNewColor} />
          </div>
        </div>
        <div className={styles['input-row']}>
          <div className={styles.label}>{lang.power}</div>
          <UnitInput
            controls={false}
            defaultValue={powerRef.current}
            max={100}
            min={1}
            onChange={(val) => {
              powerRef.current = val ?? 50;
            }}
            precision={1}
            unit="%"
            unitClassName={styles.unit}
          />
        </div>
        <div className={styles['input-row']}>
          <div className={styles.label}>{lang.speed}</div>
          <UnitInput
            controls={false}
            defaultValue={speedRef.current}
            max={300}
            min={3}
            onChange={(val) => {
              speedRef.current = val ?? 10;
            }}
            precision={1}
            unit="mm/s"
            unitClassName={styles.unit}
          />
        </div>
        <div className={styles['input-row']}>
          <div className={styles.label}>{lang.repeat}</div>
          <UnitInput
            controls={false}
            defaultValue={repeatRef.current}
            max={10}
            min={1}
            onChange={(val) => {
              repeatRef.current = val ?? 1;
            }}
            precision={0}
            unit=""
            unitClassName={styles.unit}
          />
        </div>
      </div>
    </DraggableModal>
  );
};

export default AddColorConfigModal;
