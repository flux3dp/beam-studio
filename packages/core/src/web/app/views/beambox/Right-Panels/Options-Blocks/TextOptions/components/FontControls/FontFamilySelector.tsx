import React, { useMemo } from 'react';

import type { DefaultOptionType } from 'antd/es/select';
import { useShallow } from 'zustand/react/shallow';

import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import Select from '@core/app/widgets/AntdSelect';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from '../../index.module.scss';
import { useTextOptionsStore } from '../../stores/useTextOptionsStore';
import { createFontFamilyOption, createHistoryFontOptions, filterFontOptions } from '../../utils/fontUtils';

interface FontOption {
  family?: string;
  label: React.ReactNode;
  value: string;
}

const FontFamilySelector: React.FC = () => {
  const { availableFontFamilies, configs, fontHistory, handleFontFamilyChange } = useTextOptionsStore(
    useShallow((state) => ({
      availableFontFamilies: state.availableFontFamilies,
      configs: state.configs,
      fontHistory: state.fontHistory,
      handleFontFamilyChange: state.handleFontFamilyChange,
    })),
  );
  const { fontFamily } = configs;
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();

  const fontOptions = useMemo(
    () => availableFontFamilies.map((family) => createFontFamilyOption(family)),
    [availableFontFamilies],
  );

  const historyFontOptions = useMemo(
    () => createHistoryFontOptions(fontHistory, availableFontFamilies),
    [fontHistory, availableFontFamilies],
  );

  if (isMobile) {
    return (
      <ObjectPanelItem.Select
        id="font_family"
        label={lang.font_family}
        onChange={handleFontFamilyChange || (() => {})}
        options={
          historyFontOptions.length > 0
            ? [{ label: lang.recently_used, type: 'group' }, ...historyFontOptions, { type: 'divider' }, ...fontOptions]
            : fontOptions
        }
        selected={
          fontFamily.hasMultiValue ? { label: '-', value: '' } : { label: fontFamily.value, value: fontFamily.value }
        }
      />
    );
  }

  const isOnlyOneOption = fontOptions.length === 1;

  return (
    <Select
      className={styles['font-family']}
      disabled={isOnlyOneOption}
      filterOption={(input: string, option?: DefaultOptionType) => {
        // Hide history options from filter
        if (option?.family) return false;

        if (option?.value) {
          return filterFontOptions(input, option.value as string);
        }

        return false;
      }}
      onChange={(value, option) => handleFontFamilyChange?.(value, option as FontOption)}
      onKeyDown={(e) => e.stopPropagation()}
      options={[
        {
          label: lang.recently_used,
          options: historyFontOptions,
          title: 'history',
        },
        {
          label: null,
          options: fontOptions,
          title: 'normal',
        },
      ]}
      placement="bottomRight"
      popupClassName={styles['font-family-dropdown']}
      popupMatchSelectWidth={false}
      showSearch
      title={lang.font_family}
      value={fontFamily.hasMultiValue ? '-' : fontFamily.value}
    />
  );
};

export default FontFamilySelector;
