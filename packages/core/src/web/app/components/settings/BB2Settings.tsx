import React from 'react';

import { checkFbb2 } from '@core/helpers/checkFeature';
import useI18n from '@core/helpers/useI18n';

import onOffOptionFactory from './onOffOptionFactory';
import SelectControl from './SelectControl';
import styles from './Settings.module.scss';

interface Props {
  getBeamboxPreferenceEditingValue: <T = string>(key: string) => T;
  updateBeamboxPreferenceChange: (key: string, newVal: any) => void;
}

const BB2Settings = ({ getBeamboxPreferenceEditingValue, updateBeamboxPreferenceChange }: Props): React.ReactNode => {
  const lang = useI18n();

  if (!checkFbb2()) {
    return null;
  }

  const curveEngravingSpeedConstraintOptions = onOffOptionFactory(
    getBeamboxPreferenceEditingValue<boolean>('curve_engraving_speed_limit') !== false,
    { lang },
  );

  return (
    <>
      <div className={styles.subtitle}>Beambox II</div>
      <SelectControl
        id="set-curve-engraving-speed-contraint"
        label={lang.settings.curve_engraving_speed_limit}
        onChange={(e) => updateBeamboxPreferenceChange('curve_engraving_speed_limit', e.target.value)}
        options={curveEngravingSpeedConstraintOptions}
      />
    </>
  );
};

export default BB2Settings;
