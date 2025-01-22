import React, { useContext, useState } from 'react';

import { Modal } from 'antd';

import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';

import ConfigPanelContext from './ConfigPanelContext';
import WhiteInkMultipass from './WhiteInkMultipass';
import WhiteInkRepeat from './WhiteInkRepeat';
import WhiteInkSaturation from './WhiteInkSaturation';
import styles from './WhiteInkSettingsModal.module.scss';
import WhiteInkSpeed from './WhiteInkSpeed';

interface Props {
  onClose: () => void;
}

// TODO: add test
const WhiteInkSettingsModal = ({ onClose }: Props): React.JSX.Element => {
  const { dispatch, selectedLayers, state } = useContext(ConfigPanelContext);
  const {
    beambox: {
      right_panel: { laser_panel: t },
    },
    global: tGlobal,
  } = useI18n();
  const { wInk, wMultipass, wRepeat, wSpeed } = state;
  const [ink, setInk] = useState(wInk);
  const [speed, setSpeed] = useState(wSpeed);
  const [multipass, setMultipass] = useState(wMultipass);
  const [repeat, setRepeat] = useState(wRepeat);

  const handleSave = () => {
    const newState = { ...state };

    selectedLayers.forEach((layerName) => {
      const layer = getLayerByName(layerName);

      if (wInk.value !== ink.value || wInk.hasMultiValue !== ink.hasMultiValue) {
        writeDataLayer(layer, 'wInk', ink.value);
        newState.wInk = ink;
      }

      if (wSpeed.value !== speed.value || wSpeed.hasMultiValue !== speed.hasMultiValue) {
        writeDataLayer(layer, 'wSpeed', speed.value);
        newState.wSpeed = speed;
      }

      if (wMultipass.value !== multipass.value || wMultipass.hasMultiValue !== multipass.hasMultiValue) {
        writeDataLayer(layer, 'wMultipass', multipass.value);
        newState.wMultipass = multipass;
      }

      if (wRepeat.value !== repeat.value || wRepeat.hasMultiValue !== repeat.hasMultiValue) {
        writeDataLayer(layer, 'wRepeat', repeat.value);
        newState.wRepeat = repeat;
      }
    });
    dispatch({ payload: newState, type: 'update' });
    onClose();
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
      title={t.white_ink_settings}
      width={290}
    >
      <div className={styles.container}>
        <WhiteInkSaturation
          hasMultiValue={ink.hasMultiValue}
          onChange={(val) => setInk({ hasMultiValue: false, value: val })}
          value={ink.value}
        />
        <WhiteInkSpeed
          hasMultiValue={speed.hasMultiValue}
          onChange={(val) => setSpeed({ hasMultiValue: false, value: val })}
          value={speed.value}
        />
        <WhiteInkMultipass
          hasMultiValue={multipass.hasMultiValue}
          onChange={(val) => setMultipass({ hasMultiValue: false, value: val })}
          value={multipass.value}
        />
        <WhiteInkRepeat
          hasMultiValue={repeat.hasMultiValue}
          onChange={(val) => setRepeat({ hasMultiValue: false, value: val })}
          value={repeat.value}
        />
      </div>
    </Modal>
  );
};

export default WhiteInkSettingsModal;
