import React from 'react';

import { useShallow } from 'zustand/react/shallow';

import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from '../../index.module.scss';
import { useTextOptionsStore } from '../../stores/useTextOptionsStore';

const FontSizeControl: React.FC = () => {
  const { configs, handleFontSizeChange } = useTextOptionsStore(
    useShallow((state) => ({
      configs: state.configs,
      handleFontSizeChange: state.handleFontSizeChange,
    })),
  );
  const { fontSize } = configs;
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();

  return isMobile ? (
    <ObjectPanelItem.Number
      decimal={0}
      hasMultiValue={fontSize.hasMultiValue}
      id="font_size"
      label={lang.font_size}
      min={1}
      unit="px"
      updateValue={handleFontSizeChange || (() => {})}
      value={fontSize.value}
    />
  ) : (
    <div className={styles['font-size']} title={lang.font_size}>
      <UnitInput
        className={{ 'option-input': true }}
        decimal={0}
        defaultValue={fontSize.value}
        displayMultiValue={fontSize.hasMultiValue}
        getValue={handleFontSizeChange || (() => {})}
        id="font_size"
        min={1}
        unit="px"
      />
    </div>
  );
};

export default FontSizeControl;
