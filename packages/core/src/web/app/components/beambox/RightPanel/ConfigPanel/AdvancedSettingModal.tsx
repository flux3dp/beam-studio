import React, { useMemo, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Modal, Switch, Tooltip } from 'antd';

import { useConfigPanelStore } from '@core/app/stores/configPanel';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import isDev from '@core/helpers/is-dev';
import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigKey, ConfigKeyTypeMap } from '@core/interfaces/ILayerConfig';

import styles from './AdvancedSettingModal.module.scss';
import initState from './initState';
import Input from './Input';

interface Props {
  onClose: () => void;
}

const AdvancedSettingModal = ({ onClose }: Props): React.JSX.Element => {
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
    focus: state.focus,
    focusStep: state.focusStep,
    wobbleDiameter: state.wobbleDiameter,
    wobbleStep: state.wobbleStep,
  });
  const isDevMode = useMemo(() => isDev(), []);
  const repeat = state.repeat.value;

  const handleSave = () => {
    const keys = [
      'fillAngle',
      'biDirectional',
      'crossHatch',
      'wobbleStep',
      'wobbleDiameter',
      'focus',
      'focusStep',
    ] as const;

    const batchCmd = new history.BatchCommand('Change advanced setting');

    layerManager.getSelectedLayers().forEach((layerName) => {
      const layer = getLayerByName(layerName)!;

      keys.forEach((key) => {
        if (state[key].value !== draftValue[key].value || state[key].hasMultiValue !== draftValue[key].hasMultiValue) {
          writeDataLayer(layer, key, draftValue[key].value, { batchCmd });
        }
      });
    });

    if (!batchCmd.isEmpty()) {
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }

    update(draftValue);
    eventEmitterFactory.createEventEmitter('time-estimation-button').emit('SET_ESTIMATED_TIME', null);
    onClose();
  };

  const handleValueChange = <T extends ConfigKey>(key: T, value: ConfigKeyTypeMap[T]) => {
    setDraftValue((cur) => ({ ...cur, [key]: { hasMultiValue: false, value } }));
  };

  // lower focus / stepwise focusing on/off are encoded by the sign of focus/focusStep
  const focusOn = draftValue.focus.value > 0;
  const focusStepOn = draftValue.focusStep.value > 0;
  const setLowerFocus = (on: boolean) => {
    handleValueChange('focus', Math.abs(draftValue.focus.value) * (on ? 1 : -1));
  };
  const setFocusStep = (on: boolean) => {
    handleValueChange('focusStep', Math.abs(draftValue.focusStep.value) * (on ? 1 : -1));
  };

  // wobble on/off is encoded by the sign of wobbleStep/wobbleDiameter
  const wobbleOn = draftValue.wobbleStep.value > 0 && draftValue.wobbleDiameter.value > 0;
  const setWobble = (on: boolean) => {
    const sign = on ? 1 : -1;

    setDraftValue({
      ...draftValue,
      wobbleDiameter: { hasMultiValue: false, value: Math.abs(draftValue.wobbleDiameter.value) * sign },
      wobbleStep: { hasMultiValue: false, value: Math.abs(draftValue.wobbleStep.value) * sign },
    });
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
      title={t.advanced}
      width={350}
    >
      <div className={styles.container}>
        <div>
          <span>
            <label htmlFor="lower-focus">{t.lower_focus}</label>
            <Tooltip title={t.lower_focus_desc}>
              <QuestionCircleOutlined className={styles.hint} />
            </Tooltip>
          </span>
          <Switch checked={focusOn} id="lower-focus" onChange={setLowerFocus} />
        </div>
        {focusOn && (
          <div>
            <span>{t.by}</span>
            <Input
              hasMultiValue={draftValue.focus.hasMultiValue}
              id="focus-adjustment"
              isInch={false}
              max={isDevMode ? 40 : 10}
              min={0.01}
              onChange={(value) => handleValueChange('focus', value)}
              precision={2}
              unit="mm"
              value={draftValue.focus.value}
            />
          </div>
        )}
        {repeat > 1 && (
          <>
            <div>
              <span>
                <label htmlFor="focus-step-toggle">{t.stepwise_focusing}</label>
                <Tooltip title={t.stepwise_focusing_desc}>
                  <QuestionCircleOutlined className={styles.hint} />
                </Tooltip>
              </span>
              <Switch checked={focusStepOn} id="focus-step-toggle" onChange={setFocusStep} />
            </div>
            {focusStepOn && (
              <div>
                <span>{t.z_step}</span>
                <Input
                  hasMultiValue={draftValue.focusStep.hasMultiValue}
                  id="focus-step"
                  isInch={false}
                  max={isDevMode ? 40 : 10 / (repeat - 1)}
                  min={0.01}
                  onChange={(value) => handleValueChange('focusStep', value)}
                  precision={2}
                  unit="mm"
                  value={draftValue.focusStep.value}
                />
              </div>
            )}
          </>
        )}
        <div>
          <span>
            <label htmlFor="wobble">{t.wobble}</label>
            <Tooltip title={t.wobble_desc}>
              <QuestionCircleOutlined className={styles.hint} />
            </Tooltip>
          </span>
          <Switch checked={wobbleOn} id="wobble" onChange={setWobble} />
        </div>
        {wobbleOn && (
          <>
            <div>
              <span>{t.wobble_step}</span>
              <Input
                hasMultiValue={draftValue.wobbleStep.hasMultiValue}
                id="wobbleStep"
                isInch={false}
                max={1}
                min={0.01}
                onChange={(value) => handleValueChange('wobbleStep', value)}
                precision={2}
                step={0.01}
                unit="mm"
                value={draftValue.wobbleStep.value}
              />
            </div>
            <div>
              <span>{t.wobble_diameter}</span>
              <Input
                hasMultiValue={draftValue.wobbleDiameter.hasMultiValue}
                id="wobbleDiameter"
                isInch={false}
                max={1}
                min={0.1}
                onChange={(value) => handleValueChange('wobbleDiameter', value)}
                precision={1}
                step={0.1}
                unit="mm"
                value={draftValue.wobbleDiameter.value}
              />
            </div>
          </>
        )}
        <div className={styles.subtitle}>{t.fill_setting}</div>
        <div className={styles.hint}>{t.filled_path_only}</div>
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
        <div>
          <label htmlFor="biDirectional">{t.bi_directional}</label>
          <Switch
            checked={draftValue.biDirectional.value}
            id="biDirectional"
            onChange={(value) => handleValueChange('biDirectional', value)}
          />
        </div>
        <div>
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

export default AdvancedSettingModal;
