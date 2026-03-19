import React, { memo, useEffect, useState } from 'react';

import ObjectPanelItem from '@core/app/components/beambox/RightPanel/ObjectPanelItem';
import { getFontSize, setFontSize } from '@core/app/svgedit/text/textedit';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import OptionsInput from '../../OptionsInput';
import styles from '../index.module.scss';

const readValues = (textElements: SVGTextElement[]) => {
  if (textElements.length === 0) return { hasMultiValue: false, value: 0 };

  const first = getFontSize(textElements[0]);
  let hasMultiValue = false;

  for (let i = 1; i < textElements.length; i++) {
    if (getFontSize(textElements[i]) !== first) {
      hasMultiValue = true;
      break;
    }
  }

  return { hasMultiValue, value: first };
};

interface Props {
  onSizeChange?: () => void;
  textElements: SVGTextElement[];
}

const FontSizeBlock = ({ onSizeChange, textElements }: Props): React.ReactNode => {
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

  if (isMobile) {
    return (
      <ObjectPanelItem.Number
        decimal={0}
        hasMultiValue={state.hasMultiValue}
        id="font_size"
        label={langOptionPanel.font_size}
        min={1}
        unit="px"
        updateValue={handleChange}
        value={state.value}
      />
    );
  }

  return (
    <div className={styles['font-size']} title={langOptionPanel.font_size}>
      <OptionsInput
        displayMultiValue={state.hasMultiValue}
        id="font_size"
        min={1}
        onChange={handleChange}
        precision={0}
        unit="px"
        value={state.value}
        width={68}
      />
    </div>
  );
};

export default memo(FontSizeBlock);
