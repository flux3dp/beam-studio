import React, { memo, useEffect, useState } from 'react';

import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import InputNumberGroup from '@core/app/components/beambox/RightPanel/common/InputNumberGroup';
import Slider from '@core/app/components/beambox/RightPanel/common/Slider';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { getLetterSpacing, setLetterSpacing } from '@core/app/svgedit/text/textedit';
import { ControlType } from '@core/helpers/element/editable/base';
import useI18n from '@core/helpers/useI18n';
import type { NumberOptionConfig } from '@core/interfaces/ObjectPanel';

import OptionsInput from '../../OptionsInput';

import styles from './SpacingBlock.module.scss';

const config: NumberOptionConfig = {
  id: 'letter_spacing',
  precision: 2,
  sliderMax: 5,
  sliderMin: -5,
  sliderStep: 0.01,
  step: 0.05,
};

const readValues = (textElements: SVGTextElement[]) => {
  if (textElements.length === 0) return { hasMultiValue: false, value: 0 };

  const value = getLetterSpacing(textElements[0]);

  for (let i = 1; i < textElements.length; i++) {
    if (getLetterSpacing(textElements[i]) !== value) {
      return { hasMultiValue: true, value };
    }
  }

  return { hasMultiValue: false, value };
};

interface Props {
  onSizeChange?: () => void;
  textElements: SVGTextElement[];
}

const LetterSpacingBlock = ({ onSizeChange, textElements }: Props): React.ReactNode => {
  const t = useI18n().beambox.right_panel.object_panel.option_panel;
  const isTablet = useIsTabletOrMobile();
  const [state, setState] = useState(() => readValues(textElements));

  useEffect(() => {
    setState(readValues(textElements));
  }, [textElements]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setState(readValues(textElements));
    });

    for (const el of textElements) {
      observer.observe(el, { attributeFilter: ['letter-spacing'], attributes: true });
    }

    return () => observer.disconnect();
  }, [textElements]);

  const handleChange = (value: null | number, addToHistory = true): void => {
    if (value === null) return;

    setLetterSpacing(value, textElements, { addToHistory });

    if (addToHistory) {
      setState({ hasMultiValue: false, value });
      onSizeChange?.();
    }
  };

  if (isTablet) {
    return (
      <ControlBlock label={t.letter_spacing} type={ControlType.LETTER_SPACING}>
        <Slider config={config} onChange={handleChange} value={state.value} />
        <InputNumberGroup
          config={config}
          containerClassName={styles.input}
          onChange={handleChange}
          value={state.value}
        />
      </ControlBlock>
    );
  }

  return (
    <div className={styles.container} title={t.letter_spacing}>
      <div className={styles.label}>
        <OptionPanelIcons.LetterSpacing />
      </div>
      <OptionsInput
        displayMultiValue={state.hasMultiValue}
        id="letter_spacing"
        onChange={handleChange}
        precision={2}
        step={0.05}
        value={state.value}
      />
    </div>
  );
};

export default memo(LetterSpacingBlock);
