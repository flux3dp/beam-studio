import React, { useCallback, useEffect, useState } from 'react';

import { ConfigProvider, InputNumber, Modal, Slider } from 'antd';

import { ConfigModalBlock } from '@core/app/constants/antd-config';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigItem } from '@core/interfaces/ILayerConfig';

import styles from './AdvancedPowerPanel.module.scss';
import initState from './initState';

interface Props {
  onClose: () => void;
}

// TODO: add test
const AdvancedPowerPanel = ({ onClose }: Props): React.JSX.Element => {
  const {
    beambox: {
      right_panel: { laser_panel: t },
    },
    global: tGlobal,
  } = useI18n();

  const { getState, update } = useConfigPanelStore();
  const state = getState();

  const [draftValue, setDraftValue] = useState<{ minPower: ConfigItem<number> }>({
    minPower: state.minPower,
  });
  const [displayValue, setDisplayValue] = useState(draftValue);

  useEffect(() => setDisplayValue(draftValue), [draftValue]);

  const power = state.power.value;
  const handleSave = () => {
    const newState = { ...state };
    const batchCmd = new history.BatchCommand('Change power advanced setting');

    useLayerStore.getState().selectedLayers.forEach((layerName) => {
      const layer = getLayerByName(layerName)!;

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
    update(newState);
    onClose();
  };
  const handleValueChange = useCallback((key: string, value: number, display = false) => {
    if (display) {
      setDisplayValue((cur) => ({ ...cur, [key]: { hasMultiValue: false, value } }));
    } else {
      setDraftValue((cur) => ({ ...cur, [key]: { hasMultiValue: false, value } }));
    }
  }, []);

  return (
    <Modal
      cancelText={tGlobal.cancel}
      centered
      maskClosable={false}
      okText={tGlobal.save}
      onCancel={onClose}
      onOk={handleSave}
      open
      title={t.pwm_advanced_setting}
      width={320}
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
                controls={false}
                max={power}
                min={0}
                onChange={(val) => {
                  if (val === null) return;

                  handleValueChange('minPower', val);
                }}
                precision={0}
                size="small"
                value={draftValue.minPower.value}
              />
              <span className={styles.unit}>%</span>
            </span>
            <span className={styles.input}>
              <InputNumber controls={false} disabled max={power} min={0} precision={0} size="small" value={power} />
              <span className={styles.unit}>%</span>
            </span>
          </div>
          <Slider
            className={styles['one-side-slider']}
            max={power}
            min={0}
            onAfterChange={(values) => handleValueChange('minPower', values[0])}
            onChange={(values) => handleValueChange('minPower', values[0], true)}
            range
            step={1}
            tooltip={{
              formatter: (v?: number) => `${v}%`,
            }}
            value={[displayValue.minPower.value, power]}
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
