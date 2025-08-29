import React from 'react';

import { useShallow } from 'zustand/react/shallow';

import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from '../../index.module.scss';
import { useTextOptionsStore } from '../../stores/useTextOptionsStore';

const LineSpacingControl: React.FC = () => {
  const { configs, handleLineSpacingChange } = useTextOptionsStore(
    useShallow((state) => ({
      configs: state.configs,
      handleLineSpacingChange: state.handleLineSpacingChange,
    })),
  );
  const { lineSpacing } = configs;
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();

  return isMobile ? (
    <ObjectPanelItem.Number
      decimal={1}
      hasMultiValue={lineSpacing.hasMultiValue}
      id="line_spacing"
      label={lang.line_spacing}
      min={0.8}
      unit=""
      updateValue={handleLineSpacingChange || (() => {})}
      value={lineSpacing.value}
    />
  ) : (
    <div className={styles.spacing}>
      <div className={styles.label} title={lang.line_spacing}>
        <OptionPanelIcons.LineSpacing />
      </div>
      <UnitInput
        className={{ 'option-input': true }}
        decimal={1}
        defaultValue={lineSpacing.value}
        displayMultiValue={lineSpacing.hasMultiValue}
        getValue={handleLineSpacingChange || (() => {})}
        id="line_spacing"
        min={0.8}
        step={0.1}
        unit=""
      />
    </div>
  );
};

export default LineSpacingControl;
