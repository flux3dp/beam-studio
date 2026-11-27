import React from 'react';

import UnitInput from '@core/app/widgets/UnitInput';
import { getDefaultConfig } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigKey, ConfigKeyTypeMap, Preset } from '@core/interfaces/ILayerConfig';

import styles from '../PresetsManagementPanel/PresetsManagementPanel.module.scss';

interface Props {
  handleChange: <T extends ConfigKey>(key: T, value: ConfigKeyTypeMap[T] | null) => void;
  preset: Preset;
}

const PresetInputs = ({ handleChange, preset }: Props): React.JSX.Element => {
  const t = useI18n().beambox.right_panel.laser_panel;
  const defaults = getDefaultConfig();
  const fields = [
    { key: 'power', label: t.strength, max: 100, min: 1, precision: 0, unit: '%' },
    { key: 'speed', label: t.speed, max: 2000, min: 1, precision: 0, unit: 'mm/s' },
    { key: 'repeat', label: t.repeat, max: 100, min: 1, precision: 0, unit: '' },
    { key: 'fillInterval', label: t.fill_interval, max: 1, min: 0.05, precision: 4, unit: 'mm' },
  ] as const;

  return (
    <div className={styles.inputs}>
      <div>
        {fields.map(({ key, label, max, min, precision, unit }) => (
          <div className={styles.field} key={key}>
            <div className={styles.label}>{label}</div>
            <UnitInput
              addonAfter={unit}
              className={styles.input}
              clipValue
              data-testid={key}
              disabled={preset.isDefault}
              max={max}
              min={min}
              onChange={(value) => handleChange(key, value)}
              precision={precision}
              value={preset[key] ?? defaults[key]}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PresetInputs;
