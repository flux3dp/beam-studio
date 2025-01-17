import React from 'react';

import useI18n from 'helpers/useI18n';

import ConfigValueDisplay from './ConfigValueDisplay';

import styles from './WhiteInkSettingsModal.module.scss';

interface Props {
  value: number;
  hasMultiValue?: boolean
  onChange: (val: number) => void;
}

// TODO: add test
const WhiteInkRepeat = ({ value, hasMultiValue, onChange }: Props): JSX.Element => {
  const MIN_VALUE = 1;
  const MAX_VALUE = 100;
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  return (
    <div className={styles.panel}>
      <span className={styles.title}>{t.repeat}</span>
      <ConfigValueDisplay
        inputId='white-repeat-input'
        type='modal'
        max={MAX_VALUE}
        min={MIN_VALUE}
        value={value}
        hasMultiValue={hasMultiValue}
        onChange={onChange}
      />
    </div>
  );
};

export default WhiteInkRepeat;
