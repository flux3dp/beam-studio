import React, { useState } from 'react';
import { Modal } from 'antd';

import UnitInput from 'app/widgets/Unit-Input-v2';
import useI18n from 'helpers/useI18n';
import ValidationTextInput from 'app/widgets/Validation-Text-Input';
import { ColorConfig } from 'app/constants/color-constants';

interface Props {
  onClose: () => void;
  handleAddConfig: (config: ColorConfig) => void;
}

const AddColorConfigModal = ({ onClose, handleAddConfig }: Props): JSX.Element => {
  const lang = useI18n().beambox.layer_color_config_panel;
  const [newColor, setNewColor] = useState('#FFFFFF');
  let newPower = 50;
  let newSpeed = 10;
  let newRepeat = 1;

  return (
    <Modal
      open
      title={lang.add_config}
      okText={lang.add}
      onOk={() => handleAddConfig({
        color: newColor,
        power: newPower,
        speed: newSpeed,
        repeat: newRepeat,
      })}
      onCancel={onClose}
    >
      <div className="add-config-panel">
        <div className="input-column">
          <div className="color-block" style={{ backgroundColor: newColor }} />
          <div className="name color">
            {`${lang.color} :`}
          </div>
          <ValidationTextInput
            defaultValue={newColor}
            validation={(val) => val}
            getValue={(val) => { setNewColor(val); }}
          />
        </div>
        <div className="input-column">
          <div className="name">
            {`${lang.power} :`}
          </div>
          <UnitInput
            className={{ power: true }}
            min={1}
            max={100}
            unit="%"
            defaultValue={newPower}
            getValue={(val) => { newPower = val; }}
            decimal={1}
          />
        </div>
        <div className="input-column">
          <div className="name">
            {`${lang.speed} :`}
          </div>
          <UnitInput
            className={{ speed: true }}
            min={3}
            max={300}
            unit="mm/s"
            defaultValue={newSpeed}
            getValue={(val) => { newSpeed = val; }}
            decimal={1}
          />
        </div>
        <div className="input-column">
          <div className="name">
            {`${lang.repeat} :`}
          </div>
          <UnitInput
            className={{ repeat: true }}
            min={1}
            max={10}
            unit=""
            defaultValue={newRepeat}
            getValue={(val) => { newRepeat = val; }}
            decimal={0}
          />
        </div>
      </div>
    </Modal>
  );
};

export default AddColorConfigModal;
