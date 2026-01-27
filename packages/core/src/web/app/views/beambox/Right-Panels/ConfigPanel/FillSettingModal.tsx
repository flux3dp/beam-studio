import React, { useState } from 'react';

import { Modal, Switch } from 'antd';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigKey, ConfigKeyTypeMap } from '@core/interfaces/ILayerConfig';

import styles from './FillSettingModal.module.scss';
import Input from './Input';

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
  const { getState, update } = useConfigPanelStore();
  const state = getState();
  const [draftValue, setDraftValue] = useState({
    biDirectional: state.biDirectional,
    crossHatch: state.crossHatch,
    fillAngle: state.fillAngle,
    fillInterval: state.fillInterval,
  });

  const handleSave = () => {
    const keys = ['fillInterval', 'fillAngle', 'biDirectional', 'crossHatch'] as const;

    useLayerStore.getState().selectedLayers.forEach((layerName) => {
      const layer = getLayerByName(layerName)!;

      keys.forEach((key) => {
        if (state[key].value !== draftValue[key].value || state[key].hasMultiValue !== draftValue[key].hasMultiValue) {
          writeDataLayer(layer, key, draftValue[key].value);
        }
      });
    });
    update(draftValue);
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
          <Input
            hasMultiValue={draftValue.fillInterval.hasMultiValue}
            id="fillInterval"
            isInch={false}
            max={100}
            min={0.0001}
            onChange={(value) => handleValueChange('fillInterval', value)}
            precision={4}
            step={0.0001}
            unit="mm"
            value={draftValue.fillInterval.value}
          />
        </div>
        <div>
          <span>{t.fill_angle}</span>
          <Input
            hasMultiValue={draftValue.fillAngle.hasMultiValue}
            id="fillAngle"
            isInch={false}
            max={360}
            min={-360}
            onChange={(value) => handleValueChange('fillAngle', value)}
            precision={1}
            unit="deg"
            value={draftValue.fillAngle.value}
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
