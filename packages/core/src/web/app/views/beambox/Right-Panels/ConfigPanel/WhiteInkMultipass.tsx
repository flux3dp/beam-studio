import React, { useMemo } from 'react';

import configOptions from '@core/app/constants/config-options';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
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
const WhiteInkMultipass = ({ hasMultiValue, onChange, value }: Props): React.JSX.Element => {
  const MIN_VALUE = 1;
  const MAX_VALUE = 10;
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const simpleMode = !useGlobalPreferenceStore((state) => state['print-advanced-mode']);
  const sliderOptions = useMemo(() => (simpleMode ? configOptions.whiteMultipassOptions : undefined), [simpleMode]);

  return (
    <div className={styles.panel}>
      <span className={styles.title}>{t.print_multipass}</span>
      <ConfigValueDisplay
        hasMultiValue={hasMultiValue}
        inputId="white-multipass-input"
        max={MAX_VALUE}
        min={MIN_VALUE}
        onChange={onChange}
        options={sliderOptions}
        type="modal"
        value={value}
      />
      <ConfigSlider
        id="white-multipass-slider"
        max={MAX_VALUE}
        min={MIN_VALUE}
        onChange={onChange}
        options={sliderOptions}
        value={value}
      />
    </div>
  );
};

export default WhiteInkMultipass;
