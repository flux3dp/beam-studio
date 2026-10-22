import React, { useMemo } from 'react';

import { Switch } from 'antd';
import classNames from 'classnames';

import { getAddOnInfo } from '@core/app/constants/addOn';
import type { EngravingMode } from '@core/app/constants/innerEngraving';
import {
  DEFAULT_LAYER_SPACING,
  DEFAULT_POINT_SPACING,
  LAYER_SPACING_LIMIT,
  POINT_SPACING_LIMIT,
} from '@core/app/constants/innerEngraving';
import Select from '@core/app/widgets/AntdSelect';
import UnitInput from '@core/app/widgets/UnitInput';
import { isInnerEngravingActive } from '@core/helpers/addOn/innerEngraving';
import { getDefaultConfig, getPromarkLimit, isPromarkUV } from '@core/helpers/layer/layer-config-helper';
import { uvFrequencyToPower, uvPowerToFrequency } from '@core/helpers/layer/uvPowerFrequency';
import useI18n from '@core/helpers/useI18n';
import type { ConfigKey, ConfigKeyTypeMap, Preset } from '@core/interfaces/ILayerConfig';

import styles from './PresetsManagementPanel.module.scss';

interface Props {
  handleChange: <T extends ConfigKey>(key: T, value: ConfigKeyTypeMap[T] | null) => void;
  isInch?: boolean;
  lengthUnit?: 'in' | 'mm';
  maxSpeed: number;
  minSpeed: number;
  preset: Preset;
}

const PromarkInputs = ({
  handleChange,
  isInch = false,
  lengthUnit = 'mm',
  maxSpeed,
  minSpeed,
  preset,
}: Props): React.JSX.Element => {
  const {
    beambox: {
      right_panel: { laser_panel: tLaserPanel },
    },
    inner_engraving_settings: tInner,
  } = useI18n();
  const t = tLaserPanel.preset_management;
  const addOnInfo = useMemo(() => getAddOnInfo('fpm1'), []);
  const defaultConfig = useMemo(getDefaultConfig, []);
  const focusStepMax = useMemo(() => {
    if (!preset.repeat || preset.repeat <= 1) {
      return 10;
    }

    return 10 / (preset.repeat - 1);
  }, [preset.repeat]);
  const limit = useMemo(getPromarkLimit, []);
  // the dialog is modal, so neither can change while it is open
  const isUV = useMemo(isPromarkUV, []);
  const isInnerEngraving = useMemo(isInnerEngravingActive, []);

  // UV sets its output through the frequency and the power stands for it (uvPowerFrequency.ts): the
  // two are shown from one value and written together, as the config panel does. A preset may carry
  // either or both; the frequency wins, like applyPreset
  const uvFrequency = useMemo(() => {
    if (!isUV) return undefined;

    if (preset.frequency !== undefined) return preset.frequency;

    return preset.power === undefined ? defaultConfig.frequency! : uvPowerToFrequency(preset.power);
  }, [isUV, preset.frequency, preset.power, defaultConfig.frequency]);
  const power = isUV ? Math.round(uvFrequencyToPower(uvFrequency!) * 10) / 10 : (preset.power ?? defaultConfig.power);
  const powerLimit = (isUV && limit.power) || { max: 100, min: 0 };

  const handlePowerChange = (value: number) => {
    handleChange('power', value);

    if (isUV) handleChange('frequency', uvPowerToFrequency(value));
  };
  const handleFrequencyChange = (value: number) => {
    handleChange('frequency', value);

    if (isUV) handleChange('power', uvFrequencyToPower(value));
  };

  // inner engraving: the layer's mode decides which parameters apply (see getInnerEngravingBlocks)
  const stlMode: EngravingMode = preset.stlMode ?? defaultConfig.stlMode ?? 'dot';
  const stlSolid = preset.stlSolid ?? defaultConfig.stlSolid ?? false;
  const layerSpacing = preset.stlLayerSpacing ?? defaultConfig.stlLayerSpacing ?? DEFAULT_LAYER_SPACING;
  const showDot = isInnerEngraving && stlMode === 'dot';
  const showLine = isInnerEngraving && stlMode === 'line';

  return (
    <div className={styles.inputs}>
      <div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.strength}</div>
          <UnitInput
            addonAfter="%"
            className={styles.input}
            clipValue
            data-testid="power"
            disabled={preset.isDefault}
            max={powerLimit.max}
            min={powerLimit.min}
            onChange={(value) => handlePowerChange(value!)}
            precision={isUV ? 1 : 0}
            value={power}
          />
        </div>
        {/* a dot has no speed; in inner engraving only slice contours are travelled */}
        {!showDot && (
          <div className={styles.field}>
            <div className={styles.label}>{tLaserPanel.speed}</div>
            <UnitInput
              addonAfter={`${lengthUnit}/s`}
              className={styles.input}
              clipValue
              data-testid="speed"
              disabled={preset.isDefault}
              isInch={isInch}
              max={maxSpeed}
              min={minSpeed}
              onChange={(value) => handleChange('speed', value!)}
              precision={isInch ? 2 : 1}
              value={preset.speed ?? defaultConfig.speed}
            />
          </div>
        )}
        {limit.pulseWidth && (
          <div className={styles.field}>
            <div className={styles.label}>{tLaserPanel.pulse_width}</div>
            <UnitInput
              addonAfter="ns"
              className={styles.input}
              clipValue
              data-testid="pulseWidth"
              disabled={preset.isDefault}
              max={limit.pulseWidth.max}
              min={limit.pulseWidth.min}
              onChange={(value) => handleChange('pulseWidth', value!)}
              precision={0}
              value={preset.pulseWidth ?? defaultConfig.pulseWidth}
            />
          </div>
        )}
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.frequency}</div>
          <UnitInput
            addonAfter="kHz"
            className={styles.input}
            clipValue
            data-testid="frequency"
            disabled={preset.isDefault}
            max={limit.frequency!.max}
            min={limit.frequency!.min}
            onChange={(value) => handleFrequencyChange(value!)}
            precision={0}
            value={isUV ? uvFrequency : (preset.frequency ?? defaultConfig.frequency)}
          />
        </div>
        {/* an inner engraving layer always runs once, see writeDataLayer */}
        {!isInnerEngraving && (
          <div className={styles.field}>
            <div className={styles.label}>{tLaserPanel.repeat}</div>
            <UnitInput
              addonAfter={tLaserPanel.times}
              className={styles.input}
              clipValue
              data-testid="repeat"
              disabled={preset.isDefault}
              max={100}
              min={0}
              onChange={(value) => handleChange('repeat', value!)}
              precision={0}
              value={preset.repeat ?? defaultConfig.repeat}
            />
          </div>
        )}
        {isInnerEngraving && (
          <div className={styles.field}>
            <div className={styles.label}>{tInner.engraving_mode}</div>
            <Select
              className={styles.select}
              disabled={preset.isDefault}
              id="stlMode"
              onChange={(value: EngravingMode) => handleChange('stlMode', value)}
              options={[
                { label: tInner.mode_dot, value: 'dot' },
                { label: tInner.mode_line, value: 'line' },
              ]}
              value={stlMode}
            />
          </div>
        )}
        {!showLine && (
          <div className={styles.field}>
            <div className={styles.label}>{tLaserPanel.dottingTime}</div>
            <UnitInput
              addonAfter="us"
              className={styles.input}
              clipValue
              data-testid="dottingTime"
              disabled={preset.isDefault}
              max={10000}
              min={1}
              onChange={(value) => handleChange('dottingTime', value!)}
              precision={0}
              value={preset.dottingTime ?? defaultConfig.dottingTime}
            />
          </div>
        )}
        {showDot && (
          <>
            <div className={styles.field}>
              <div className={styles.label}>{tInner.point_spacing}</div>
              <UnitInput
                addonAfter="mm"
                className={styles.input}
                clipValue
                data-testid="stlPointSpacing"
                disabled={preset.isDefault}
                max={POINT_SPACING_LIMIT.max}
                min={POINT_SPACING_LIMIT.min}
                onChange={(value) => handleChange('stlPointSpacing', value!)}
                precision={3}
                step={0.001}
                value={preset.stlPointSpacing ?? defaultConfig.stlPointSpacing ?? DEFAULT_POINT_SPACING}
              />
            </div>
            <div className={classNames(styles.field, styles['with-switch'])}>
              <div className={styles.label}>{tInner.thick_contour}</div>
              <Switch
                checked={stlSolid}
                data-testid="stlSolid"
                disabled={preset.isDefault}
                onChange={(value) => handleChange('stlSolid', value)}
              />
            </div>
          </>
        )}
        {/* the Z step of line mode, the inward-shell step of thick contour dotting */}
        {(showLine || (showDot && stlSolid)) && (
          <div className={styles.field}>
            <div className={styles.label}>{tInner.layer_height}</div>
            <UnitInput
              addonAfter="mm"
              className={styles.input}
              clipValue
              data-testid="stlLayerSpacing"
              disabled={preset.isDefault}
              max={LAYER_SPACING_LIMIT.max}
              min={LAYER_SPACING_LIMIT.min}
              onChange={(value) => handleChange('stlLayerSpacing', value!)}
              precision={3}
              step={0.001}
              value={layerSpacing}
            />
          </div>
        )}
        {/* > 0 turns adaptive spacing on, down to this value; 0 is off (AdvancedSettingModal) */}
        {showLine && (
          <div className={styles.field}>
            <div className={styles.label}>{tInner.min_layer_height}</div>
            <UnitInput
              addonAfter="mm"
              className={styles.input}
              clipValue
              data-testid="stlMinLayerSpacing"
              disabled={preset.isDefault}
              max={Math.max(LAYER_SPACING_LIMIT.min, layerSpacing - LAYER_SPACING_LIMIT.min)}
              min={0}
              onChange={(value) => handleChange('stlMinLayerSpacing', value ?? 0)}
              precision={3}
              step={0.001}
              value={preset.stlMinLayerSpacing ?? defaultConfig.stlMinLayerSpacing ?? 0}
            />
          </div>
        )}
        {addOnInfo.lowerFocus && (
          <>
            <div className={styles.field}>
              <div className={styles.label}>{t.lower_focus_by}</div>
              <UnitInput
                addonAfter={lengthUnit}
                className={styles.input}
                clipValue
                data-testid="focus"
                disabled={preset.isDefault}
                isInch={isInch}
                max={10}
                min={0}
                onChange={(value) => handleChange('focus', value && value > 0 ? value : -0.01)}
                precision={2}
                value={Math.max(preset.focus ?? defaultConfig.focus!, 0)}
              />
            </div>
            <div className={styles.field}>
              <div className={styles.label}>{tLaserPanel.z_step}</div>
              <UnitInput
                addonAfter={lengthUnit}
                className={styles.input}
                clipValue
                data-testid="focusStep"
                disabled={preset.isDefault || !preset.repeat || preset.repeat <= 1}
                isInch={isInch}
                max={focusStepMax}
                min={0}
                onChange={(value) => handleChange('focusStep', value && value > 0 ? value : -0.01)}
                precision={2}
                value={Math.max(preset.focusStep ?? defaultConfig.focusStep!, 0)}
              />
            </div>
          </>
        )}
      </div>
      {/* only paths are filled or wobbled, and an inner engraving layer holds none */}
      {!isInnerEngraving && (
        <div>
          <div className={styles.field}>
            <div className={styles.label}>{t.wobble_step}</div>
            <UnitInput
              addonAfter="mm"
              className={styles.input}
              clipValue
              data-testid="wobbleStep"
              disabled={preset.isDefault}
              max={1}
              min={0}
              onChange={(value) => handleChange('wobbleStep', value && value > 0 ? value : -0.05)}
              precision={2}
              step={0.01}
              value={Math.max(preset.wobbleStep ?? defaultConfig.wobbleStep!, 0)}
            />
          </div>
          <div className={styles.field}>
            <div className={styles.label}>{t.wobble_diameter}</div>
            <UnitInput
              addonAfter="mm"
              className={styles.input}
              clipValue
              data-testid="wobbleDiameter"
              disabled={preset.isDefault}
              max={1}
              min={0}
              onChange={(value) => handleChange('wobbleDiameter', value && value > 0 ? value : -0.2)}
              precision={1}
              step={0.1}
              value={Math.max(preset.wobbleDiameter ?? defaultConfig.wobbleDiameter!, 0)}
            />
          </div>
          <div className={styles.field}>
            <div className={styles.label}>{tLaserPanel.fill_interval}</div>
            <UnitInput
              addonAfter="mm"
              className={styles.input}
              clipValue
              controls={false}
              data-testid="fillInterval"
              disabled={preset.isDefault}
              max={100}
              min={0.0001}
              onChange={(value) => handleChange('fillInterval', value!)}
              precision={4}
              step={0.0001}
              value={preset.fillInterval ?? defaultConfig.fillInterval}
            />
          </div>
          <div className={styles.field}>
            <div className={styles.label}>{tLaserPanel.fill_angle}</div>
            <UnitInput
              addonAfter="deg"
              className={styles.input}
              clipValue
              data-testid="fillAngle"
              disabled={preset.isDefault}
              max={360}
              min={-360}
              onChange={(value) => handleChange('fillAngle', value!)}
              precision={1}
              value={preset.fillAngle ?? defaultConfig.fillAngle}
            />
          </div>
          <div className={classNames(styles.field, styles['with-switch'])}>
            <div className={styles.label}>{tLaserPanel.bi_directional}</div>
            <Switch
              checked={preset.biDirectional ?? defaultConfig.biDirectional}
              data-testid="biDirectional"
              onChange={(value) => handleChange('biDirectional', value)}
            />
          </div>
          <div className={classNames(styles.field, styles['with-switch'])}>
            <div className={styles.label}>{tLaserPanel.cross_hatch}</div>
            <Switch
              checked={preset.crossHatch ?? defaultConfig.crossHatch}
              data-testid="crossHatch"
              onChange={(value) => handleChange('crossHatch', value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PromarkInputs;
