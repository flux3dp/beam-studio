import React, { memo, useEffect, useState } from 'react';

import ObjectPanelItem from '@core/app/components/beambox/RightPanel/ObjectPanelItem';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { getLineSpacing, setLineSpacing } from '@core/app/svgedit/text/textedit';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import OptionsInput from '../../OptionsInput';

import styles from './SpacingBlock.module.scss';

const readValues = (textElements: SVGTextElement[]) => {
  if (textElements.length === 0) return { hasMultiValue: false, value: 1 };

  const value = getLineSpacing(textElements[0]);

  for (let i = 1; i < textElements.length; i++) {
    if (getLineSpacing(textElements[i]) !== value) {
      return { hasMultiValue: true, value };
    }
  }

  return { hasMultiValue: false, value };
};

interface Props {
  onSizeChange?: () => void;
  textElements: SVGTextElement[];
}

const LineSpacingBlock = ({ onSizeChange, textElements }: Props): React.ReactNode => {
  const t = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();
  const [state, setState] = useState(() => readValues(textElements));

  useEffect(() => {
    setState(readValues(textElements));
  }, [textElements]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setState(readValues(textElements));
    });

    for (const el of textElements) {
      observer.observe(el, { attributeFilter: ['data-line-spacing'], attributes: true });
    }

    return () => observer.disconnect();
  }, [textElements]);

  const handleChange = (value: null | number): void => {
    if (value === null) return;

    setLineSpacing(value, textElements);
    setState({ hasMultiValue: false, value });
    onSizeChange?.();
  };

  if (isMobile) {
    return (
      <ObjectPanelItem.Number
        decimal={1}
        hasMultiValue={state.hasMultiValue}
        id="line_spacing"
        label={t.line_spacing}
        min={0.8}
        unit=""
        updateValue={handleChange}
        value={state.value}
      />
    );
  }

  return (
    <div className={styles.container} title={t.line_spacing}>
      <div className={styles.label}>
        <OptionPanelIcons.LineSpacing />
      </div>
      <OptionsInput
        displayMultiValue={state.hasMultiValue}
        id="line_spacing"
        min={0.8}
        onChange={handleChange}
        precision={2}
        step={0.1}
        value={state.value}
      />
    </div>
  );
};

export default memo(LineSpacingBlock);
