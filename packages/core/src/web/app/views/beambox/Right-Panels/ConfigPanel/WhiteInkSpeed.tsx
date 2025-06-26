import React, { useMemo } from 'react';

import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { getSpeedOptions } from '@core/app/constants/config-options';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useBeamboxPreference } from '@core/helpers/hooks/useBeamboxPreference';
import useI18n from '@core/helpers/useI18n';
import storage from '@core/implementations/storage';

import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import styles from './WhiteInkSettingsModal.module.scss';

interface Props {
  hasMultiValue?: boolean;
  onChange: (val: number) => void;
  value: number;
}

// TODO: add test
const WhiteInkSpeed = ({ hasMultiValue, onChange, value }: Props): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const simpleMode = !useBeamboxPreference('print-advanced-mode');

  const sliderOptions = useMemo(() => (simpleMode ? getSpeedOptions(lang) : undefined), [simpleMode, lang]);

  const { decimal, display: displayUnit } = useMemo(() => {
    const unit: 'inches' | 'mm' = storage.get('default-units') || 'mm';
    const display = { inches: 'in/s', mm: 'mm/s' }[unit];
    const d = { inches: 2, mm: 1 }[unit];

    return { decimal: d, display };
  }, []);
  const workarea: WorkAreaModel = beamboxPreference.read('workarea');
  const { maxValue, minValue } = useMemo(() => {
    const workareaObj = getWorkarea(workarea);

    return { maxValue: workareaObj.maxSpeed, minValue: workareaObj.minSpeed };
  }, [workarea]);

  return (
    <div className={styles.panel}>
      <span className={styles.title}>{t.speed}</span>
      <ConfigValueDisplay
        decimal={decimal}
        hasMultiValue={hasMultiValue}
        inputId="white-speed-input"
        max={maxValue}
        min={minValue}
        onChange={onChange}
        options={sliderOptions}
        unit={displayUnit}
        value={value}
      />
      <ConfigSlider
        decimal={decimal}
        id="white-speed"
        max={maxValue}
        min={minValue}
        onChange={onChange}
        options={sliderOptions}
        step={0.1}
        unit={displayUnit}
        value={value}
      />
    </div>
  );
};

export default WhiteInkSpeed;
