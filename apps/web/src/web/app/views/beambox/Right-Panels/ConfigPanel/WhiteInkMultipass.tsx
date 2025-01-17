import React, { useContext, useMemo } from 'react';

import configOptions from 'app/constants/config-options';
import useI18n from 'helpers/useI18n';

import ConfigPanelContext from './ConfigPanelContext';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';

import styles from './WhiteInkSettingsModal.module.scss';

interface Props {
  value: number;
  hasMultiValue?: boolean
  onChange: (val: number) => void;
}

// TODO: add test
const WhiteInkMultipass = ({ value, hasMultiValue, onChange }: Props): JSX.Element => {
  const MIN_VALUE = 1;
  const MAX_VALUE = 10;
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { simpleMode = true } = useContext(ConfigPanelContext);

  const sliderOptions = useMemo(
    () => (simpleMode ? configOptions.whiteMultipassOptions : null),
    [simpleMode]
  );
  return (
    <div className={styles.panel}>
      <span className={styles.title}>{t.print_multipass}</span>
      <ConfigValueDisplay
        inputId='white-multipass-input'
        type='modal'
        max={MAX_VALUE}
        min={MIN_VALUE}
        value={value}
        hasMultiValue={hasMultiValue}
        onChange={onChange}
        options={sliderOptions}
      />
      <ConfigSlider
        id='white-multipass-slider'
        max={MAX_VALUE}
        min={MIN_VALUE}
        value={value}
        onChange={onChange}
        options={sliderOptions}
      />
    </div>
  );
};

export default WhiteInkMultipass;
