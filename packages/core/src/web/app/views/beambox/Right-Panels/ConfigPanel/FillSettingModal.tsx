import React, { useContext, useState } from 'react';

import { Modal, Switch } from 'antd';

import UnitInput from '@core/app/widgets/Unit-Input-v2';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigKey, ConfigKeyTypeMap } from '@core/interfaces/ILayerConfig';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './FillSettingModal.module.scss';

interface Props {
  onClose: () => void;
}

const FillSettingModal = ({ onClose }: Props): React.JSX.Element => {
  const {
    beambox: {
      right_panel: { laser_panel: t },
    },
    global: tGlobal,
  } = useI18n();
  const { dispatch, selectedLayers, state } = useContext(ConfigPanelContext);
  const [draftValue, setDraftValue] = useState({
    biDirectional: state.biDirectional,
    crossHatch: state.crossHatch,
    fillAngle: state.fillAngle,
    fillInterval: state.fillInterval,
  });

  const handleSave = () => {
    const keys = ['fillInterval', 'fillAngle', 'biDirectional', 'crossHatch'] as const;

    selectedLayers.forEach((layerName) => {
      const layer = getLayerByName(layerName);

      keys.forEach((key) => {
        if (state[key].value !== draftValue[key].value || state[key].hasMultiValue !== draftValue[key].hasMultiValue) {
          writeDataLayer(layer, key, draftValue[key].value);
        }
      });
    });
    dispatch({ payload: draftValue, type: 'update' });
    eventEmitterFactory.createEventEmitter('time-estimation-button').emit('SET_ESTIMATED_TIME', null);
    onClose();
  };

  const handleValueChange = <T extends ConfigKey>(key: T, value: ConfigKeyTypeMap[T]) => {
    setDraftValue((cur) => ({ ...cur, [key]: { hasMultiValue: false, value } }));
  };

  return (
    <Modal
      cancelText={tGlobal.cancel}
      centered
      maskClosable={false}
      okText={tGlobal.save}
      onCancel={onClose}
      onOk={handleSave}
      open
      title={t.fill_setting}
      width={350}
    >
      <div className={styles.hint}>{t.filled_path_only}</div>
      <div className={styles.container}>
        <div>
          <span>{t.fill_interval}</span>
          <UnitInput
            className={{ [styles.input]: true }}
            decimal={4}
            defaultValue={draftValue.fillInterval.value}
            displayMultiValue={draftValue.fillInterval.hasMultiValue}
            forceUsePropsUnit
            getValue={(value) => handleValueChange('fillInterval', value)}
            id="fillInterval"
            max={100}
            min={0.0001}
            step={0.0001}
            unit="mm"
          />
        </div>
        <div>
          <span>{t.fill_angle}</span>
          <UnitInput
            className={{ [styles.input]: true }}
            decimal={1}
            defaultValue={draftValue.fillAngle.value}
            displayMultiValue={draftValue.fillAngle.hasMultiValue}
            getValue={(value) => handleValueChange('fillAngle', value)}
            id="fillAngle"
            max={360}
            min={-360}
            unit="deg"
          />
        </div>
        <div onClick={() => handleValueChange('biDirectional', !draftValue.biDirectional.value)}>
          <label htmlFor="biDirectional">{t.bi_directional}</label>
          <Switch
            checked={draftValue.biDirectional.value}
            id="biDirectional"
            onChange={(value) => handleValueChange('biDirectional', value)}
          />
        </div>
        <div onClick={() => handleValueChange('crossHatch', !draftValue.crossHatch.value)}>
          <label htmlFor="crossHatch">{t.cross_hatch}</label>
          <Switch
            checked={draftValue.crossHatch.value}
            id="crossHatch"
            onChange={(value) => handleValueChange('crossHatch', value)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default FillSettingModal;
