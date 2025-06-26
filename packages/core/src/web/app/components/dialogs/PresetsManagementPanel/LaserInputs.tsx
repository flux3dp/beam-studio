import React from 'react';

import UnitInput from '@core/app/widgets/UnitInput';
import { baseConfig } from '@core/helpers/layer/layer-config-helper';
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

const LaserInputs = ({
  handleChange,
  isInch = false,
  lengthUnit = 'mm',
  maxSpeed,
  minSpeed,
  preset,
}: Props): React.JSX.Element => {
  const tLaserPanel = useI18n().beambox.right_panel.laser_panel;
  const t = tLaserPanel.preset_management;

  return (
    <div className={styles.inputs}>
      <div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.strength}</div>
          <UnitInput
            addonAfter="%"
            className={styles.input}
            data-testid="power"
            disabled={preset.isDefault}
            max={100}
            min={0}
            onChange={(value) => handleChange('power', value)}
            precision={0}
            value={preset.power ?? baseConfig.power}
          />
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.speed}</div>
          <UnitInput
            addonAfter={`${lengthUnit}/s`}
            className={styles.input}
            data-testid="speed"
            disabled={preset.isDefault}
            isInch={isInch}
            max={maxSpeed}
            min={minSpeed}
            onChange={(value) => handleChange('speed', value)}
            precision={isInch ? 2 : 1}
            value={preset.speed ?? baseConfig.speed}
          />
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.repeat}</div>
          <UnitInput
            addonAfter={tLaserPanel.times}
            className={styles.input}
            data-testid="repeat"
            disabled={preset.isDefault}
            max={100}
            min={0}
            onChange={(value) => handleChange('repeat', value)}
            precision={0}
            value={preset.repeat ?? baseConfig.repeat}
          />
        </div>
      </div>
      <div>
        <div className={styles.field}>
          <div className={styles.label}>{t.lower_focus_by}</div>
          <UnitInput
            addonAfter={lengthUnit}
            className={styles.input}
            data-testid="focus"
            disabled={preset.isDefault}
            isInch={isInch}
            max={10}
            min={0}
            onChange={(value) => handleChange('focus', value)}
            precision={isInch ? 2 : 1}
            value={Math.max(preset.focus ?? baseConfig.focus, 0)}
          />
        </div>
        <div className={styles.field}>
          <div className={styles.label}>{tLaserPanel.z_step}</div>
          <UnitInput
            addonAfter={lengthUnit}
            className={styles.input}
            data-testid="focusStep"
            disabled={preset.isDefault || preset.repeat <= 1}
            isInch={isInch}
            max={10}
            min={0}
            onChange={(value) => {
              /**
               * update both zStep and focusStep, to make the user experience consistent
               * zStep is for beamo only
               * focusStep is for the other models
               */
              handleChange('zStep', value);
              handleChange('focusStep', value);
            }}
            precision={isInch ? 2 : 1}
            value={Math.max(preset.focusStep ?? baseConfig.focusStep, 0)}
          />
        </div>
      </div>
    </div>
  );
};

export default LaserInputs;
