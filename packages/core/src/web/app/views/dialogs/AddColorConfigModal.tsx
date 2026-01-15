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

interface InputConfig {
  defaultValue: number;
  key: 'power' | 'repeat' | 'speed';
  max: number;
  min: number;
  precision: number;
  unit: string;
}

const inputConfigs: InputConfig[] = [
  { defaultValue: 50, key: 'power', max: 100, min: 1, precision: 1, unit: '%' },
  { defaultValue: 10, key: 'speed', max: 300, min: 3, precision: 1, unit: 'mm/s' },
  { defaultValue: 1, key: 'repeat', max: 10, min: 1, precision: 0, unit: '' },
];

function AddColorConfigModal({ handleAddConfig, onClose }: Props): React.JSX.Element {
  const lang = useI18n().beambox.layer_color_config_panel;
  const [newColor, setNewColor] = useState('#FFFFFF');
  const valuesRef = useRef({ power: 50, repeat: 1, speed: 10 });

  const updateNewColor = (color: string) => {
    setNewColor(color.toUpperCase());
  };

  return (
    <DraggableModal
      okText={lang.add}
      onCancel={onClose}
      onOk={() =>
        handleAddConfig({
          color: newColor,
          power: valuesRef.current.power,
          repeat: valuesRef.current.repeat,
          speed: valuesRef.current.speed,
        })
      }
      open
      title={lang.add_config}
    >
      <div className={styles.container}>
        <div className={styles['input-row']}>
          <div className={styles.label}>{lang.color}</div>
          <div className={styles['color-input']}>
            <ColorPicker initColor={newColor} onChange={updateNewColor} />
          </div>
        </div>
        {inputConfigs.map(({ defaultValue, key, max, min, precision, unit }) => (
          <div className={styles['input-row']} key={key}>
            <div className={styles.label}>{lang[key]}</div>
            <UnitInput
              controls={false}
              defaultValue={defaultValue}
              max={max}
              min={min}
              onChange={(val) => {
                valuesRef.current[key] = val ?? defaultValue;
              }}
              precision={precision}
              unit={unit}
              unitClassName={styles.unit}
            />
          </div>
        ))}
      </div>
    </DraggableModal>
  );
}

export default AddColorConfigModal;
