import React, { useState } from 'react';

import { Modal } from 'antd';

import type { ColorConfig } from '@core/app/constants/color-constants';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import ValidationTextInput from '@core/app/widgets/Validation-Text-Input';
import useI18n from '@core/helpers/useI18n';

interface Props {
  handleAddConfig: (config: ColorConfig) => void;
  onClose: () => void;
}

const AddColorConfigModal = ({ handleAddConfig, onClose }: Props): React.JSX.Element => {
  const lang = useI18n().beambox.layer_color_config_panel;
  const [newColor, setNewColor] = useState('#FFFFFF');
  let newPower = 50;
  let newSpeed = 10;
  let newRepeat = 1;

  return (
    <Modal
      okText={lang.add}
      onCancel={onClose}
      onOk={() =>
        handleAddConfig({
          color: newColor,
          power: newPower,
          repeat: newRepeat,
          speed: newSpeed,
        })
      }
      open
      title={lang.add_config}
    >
      <div className="add-config-panel">
        <div className="input-column">
          <div className="color-block" style={{ backgroundColor: newColor }} />
          <div className="name color">{`${lang.color} :`}</div>
          <ValidationTextInput
            defaultValue={newColor}
            getValue={(val) => {
              setNewColor(val);
            }}
            validation={(val) => val}
          />
        </div>
        <div className="input-column">
          <div className="name">{`${lang.power} :`}</div>
          <UnitInput
            className={{ power: true }}
            decimal={1}
            defaultValue={newPower}
            getValue={(val) => {
              newPower = val;
            }}
            max={100}
            min={1}
            unit="%"
          />
        </div>
        <div className="input-column">
          <div className="name">{`${lang.speed} :`}</div>
          <UnitInput
            className={{ speed: true }}
            decimal={1}
            defaultValue={newSpeed}
            getValue={(val) => {
              newSpeed = val;
            }}
            max={300}
            min={3}
            unit="mm/s"
          />
        </div>
        <div className="input-column">
          <div className="name">{`${lang.repeat} :`}</div>
          <UnitInput
            className={{ repeat: true }}
            decimal={0}
            defaultValue={newRepeat}
            getValue={(val) => {
              newRepeat = val;
            }}
            max={10}
            min={1}
            unit=""
          />
        </div>
      </div>
    </Modal>
  );
};

export default AddColorConfigModal;
