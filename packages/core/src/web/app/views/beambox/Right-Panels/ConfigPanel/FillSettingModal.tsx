import React, { useContext, useState } from 'react';
import { Modal, Switch } from 'antd';

import eventEmitterFactory from 'helpers/eventEmitterFactory';
import UnitInput from 'app/widgets/Unit-Input-v2';
import useI18n from 'helpers/useI18n';
import { ConfigKey, ConfigKeyTypeMap } from 'interfaces/ILayerConfig';
import { getLayerByName } from 'helpers/layer/layer-helper';
import { writeDataLayer } from 'helpers/layer/layer-config-helper';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './FillSettingModal.module.scss';

interface Props {
  onClose: () => void;
}

const FillSettingModal = ({ onClose }: Props): JSX.Element => {
  const {
    global: tGlobal,
    beambox: {
      right_panel: { laser_panel: t },
    },
  } = useI18n();
  const { dispatch, selectedLayers, state } = useContext(ConfigPanelContext);
  const [draftValue, setDraftValue] = useState({
    fillInterval: state.fillInterval,
    fillAngle: state.fillAngle,
    biDirectional: state.biDirectional,
    crossHatch: state.crossHatch,
  });

  const handleSave = () => {
    const keys = ['fillInterval', 'fillAngle', 'biDirectional', 'crossHatch'] as const;
    selectedLayers.forEach((layerName) => {
      const layer = getLayerByName(layerName);
      keys.forEach((key) => {
        if (
          state[key].value !== draftValue[key].value ||
          state[key].hasMultiValue !== draftValue[key].hasMultiValue
        ) {
          writeDataLayer(layer, key, draftValue[key].value);
        }
      });
    });
    dispatch({ type: 'update', payload: draftValue });
    eventEmitterFactory
      .createEventEmitter('time-estimation-button')
      .emit('SET_ESTIMATED_TIME', null);
    onClose();
  };

  const handleValueChange = <T extends ConfigKey>(key: T, value: ConfigKeyTypeMap[T]) => {
    setDraftValue((cur) => ({ ...cur, [key]: { value, hasMultiValue: false } }));
  };

  return (
    <Modal
      centered
      open
      maskClosable={false}
      width={350}
      onOk={handleSave}
      onCancel={onClose}
      cancelText={tGlobal.cancel}
      okText={tGlobal.save}
      title={t.fill_setting}
    >
      <div className={styles.hint}>{t.filled_path_only}</div>
      <div className={styles.container}>
        <div>
          <span>{t.fill_interval}</span>
          <UnitInput
            id="fillInterval"
            className={{ [styles.input]: true }}
            defaultValue={draftValue.fillInterval.value}
            getValue={(value) => handleValueChange('fillInterval', value)}
            min={0.0001}
            max={100}
            unit="mm"
            decimal={4}
            step={0.0001}
            displayMultiValue={draftValue.fillInterval.hasMultiValue}
            forceUsePropsUnit
          />
        </div>
        <div>
          <span>{t.fill_angle}</span>
          <UnitInput
            id="fillAngle"
            className={{ [styles.input]: true }}
            defaultValue={draftValue.fillAngle.value}
            getValue={(value) => handleValueChange('fillAngle', value)}
            min={-360}
            max={360}
            unit="deg"
            decimal={1}
            displayMultiValue={draftValue.fillAngle.hasMultiValue}
          />
        </div>
        <div onClick={() => handleValueChange('biDirectional', !draftValue.biDirectional.value)}>
          <label htmlFor="biDirectional">{t.bi_directional}</label>
          <Switch
            id="biDirectional"
            checked={draftValue.biDirectional.value}
            onChange={(value) => handleValueChange('biDirectional', value)}
          />
        </div>
        <div onClick={() => handleValueChange('crossHatch', !draftValue.crossHatch.value)}>
          <label htmlFor="crossHatch">{t.cross_hatch}</label>
          <Switch
            id="crossHatch"
            checked={draftValue.crossHatch.value}
            onChange={(value) => handleValueChange('crossHatch', value)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default FillSettingModal;
