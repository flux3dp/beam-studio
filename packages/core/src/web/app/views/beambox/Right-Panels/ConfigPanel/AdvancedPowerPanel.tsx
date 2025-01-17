import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ConfigProvider, Modal, InputNumber, Slider } from 'antd';

import history from 'app/svgedit/history/history';
import undoManager from 'app/svgedit/history/undoManager';
import useI18n from 'helpers/useI18n';
import { ConfigModalBlock } from 'app/constants/antd-config';
import { ConfigItem } from 'interfaces/ILayerConfig';
import { getLayerByName } from 'helpers/layer/layer-helper';
import { writeDataLayer } from 'helpers/layer/layer-config-helper';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './AdvancedPowerPanel.module.scss';

interface Props {
  onClose: () => void;
}

// TODO: add test
const AdvancedPowerPanel = ({ onClose }: Props): JSX.Element => {
  const {
    global: tGlobal,
    beambox: {
      right_panel: { laser_panel: t },
    },
  } = useI18n();
  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const [draftValue, setDraftValue] = useState<{ minPower: ConfigItem<number> }>({
    minPower: state.minPower,
  });
  const [displayValue, setDisplayValue] = useState(draftValue);
  useEffect(() => setDisplayValue(draftValue), [draftValue]);

  const power = state.power.value;
  const handleSave = () => {
    const newState = { ...state };
    const batchCmd = new history.BatchCommand('Change power advanced setting');
    selectedLayers.forEach((layerName) => {
      const layer = getLayerByName(layerName);
      if (
        state.minPower.value !== draftValue.minPower.value ||
        state.minPower.hasMultiValue !== draftValue.minPower.hasMultiValue
      ) {
        writeDataLayer(layer, 'minPower', draftValue.minPower.value, { batchCmd });
        newState.minPower = draftValue.minPower;
      }
    });
    batchCmd.onAfter = initState;
    undoManager.addCommandToHistory(batchCmd);
    dispatch({ type: 'update', payload: newState });
    onClose();
  };
  const handleValueChange = useCallback((key: string, value: number, display = false) => {
    if (display) setDisplayValue((cur) => ({ ...cur, [key]: { value, hasMultiValue: false } }));
    else setDraftValue((cur) => ({ ...cur, [key]: { value, hasMultiValue: false } }));
  }, []);
  return (
    <Modal
      centered
      open
      maskClosable={false}
      width={320}
      onOk={handleSave}
      onCancel={onClose}
      cancelText={tGlobal.cancel}
      okText={tGlobal.save}
      title={t.pwm_advanced_setting}
    >
      <ConfigProvider theme={ConfigModalBlock}>
        <div className={styles.desc}>
          {t.pwm_advanced_desc}
          <div className={styles.gray}>{t.pwm_advanced_hint}</div>
        </div>
        <div className={styles.block}>
          <div className={styles.header}>
            <span className={styles.input}>
              <InputNumber
                size="small"
                value={draftValue.minPower.value}
                controls={false}
                min={0}
                max={power}
                precision={0}
                onChange={(val) => handleValueChange('minPower', val)}
              />
              <span className={styles.unit}>%</span>
            </span>
            <span className={styles.input}>
              <InputNumber
                disabled
                size="small"
                value={power}
                controls={false}
                min={0}
                max={power}
                precision={0}
              />
              <span className={styles.unit}>%</span>
            </span>
          </div>
          <Slider
            className={styles['one-side-slider']}
            min={0}
            max={power}
            step={1}
            range
            value={[displayValue.minPower.value, power]}
            onAfterChange={(values) => handleValueChange('minPower', values[0])}
            onChange={(values) => handleValueChange('minPower', values[0], true)}
            tooltip={{
              formatter: (v: number) => `${v}%`,
            }}
          />
          <div className={styles.footer}>
            <span>Min</span>
            <span>Max</span>
          </div>
        </div>
      </ConfigProvider>
    </Modal>
  );
};

export default AdvancedPowerPanel;
