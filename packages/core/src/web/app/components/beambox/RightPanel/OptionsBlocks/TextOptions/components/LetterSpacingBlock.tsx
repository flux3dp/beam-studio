import React, { memo, useEffect, useState } from 'react';

import ObjectPanelItem from '@core/app/components/beambox/RightPanel/ObjectPanelItem';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { getLetterSpacing, setLetterSpacing } from '@core/app/svgedit/text/textedit';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import OptionsInput from '../../OptionsInput';
import styles from '../index.module.scss';

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
  const lang = useI18n();
  const langOptionPanel = lang.beambox.right_panel.object_panel.option_panel;
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
      observer.observe(el, { attributeFilter: ['letter-spacing'], attributes: true });
    }

    return () => observer.disconnect();
  }, [textElements]);

  const handleChange = (value: null | number): void => {
    if (value === null) return;

    setLetterSpacing(value, textElements);
    setState({ hasMultiValue: false, value });
    onSizeChange?.();
  };

  if (isMobile) {
    return (
      <ObjectPanelItem.Number
        hasMultiValue={state.hasMultiValue}
        id="letter_spacing"
        label={langOptionPanel.letter_spacing}
        unit="em"
        updateValue={handleChange}
        value={state.value}
      />
    );
  }

  return (
    <div className={styles.spacing} title={langOptionPanel.letter_spacing}>
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
