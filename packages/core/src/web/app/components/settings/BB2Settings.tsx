import React from 'react';

import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import useI18n from '@core/helpers/useI18n';

import onOffOptionFactory from './onOffOptionFactory';
import SelectControl from './SelectControl';
import styles from './Settings.module.scss';

interface Props {
  getBeamboxPreferenceEditingValue: <T = string>(key: string) => T;
  selectedModel: WorkAreaModel;
  updateBeamboxPreferenceChange: (key: string, newVal: any) => void;
}

const BB2Settings = ({
  getBeamboxPreferenceEditingValue,
  selectedModel,
  updateBeamboxPreferenceChange,
}: Props): React.ReactNode => {
  const lang = useI18n();

  if (selectedModel !== 'fbb2') {
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
