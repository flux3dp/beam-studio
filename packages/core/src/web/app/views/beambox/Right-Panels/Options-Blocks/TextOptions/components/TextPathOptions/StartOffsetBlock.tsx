import React from 'react';

import { useShallow } from 'zustand/react/shallow';

import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import styles from '@core/app/views/beambox/Right-Panels/OptionsPanel.module.scss';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import { useTextOptionsStore } from '../../stores/useTextOptionsStore';

export default function StartOffsetBlock(): React.JSX.Element {
  const { configs, handleStartOffsetChange } = useTextOptionsStore(
    useShallow((state) => ({
      configs: state.configs,
      handleStartOffsetChange: state.handleStartOffsetChange,
    })),
  );
  const { startOffset } = configs;
  const LANG = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();

  return isMobile ? (
    <ObjectPanelItem.Number
      decimal={0}
      hasMultiValue={startOffset.hasMultiValue}
      id="start_offset"
      label={LANG.start_offset}
      max={100}
      min={0}
      unit=""
      updateValue={handleStartOffsetChange || (() => {})}
      value={startOffset.value}
    />
  ) : (
    <div className={styles['option-block']}>
      <div className={styles.label}>{LANG.start_offset}</div>
      <UnitInput
        className={{ [styles['no-unit']]: true, [styles['option-input']]: true }}
        decimal={0}
        defaultValue={startOffset.value}
        displayMultiValue={startOffset.hasMultiValue}
        getValue={handleStartOffsetChange || (() => {})}
        max={100}
        min={0}
        unit=""
      />
    </div>
  );
}
