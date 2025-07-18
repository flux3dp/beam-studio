import React, { useMemo } from 'react';

import { getWhiteSaturationOptions } from '@core/app/constants/config-options';
import { useBeamboxPreference } from '@core/helpers/hooks/useBeamboxPreference';
import useI18n from '@core/helpers/useI18n';

import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import styles from './WhiteInkSettingsModal.module.scss';

interface Props {
  hasMultiValue?: boolean;
  onChange: (val: number) => void;
  value: number;
}

// TODO: add test
const WhiteInkSaturation = ({ hasMultiValue, onChange, value }: Props): React.JSX.Element => {
  const MIN_VALUE = 1;
  const MAX_VALUE = 15;
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const simpleMode = !useBeamboxPreference('print-advanced-mode');
  const sliderOptions = useMemo(() => (simpleMode ? getWhiteSaturationOptions(lang) : undefined), [simpleMode, lang]);

  return (
    <div className={styles.panel}>
      <span className={styles.title}>{t.ink_saturation}</span>
      <ConfigValueDisplay
        hasMultiValue={hasMultiValue}
        inputId="white-ink-input"
        max={MAX_VALUE}
        min={MIN_VALUE}
        onChange={onChange}
        options={sliderOptions}
        type="modal"
        value={value}
      />
      <ConfigSlider
        id="white-ink-slider"
        max={MAX_VALUE}
        min={MIN_VALUE}
        onChange={onChange}
        options={sliderOptions}
        value={value}
      />
    </div>
  );
};

export default WhiteInkSaturation;
