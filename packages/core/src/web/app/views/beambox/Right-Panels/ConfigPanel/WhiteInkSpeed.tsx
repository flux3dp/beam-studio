import React, { useMemo } from 'react';

import { getSpeedOptions } from '@core/app/constants/config-options';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { useStorageStore } from '@core/app/stores/storageStore';
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
const WhiteInkSpeed = ({ hasMultiValue, onChange, value }: Props): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const simpleMode = !useGlobalPreferenceStore((state) => state['print-advanced-mode']);

  const sliderOptions = useMemo(() => (simpleMode ? getSpeedOptions(lang) : undefined), [simpleMode, lang]);

  const isInch = useStorageStore((state) => state.isInch);
  const { decimal, display: displayUnit } = useMemo(() => {
    return isInch ? { decimal: 2, display: 'in/s' } : { decimal: 1, display: 'mm/s' };
  }, [isInch]);
  const workarea = useDocumentStore((state) => state.workarea);
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
        isGradient
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
