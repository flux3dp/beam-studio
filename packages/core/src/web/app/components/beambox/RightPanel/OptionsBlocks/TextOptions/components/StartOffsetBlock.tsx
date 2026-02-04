import React from 'react';

import ObjectPanelItem from '@core/app/components/beambox/RightPanel/ObjectPanelItem';
import styles from '@core/app/components/beambox/RightPanel/OptionsPanel.module.scss';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

interface Props {
  hasMultiValue?: boolean;
  onValueChange: (val: number) => void;
  value: number;
}

export default function StartOffsetBlock({ hasMultiValue, onValueChange, value }: Props): React.JSX.Element {
  const LANG = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();

  return isMobile ? (
    <ObjectPanelItem.Number
      decimal={0}
      hasMultiValue={hasMultiValue}
      id="start_offset"
      label={LANG.start_offset}
      max={100}
      min={0}
      unit=""
      updateValue={onValueChange}
      value={value}
    />
  ) : (
    <div className={styles['option-block']}>
      <div className={styles.label}>{LANG.start_offset}</div>
      <UnitInput
        className={{ [styles['no-unit']]: true, [styles['option-input']]: true }}
        decimal={0}
        defaultValue={value}
        displayMultiValue={hasMultiValue}
        getValue={onValueChange}
        max={100}
        min={0}
        unit=""
      />
    </div>
  );
}
