import classNames from 'classnames';
import React, { useMemo } from 'react';
import { Switch } from 'antd';

import UnitInput from 'app/widgets/UnitInput';
import useI18n from 'helpers/useI18n';
import { ConfigKey, ConfigKeyTypeMap, Preset } from 'interfaces/ILayerConfig';
import { getDefaultConfig, getPromarkLimit } from 'helpers/layer/layer-config-helper';
import { getSupportInfo } from 'app/constants/add-on';

import styles from './PresetsManagementPanel.module.scss';

interface Props {
  preset: Preset;
  maxSpeed: number;
  minSpeed: number;
  isInch?: boolean;
  lengthUnit?: 'mm' | 'in';
  handleChange: <T extends ConfigKey>(key: T, value: ConfigKeyTypeMap[T]) => void;
}

const PromarkInputs = ({
  preset,
  maxSpeed,
  minSpeed,
  isInch = false,
  lengthUnit = 'mm',
  handleChange,
}: Props): JSX.Element => {
  const tLaserPanel = useI18n().beambox.right_panel.laser_panel;
  const t = tLaserPanel.preset_management;
  const supportInfo = useMemo(() => getSupportInfo('fpm1'), []);
  const defaultConfig = useMemo(getDefaultConfig, []);
  const focusStepMax = useMemo(() => {
    if (preset.repeat <= 1) return 10;
    return 10 / (preset.repeat - 1);
  }, [preset.repeat]);
  const limit = useMemo(getPromarkLimit, []);

  return (
    <div className={styles.inputs}>
      <div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.strength}</div>
          <UnitInput
            data-testid="power"
            className={styles.input}
            disabled={preset.isDefault}
            value={preset.power ?? defaultConfig.power}
            max={100}
            min={0}
            precision={0}
            addonAfter="%"
            onChange={(value) => handleChange('power', value)}
            clipValue
          />
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.speed}</div>
          <UnitInput
            data-testid="speed"
            className={styles.input}
            disabled={preset.isDefault}
            value={preset.speed ?? defaultConfig.speed}
            max={maxSpeed}
            min={minSpeed}
            precision={isInch ? 2 : 1}
            addonAfter={`${lengthUnit}/s`}
            isInch={isInch}
            onChange={(value) => handleChange('speed', value)}
            clipValue
          />
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.repeat}</div>
          <UnitInput
            data-testid="repeat"
            className={styles.input}
            disabled={preset.isDefault}
            value={preset.repeat ?? defaultConfig.repeat}
            max={100}
            min={0}
            precision={0}
            addonAfter={tLaserPanel.times}
            onChange={(value) => handleChange('repeat', value)}
            clipValue
          />
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.dottingTime}</div>
          <UnitInput
            data-testid="dottingTime"
            className={styles.input}
            disabled={preset.isDefault}
            value={preset.dottingTime ?? defaultConfig.dottingTime}
            min={1}
            max={10000}
            precision={0}
            addonAfter="us"
            onChange={(value) => handleChange('dottingTime', value)}
            clipValue
          />
        </div>
        {supportInfo.lowerFocus && (
          <>
            <div className={styles.field}>
              <div className={styles.label}>{t.lower_focus_by}</div>
              <UnitInput
                data-testid="focus"
                className={styles.input}
                disabled={preset.isDefault}
                value={Math.max(preset.focus ?? defaultConfig.focus, 0)}
                max={10}
                min={0}
                precision={2}
                addonAfter={lengthUnit}
                isInch={isInch}
                onChange={(value) => handleChange('focus', value > 0 ? value : -0.01)}
                clipValue
              />
            </div>
            <div className={styles.field}>
              <div className={styles.label}>{tLaserPanel.z_step}</div>
              <UnitInput
                data-testid="focusStep"
                className={styles.input}
                disabled={preset.isDefault || preset.repeat <= 1}
                value={Math.max(preset.focusStep ?? defaultConfig.focusStep, 0)}
                max={focusStepMax}
                min={0}
                precision={2}
                addonAfter={lengthUnit}
                isInch={isInch}
                onChange={(value) => handleChange('focusStep', value > 0 ? value : -0.01)}
                clipValue
              />
            </div>
          </>
        )}
      </div>
      <div>
        {limit.pulseWidth && (
          <div className={styles.field}>
            <div className={styles.label}>{tLaserPanel.pulse_width}</div>
            <UnitInput
              data-testid="pulseWidth"
              className={styles.input}
              disabled={preset.isDefault}
              value={preset.pulseWidth ?? defaultConfig.pulseWidth}
              max={limit.pulseWidth.max}
              min={limit.pulseWidth.min}
              precision={0}
              addonAfter="ns"
              onChange={(value) => handleChange('pulseWidth', value)}
              clipValue
            />
          </div>
        )}
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.frequency}</div>
          <UnitInput
            data-testid="frequency"
            className={styles.input}
            disabled={preset.isDefault}
            value={preset.frequency ?? defaultConfig.frequency}
            max={limit.frequency.max}
            min={limit.frequency.min}
            precision={0}
            addonAfter="kHz"
            onChange={(value) => handleChange('frequency', value)}
            clipValue
          />
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.fill_interval}</div>
          <UnitInput
            data-testid="fillInterval"
            className={styles.input}
            disabled={preset.isDefault}
            value={preset.fillInterval ?? defaultConfig.fillInterval}
            max={100}
            min={0.0001}
            precision={4}
            step={0.0001}
            addonAfter="mm"
            onChange={(value) => handleChange('fillInterval', value)}
            controls={false}
            clipValue
          />
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.fill_angle}</div>
          <UnitInput
            data-testid="fillAngle"
            className={styles.input}
            disabled={preset.isDefault}
            value={preset.fillAngle ?? defaultConfig.fillAngle}
            max={360}
            min={-360}
            precision={1}
            addonAfter="deg"
            onChange={(value) => handleChange('fillAngle', value)}
            clipValue
          />
        </div>
        <div className={classNames(styles.field, styles['with-switch'])}>
          <div className={styles.label}>{tLaserPanel.bi_directional}</div>
          <Switch
            data-testid="biDirectional"
            checked={preset.biDirectional ?? defaultConfig.biDirectional}
            onChange={(value) => handleChange('biDirectional', value)}
          />
        </div>
        <div className={classNames(styles.field, styles['with-switch'])}>
          <div className={styles.label}>{tLaserPanel.cross_hatch}</div>
          <Switch
            data-testid="crossHatch"
            checked={preset.crossHatch ?? defaultConfig.crossHatch}
            onChange={(value) => handleChange('crossHatch', value)}
          />
        </div>
      </div>
    </div>
  );
};

export default PromarkInputs;
