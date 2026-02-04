import React from 'react';

import useI18n from '@core/helpers/useI18n';

import ConfigValueDisplay from './ConfigValueDisplay';
import styles from './WhiteInkSettingsModal.module.scss';

interface Props {
  hasMultiValue?: boolean;
  onChange: (val: number) => void;
  value: number;
}

// TODO: add test
const WhiteInkRepeat = ({ hasMultiValue, onChange, value }: Props): React.JSX.Element => {
  const MIN_VALUE = 1;
  const MAX_VALUE = 100;
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  return (
    <div className={styles.panel}>
      <span className={styles.title}>{t.repeat}</span>
      <ConfigValueDisplay
        hasMultiValue={hasMultiValue}
        inputId="white-repeat-input"
        max={MAX_VALUE}
        min={MIN_VALUE}
        onChange={onChange}
        type="modal"
        value={value}
      />
    </div>
  );
};

export default WhiteInkRepeat;
