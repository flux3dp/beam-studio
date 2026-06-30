import React, { memo, useEffect, useState } from 'react';

import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import InputNumberGroup from '@core/app/components/beambox/RightPanel/common/InputNumberGroup';
import Slider from '@core/app/components/beambox/RightPanel/common/Slider';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { getLineSpacing, setLineSpacing } from '@core/app/svgedit/text/textedit';
import { ControlType } from '@core/helpers/element/editable/base';
import useI18n from '@core/helpers/useI18n';
import type { NumberOptionConfig } from '@core/interfaces/ObjectPanel';

import OptionsInput from '../../OptionsInput';

import styles from './SpacingBlock.module.scss';

const config: NumberOptionConfig = {
  id: 'line_spacing',
  min: 0.8,
  precision: 2,
  sliderMax: 5,
  step: 0.1,
};

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
      observer.observe(el, { attributeFilter: ['data-line-spacing'], attributes: true });
    }

    return () => observer.disconnect();
  }, [textElements]);

  const handleChange = (value: null | number, addToHistory = true): void => {
    if (value === null) return;

    setLineSpacing(value, textElements, { addToHistory });

    if (addToHistory) {
      setState({ hasMultiValue: false, value });
      onSizeChange?.();
    }
  };

  return isTablet ? (
    <ControlBlock label={t.line_spacing} type={ControlType.LINE_SPACING}>
      <Slider config={config} onChange={handleChange} value={state.value} />
      <InputNumberGroup config={config} containerClassName={styles.input} onChange={handleChange} value={state.value} />
    </ControlBlock>
  ) : (
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
