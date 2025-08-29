import React from 'react';

import { useShallow } from 'zustand/react/shallow';

import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import Select from '@core/app/widgets/AntdSelect';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from '../../index.module.scss';
import { useTextOptionsStore } from '../../stores/useTextOptionsStore';

const FontStyleSelector: React.FC = () => {
  const { configs, handleFontStyleChangeWithFamily, styleOptions } = useTextOptionsStore(
    useShallow((state) => ({
      configs: state.configs,
      handleFontStyleChangeWithFamily: state.handleFontStyleChangeWithFamily,
      styleOptions: state.styleOptions,
    })),
  );
  const { fontFamily, fontStyle } = configs;
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <ObjectPanelItem.Select
        id="font_style"
        label={lang.font_style}
        onChange={(style) => handleFontStyleChangeWithFamily?.(style, fontFamily.value)}
        options={styleOptions}
        selected={
          fontFamily.hasMultiValue || fontStyle.hasMultiValue
            ? { label: '-', value: '' }
            : { label: fontStyle.value, value: fontStyle.value }
        }
      />
    );
  }

  const disabled = styleOptions.length <= 1;

  return (
    <Select
      className={styles['font-style']}
      disabled={disabled}
      onChange={(value) => handleFontStyleChangeWithFamily?.(value, fontFamily.value)}
      onKeyDown={(e) => e.stopPropagation()}
      options={styleOptions}
      popupMatchSelectWidth={false}
      title={lang.font_style}
      value={fontFamily.hasMultiValue || fontStyle.hasMultiValue ? '-' : fontStyle.value}
    />
  );
};

export default FontStyleSelector;
