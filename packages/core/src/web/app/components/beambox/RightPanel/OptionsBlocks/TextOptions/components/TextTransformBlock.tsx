import React, { memo, useEffect, useMemo, useState } from 'react';

import { ConfigProvider } from 'antd';

import ObjectPanelItem from '@core/app/components/beambox/RightPanel/ObjectPanelItem';
import { selectTheme } from '@core/app/constants/antd-config';
import { useIsMobile } from '@core/app/stores/screenStore';
import type { TextTransform } from '@core/app/svgedit/text/textedit';
import { getTextTransform, setTextTransform } from '@core/app/svgedit/text/textedit';
import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';

import styles from './TextTransformBlock.module.scss';

const MODES: Array<Exclude<TextTransform, 'none'>> = [
  'sentence',
  'lowercase',
  'uppercase',
  'title',
  'toggle',
  'halfwidth',
  'fullwidth',
];

const readValue = (textElements: SVGTextElement[]): { hasMultiValue: boolean; value: TextTransform } => {
  if (textElements.length === 0) return { hasMultiValue: false, value: 'none' };

  const value = getTextTransform(textElements[0]);

  for (let i = 1; i < textElements.length; i++) {
    if (getTextTransform(textElements[i]) !== value) {
      return { hasMultiValue: true, value };
    }
  }

  return { hasMultiValue: false, value };
};

interface Props {
  onSizeChange?: () => void;
  textElements: SVGTextElement[];
}

const TextTransformBlock = ({ onSizeChange, textElements }: Props): React.ReactNode => {
  const t = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();
  const [state, setState] = useState(() => readValue(textElements));

  useEffect(() => {
    setState(readValue(textElements));
  }, [textElements]);

  useEffect(() => {
    const observer = new MutationObserver(() => setState(readValue(textElements)));

    for (const el of textElements) {
      observer.observe(el, { attributeFilter: ['data-text-transform'], attributes: true });
    }

    return () => observer.disconnect();
  }, [textElements]);

  const labelOf = (mode: TextTransform): string =>
    ({
      fullwidth: t.text_transform_fullwidth,
      halfwidth: t.text_transform_halfwidth,
      lowercase: t.text_transform_lowercase,
      none: '',
      sentence: t.text_transform_sentence,
      title: t.text_transform_title,
      toggle: t.text_transform_toggle,
      uppercase: t.text_transform_uppercase,
    })[mode];

  const options = useMemo(
    () => MODES.map((mode) => ({ label: labelOf(mode), value: mode })),
    // eslint-disable-next-line hooks/exhaustive-deps
    [t],
  );

  const handleChange = (mode: TextTransform) => {
    setTextTransform(mode, textElements);
    setState({ hasMultiValue: false, value: mode });
    onSizeChange?.();
  };

  if (isMobile) {
    return (
      <ObjectPanelItem.Select
        id="text-transform"
        label={t.text_transform}
        onChange={(mode: string) => handleChange(mode as TextTransform)}
        options={options}
        selected={{
          label: state.hasMultiValue ? '-' : labelOf(state.value),
          value: state.hasMultiValue ? '' : state.value,
        }}
      />
    );
  }

  const displayValue = state.hasMultiValue ? '-' : state.value === 'none' ? undefined : state.value;

  return (
    <ConfigProvider theme={selectTheme}>
      <Select
        className={styles.select}
        onChange={(value) => handleChange(value as TextTransform)}
        onKeyDown={(e) => e.stopPropagation()}
        options={options}
        placeholder={t.text_transform}
        popupMatchSelectWidth={false}
        title={t.text_transform}
        value={displayValue}
      />
    </ConfigProvider>
  );
};

export default memo(TextTransformBlock);
