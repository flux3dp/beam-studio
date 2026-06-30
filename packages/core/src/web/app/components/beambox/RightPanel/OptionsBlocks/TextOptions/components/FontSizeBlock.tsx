import React, { memo, useEffect, useState } from 'react';

import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import InputNumberGroup from '@core/app/components/beambox/RightPanel/common/InputNumberGroup';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { getFontSize, setFontSize } from '@core/app/svgedit/text/textedit';
import { ControlType } from '@core/helpers/element/editable/base';
import useI18n from '@core/helpers/useI18n';
import type { NumberOptionConfig } from '@core/interfaces/ObjectPanel';

import OptionsInput from '../../OptionsInput';

import styles from './FontSizeBlock.module.scss';

const config: NumberOptionConfig = {
  id: 'font_size',
  min: 1,
  precision: 0,
  unit: 'px',
};

const readValues = (textElements: SVGTextElement[]) => {
  if (textElements.length === 0) return { hasMultiValue: false, value: 0 };

  const value = getFontSize(textElements[0]);

  for (let i = 1; i < textElements.length; i++) {
    if (getFontSize(textElements[i]) !== value) {
      return { hasMultiValue: true, value };
    }
  }

  return { hasMultiValue: false, value };
};

interface Props {
  onSizeChange?: () => void;
  textElements: SVGTextElement[];
}

const FontSizeBlock = ({ onSizeChange, textElements }: Props): React.ReactNode => {
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
      observer.observe(el, { attributeFilter: ['font-size'], attributes: true });
    }

    return () => observer.disconnect();
  }, [textElements]);

  const handleChange = (val: null | number): void => {
    if (val === null) return;

    setFontSize(val, textElements);
    setState({ hasMultiValue: false, value: val });
    onSizeChange?.();
  };

  if (isTablet) {
    return (
      <ControlBlock label={t.font_size} type={ControlType.FONT_SIZE}>
        <InputNumberGroup
          config={config}
          containerClassName={styles.input}
          onChange={(e) => handleChange(Number(e))}
          value={state.value}
        />
      </ControlBlock>
    );
  }

  return (
    <div className={styles.container} title={t.font_size}>
      <OptionsInput
        displayMultiValue={state.hasMultiValue}
        onChange={handleChange}
        value={state.value}
        width={68}
        {...config}
      />
    </div>
  );
};

export default memo(FontSizeBlock);
