import React from 'react';

import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import styles from '@core/app/views/beambox/Right-Panels/OptionsPanel.module.scss';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import i18n from '@core/helpers/i18n';
import { useIsMobile } from '@core/helpers/system-helper';

interface Props {
  onValueChange: (val: number) => void;
  value: number;
}

export default function StartOffsetBlock({ onValueChange, value }: Props): React.JSX.Element {
  const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();

  return isMobile ? (
    <ObjectPanelItem.Number
      decimal={0}
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
        className={{ [styles['option-input']]: true }}
        decimal={0}
        defaultValue={value}
        getValue={onValueChange}
        max={100}
        min={0}
        unit=""
      />
    </div>
  );
}
