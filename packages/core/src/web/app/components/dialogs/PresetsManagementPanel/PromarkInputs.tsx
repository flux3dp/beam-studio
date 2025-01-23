import React, { useMemo } from 'react';

import { Switch } from 'antd';
import classNames from 'classnames';

import { getSupportInfo } from '@core/app/constants/add-on';
import UnitInput from '@core/app/widgets/UnitInput';
import { getDefaultConfig, getPromarkLimit } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigKey, ConfigKeyTypeMap, Preset } from '@core/interfaces/ILayerConfig';

import styles from './PresetsManagementPanel.module.scss';

interface Props {
  handleChange: <T extends ConfigKey>(key: T, value: ConfigKeyTypeMap[T]) => void;
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
  const tLaserPanel = useI18n().beambox.right_panel.laser_panel;
  const t = tLaserPanel.preset_management;
  const supportInfo = useMemo(() => getSupportInfo('fpm1'), []);
  const defaultConfig = useMemo(getDefaultConfig, []);
  const focusStepMax = useMemo(() => {
    if (preset.repeat <= 1) {
      return 10;
    }

    return 10 / (preset.repeat - 1);
  }, [preset.repeat]);
  const limit = useMemo(getPromarkLimit, []);

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
            max={100}
            min={0}
            onChange={(value) => handleChange('power', value)}
            precision={0}
            value={preset.power ?? defaultConfig.power}
          />
        </div>
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
            onChange={(value) => handleChange('speed', value)}
            precision={isInch ? 2 : 1}
            value={preset.speed ?? defaultConfig.speed}
          />
        </div>
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
              onChange={(value) => handleChange('pulseWidth', value)}
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
            max={limit.frequency.max}
            min={limit.frequency.min}
            onChange={(value) => handleChange('frequency', value)}
            precision={0}
            value={preset.frequency ?? defaultConfig.frequency}
          />
        </div>
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
            onChange={(value) => handleChange('repeat', value)}
            precision={0}
            value={preset.repeat ?? defaultConfig.repeat}
          />
        </div>
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
            onChange={(value) => handleChange('dottingTime', value)}
            precision={0}
            value={preset.dottingTime ?? defaultConfig.dottingTime}
          />
        </div>
        {supportInfo.lowerFocus && (
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
                onChange={(value) => handleChange('focus', value > 0 ? value : -0.01)}
                precision={2}
                value={Math.max(preset.focus ?? defaultConfig.focus, 0)}
              />
            </div>
            <div className={styles.field}>
              <div className={styles.label}>{tLaserPanel.z_step}</div>
              <UnitInput
                addonAfter={lengthUnit}
                className={styles.input}
                clipValue
                data-testid="focusStep"
                disabled={preset.isDefault || preset.repeat <= 1}
                isInch={isInch}
                max={focusStepMax}
                min={0}
                onChange={(value) => handleChange('focusStep', value > 0 ? value : -0.01)}
                precision={2}
                value={Math.max(preset.focusStep ?? defaultConfig.focusStep, 0)}
              />
            </div>
          </>
        )}
      </div>
      <div>
        <div className={styles.field}>
          <div className={styles.label}>{t.wobble_step}</div>
          <UnitInput
            addonAfter="mm"
            className={styles.input}
            clipValue
            data-testid="wobbleStep"
            disabled={preset.isDefault}
            max={10}
            min={0}
            onChange={(value) => handleChange('wobbleStep', value > 0 ? value : -0.05)}
            precision={3}
            step={0.001}
            value={Math.max(preset.wobbleStep ?? defaultConfig.wobbleStep, 0)}
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
            max={10}
            min={0}
            onChange={(value) => handleChange('wobbleDiameter', value > 0 ? value : -0.1)}
            precision={2}
            step={0.01}
            value={Math.max(preset.wobbleDiameter ?? defaultConfig.wobbleDiameter, 0)}
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
            onChange={(value) => handleChange('fillInterval', value)}
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
            onChange={(value) => handleChange('fillAngle', value)}
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
    </div>
  );
};

export default PromarkInputs;
