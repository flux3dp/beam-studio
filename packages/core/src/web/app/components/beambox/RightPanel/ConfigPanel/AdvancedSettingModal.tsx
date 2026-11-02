import React, { useMemo, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Modal, Switch, Tooltip } from 'antd';

import { DEFAULT_LAYER_SPACING, LAYER_SPACING_LIMIT } from '@core/app/constants/innerEngraving';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { useInnerEngravingActive } from '@core/helpers/addOn/innerEngraving';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import isDev from '@core/helpers/is-dev';
import { CUSTOM_PRESET_CONSTANT, getPromarkLimit, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getLayerByName } from '@core/helpers/layer/layer-helper';
import { uvFrequencyToPower } from '@core/helpers/layer/uvPowerFrequency';
import useI18n from '@core/helpers/useI18n';
import type { ConfigKey, ConfigKeyTypeMap } from '@core/interfaces/ILayerConfig';

import styles from './AdvancedSettingModal.module.scss';
import getInnerEngravingBlocks from './getInnerEngravingBlocks';
import initState from './initState';
import Input from './Input';
import { useIsPromarkUV } from './usePromarkLimit';

interface Props {
  onClose: () => void;
}

const AdvancedSettingModal = ({ onClose }: Props): React.JSX.Element => {
  const {
    beambox: {
      right_panel: { laser_panel: t },
    },
    global: tGlobal,
    inner_engraving_settings: tInnerEngraving,
  } = useI18n();
  const { getState, update } = useConfigPanelStore();
  const state = getState();
  const isInnerEngraving = useInnerEngravingActive();
  const [draftValue, setDraftValue] = useState({
    biDirectional: state.biDirectional,
    crossHatch: state.crossHatch,
    fillAngle: state.fillAngle,
    fillDwellAdaptive: state.fillDwellAdaptive,
    fillDwellTime: state.fillDwellTime,
    fillInterleave: state.fillInterleave,
    focus: state.focus,
    focusReverse: state.focusReverse,
    focusStep: state.focusStep,
    focusStepReverse: state.focusStepReverse,
    frequency: state.frequency,
    // absent outside inner engraving, where they are neither shown nor saved
    ...(isInnerEngraving && { stlMinLayerSpacing: state.stlMinLayerSpacing }),
    wobbleDiameter: state.wobbleDiameter,
    wobbleStep: state.wobbleStep,
  });
  const isDevMode = useMemo(() => isDev(), []);
  // inner engraving: adaptive spacing is a line-mode option (solid sits in the panel itself); there
  // are no filled paths and no wobble
  const { line: showAdaptiveSpacing } = getInnerEngravingBlocks(state, {
    hasStlPhoto: false,
    isInnerEngraving: isInnerEngraving && state.stlMode !== undefined,
  });
  const layerSpacing = state.stlLayerSpacing?.value ?? DEFAULT_LAYER_SPACING;
  // UV sets its power through the frequency, so the frequency lives here instead of the main panel
  const isPromarkUV = useIsPromarkUV();
  const frequencyLimit = useMemo(() => getPromarkLimit().frequency, []);
  const repeat = state.repeat.value;

  const handleSave = () => {
    const keys = [
      'fillAngle',
      'biDirectional',
      'crossHatch',
      'fillInterleave',
      'fillDwellTime',
      'fillDwellAdaptive',
      'wobbleStep',
      'wobbleDiameter',
      'focus',
      'focusReverse',
      'focusStep',
      'focusStepReverse',
      ...(isInnerEngraving ? (['stlMinLayerSpacing'] as const) : []),
    ] as const;

    const batchCmd = new history.BatchCommand('Change advanced setting');
    const frequencyChanged =
      isPromarkUV &&
      (state.frequency.value !== draftValue.frequency.value ||
        state.frequency.hasMultiValue !== draftValue.frequency.hasMultiValue);
    const linkedPower = frequencyChanged ? uvFrequencyToPower(draftValue.frequency.value) : 0;

    layerManager.getSelectedLayers().forEach((layerName) => {
      const layer = getLayerByName(layerName)!;

      keys.forEach((key) => {
        const draft = draftValue[key];

        if (!draft) return;

        if (state[key].value !== draft.value || state[key].hasMultiValue !== draft.hasMultiValue) {
          writeDataLayer(layer, key, draft.value, { batchCmd });
        }
      });

      if (frequencyChanged) {
        writeDataLayer(layer, 'frequency', draftValue.frequency.value, { batchCmd });
        writeDataLayer(layer, 'power', linkedPower, { batchCmd });
        writeDataLayer(layer, 'configName', CUSTOM_PRESET_CONSTANT, { batchCmd });
      }
    });

    if (!batchCmd.isEmpty()) {
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }

    update(
      frequencyChanged
        ? {
            ...draftValue,
            configName: { hasMultiValue: false, value: CUSTOM_PRESET_CONSTANT },
            power: { hasMultiValue: false, value: linkedPower },
          }
        : draftValue,
    );
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

  // the fill pause is off while fillDwellTime is negative, which keeps the last used duration
  const fillDwellOn = draftValue.fillDwellTime.value > 0;
  const setFillDwell = (on: boolean) => {
    handleValueChange('fillDwellTime', Math.abs(draftValue.fillDwellTime.value) * (on ? 1 : -1));
  };

  // adaptive spacing is on while the minimum spacing is positive, starting at half the layer spacing
  const adaptiveSpacingOn = (draftValue.stlMinLayerSpacing?.value ?? 0) > 0;
  const setAdaptiveSpacing = (on: boolean) => {
    handleValueChange(
      'stlMinLayerSpacing',
      on ? Math.max(LAYER_SPACING_LIMIT.min, Math.round((layerSpacing / 2) * 1000) / 1000) : 0,
    );
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
        {isPromarkUV && frequencyLimit && (
          <div>
            <span>
              <label htmlFor="frequency">{t.frequency}</label>
              <Tooltip title={t.frequency_hint_uv}>
                <QuestionCircleOutlined className={styles.hint} />
              </Tooltip>
            </span>
            <Input
              hasMultiValue={draftValue.frequency.hasMultiValue}
              id="frequency"
              isInch={false}
              max={frequencyLimit.max}
              min={frequencyLimit.min}
              onChange={(value) => handleValueChange('frequency', value)}
              precision={0}
              unit="kHz"
              value={draftValue.frequency.value}
            />
          </div>
        )}
        <div>
          <span>
            <label htmlFor="lower-focus">{t.lower_focus}</label>
            <Tooltip title={t.lower_focus_desc}>
              <QuestionCircleOutlined className={styles.hint} />
            </Tooltip>
          </span>
          <Switch checked={focusOn} id="lower-focus" onChange={setLowerFocus} />
        </div>
        {isDevMode && focusOn && (
          <div>
            <label htmlFor="lower-focus-rev">{t.reverse}</label>
            <Switch
              checked={draftValue.focusReverse.value}
              className={styles.switch}
              id="lower-focus-rev"
              onChange={() => handleValueChange('focusReverse', !draftValue.focusReverse.value)}
              size="small"
            />
          </div>
        )}
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
            {isDevMode && focusStepOn && (
              <div>
                <label htmlFor="focus-step-rev">{t.reverse}</label>
                <Switch
                  checked={draftValue.focusStepReverse.value}
                  className={styles.switch}
                  id="focus-step-rev"
                  onChange={() => handleValueChange('focusStepReverse', !draftValue.focusStepReverse.value)}
                  size="small"
                />
              </div>
            )}
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
        {showAdaptiveSpacing && (
          <>
            <div>
              <span>
                <label htmlFor="stlAdaptiveSpacing">{tInnerEngraving.adaptive_layer_height}</label>
                <Tooltip title={tInnerEngraving.adaptive_layer_height_hint}>
                  <QuestionCircleOutlined className={styles.hint} />
                </Tooltip>
              </span>
              <Switch
                checked={adaptiveSpacingOn}
                disabled={layerSpacing <= LAYER_SPACING_LIMIT.min}
                id="stlAdaptiveSpacing"
                onChange={setAdaptiveSpacing}
              />
            </div>
            {adaptiveSpacingOn && (
              <div>
                <span>{tInnerEngraving.min_layer_height}</span>
                <Input
                  hasMultiValue={draftValue.stlMinLayerSpacing?.hasMultiValue}
                  id="stlMinLayerSpacing"
                  isInch={false}
                  max={Math.max(LAYER_SPACING_LIMIT.min, layerSpacing - LAYER_SPACING_LIMIT.min)}
                  min={LAYER_SPACING_LIMIT.min}
                  onChange={(value) => handleValueChange('stlMinLayerSpacing', value)}
                  precision={3}
                  unit="mm"
                  value={draftValue.stlMinLayerSpacing?.value ?? 0}
                />
              </div>
            )}
          </>
        )}
        {!isInnerEngraving && (
          <>
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
            {isPromarkUV && (
              <>
                <div>
                  <span>
                    <label htmlFor="fillInterleave">{t.fill_interleave}</label>
                    <Tooltip title={t.fill_interleave_hint}>
                      <QuestionCircleOutlined className={styles.hint} />
                    </Tooltip>
                  </span>
                  <Switch
                    checked={draftValue.fillInterleave.value}
                    id="fillInterleave"
                    onChange={(value) => handleValueChange('fillInterleave', value)}
                  />
                </div>
                <div>
                  <span>
                    <label htmlFor="fillDwell">{t.fill_dwell}</label>
                    <Tooltip title={t.fill_dwell_hint}>
                      <QuestionCircleOutlined className={styles.hint} />
                    </Tooltip>
                  </span>
                  <Switch checked={fillDwellOn} id="fillDwell" onChange={setFillDwell} />
                </div>
                {fillDwellOn && (
                  <>
                    <div>
                      <span>{t.fill_dwell_time}</span>
                      <Input
                        hasMultiValue={draftValue.fillDwellTime.hasMultiValue}
                        id="fillDwellTime"
                        isInch={false}
                        max={1000000}
                        min={1}
                        onChange={(value) => handleValueChange('fillDwellTime', value)}
                        precision={0}
                        step={1000}
                        unit="us"
                        value={draftValue.fillDwellTime.value}
                      />
                    </div>
                    <div>
                      <span>
                        <label htmlFor="fillDwellAdaptive">{t.fill_dwell_adaptive}</label>
                        <Tooltip title={t.fill_dwell_adaptive_hint}>
                          <QuestionCircleOutlined className={styles.hint} />
                        </Tooltip>
                      </span>
                      <Switch
                        checked={draftValue.fillDwellAdaptive.value}
                        className={styles.switch}
                        id="fillDwellAdaptive"
                        onChange={(value) => handleValueChange('fillDwellAdaptive', value)}
                        size="small"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default AdvancedSettingModal;
