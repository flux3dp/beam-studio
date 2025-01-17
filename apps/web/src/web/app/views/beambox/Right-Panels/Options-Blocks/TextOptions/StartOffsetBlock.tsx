import React from 'react';

import i18n from 'helpers/i18n';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import styles from 'app/views/beambox/Right-Panels/OptionsPanel.module.scss';
import UnitInput from 'app/widgets/Unit-Input-v2';
import { useIsMobile } from 'helpers/system-helper';

interface Props {
  value: number;
  onValueChange: (val: number) => void;
}

export default function StartOffsetBlock({ value, onValueChange }: Props): JSX.Element {
  const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();
  return isMobile ? (
    <ObjectPanelItem.Number
      id="start_offset"
      label={LANG.start_offset}
      value={value}
      min={0}
      max={100}
      updateValue={onValueChange}
      unit=""
      decimal={0}
    />
  ) : (
    <div className={styles['option-block']}>
      <div className={styles.label}>{LANG.start_offset}</div>
      <UnitInput
        min={0}
        max={100}
        unit=""
        decimal={0}
        className={{ [styles['option-input']]: true }}
        defaultValue={value}
        getValue={onValueChange}
      />
    </div>
  );
}
