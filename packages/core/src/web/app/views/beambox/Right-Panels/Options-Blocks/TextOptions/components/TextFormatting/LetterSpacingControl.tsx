import React from 'react';

import { useShallow } from 'zustand/react/shallow';

import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from '../../index.module.scss';
import { useTextOptionsStore } from '../../stores/useTextOptionsStore';

const LetterSpacingControl: React.FC = () => {
  const { configs, handleLetterSpacingChange } = useTextOptionsStore(
    useShallow((state) => ({
      configs: state.configs,
      handleLetterSpacingChange: state.handleLetterSpacingChange,
    })),
  );
  const { letterSpacing } = configs;
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();

  return isMobile ? (
    <ObjectPanelItem.Number
      hasMultiValue={letterSpacing.hasMultiValue}
      id="letter_spacing"
      label={lang.letter_spacing}
      unit="em"
      updateValue={handleLetterSpacingChange || (() => {})}
      value={letterSpacing.value}
    />
  ) : (
    <div className={styles.spacing}>
      <div className={styles.label} title={lang.letter_spacing}>
        <OptionPanelIcons.LetterSpacing />
      </div>
      <UnitInput
        className={{ 'option-input': true }}
        defaultValue={letterSpacing.value}
        displayMultiValue={letterSpacing.hasMultiValue}
        getValue={handleLetterSpacingChange || (() => {})}
        id="letter_spacing"
        step={0.05}
        unit=""
      />
    </div>
  );
};

export default LetterSpacingControl;
