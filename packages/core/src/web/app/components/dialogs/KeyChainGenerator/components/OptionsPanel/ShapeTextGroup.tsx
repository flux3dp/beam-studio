import type { ReactNode } from 'react';
import React, { memo, useCallback, useEffect, useState } from 'react';

import { Input } from 'antd';

import useI18n from '@core/helpers/useI18n';

import type { ShapeTextOptionDef, ShapeTextOptionValues } from '../../types';
import useKeychainShapeStore from '../../useKeychainShapeStore';

import FontSelect from './FontSelect';
import GroupControl from './GroupControl';
import styles from './GroupControl.module.scss';
import NumberControl from './NumberControl';

interface ShapeTextGroupProps {
  optionDef: ShapeTextOptionDef;
}

const ShapeTextGroup = ({ optionDef }: ShapeTextGroupProps): ReactNode => {
  const { defaults, id } = optionDef;
  const shapeText = useKeychainShapeStore((s) => s.state.shapeTexts[id]);
  const { keychain_generator: t } = useI18n();

  // Local mirror so typing feels responsive without firing async rebuilds on every keystroke.
  const [textDraft, setTextDraft] = useState(shapeText.text);

  useEffect(() => {
    setTextDraft(shapeText.text);
  }, [shapeText.text]);

  const handleChange = useCallback(
    async (updates: Partial<ShapeTextOptionValues>) => {
      const {
        applyOptions,
        buildBaseShape,
        category,
        state: { shapeTexts },
        updateState,
      } = useKeychainShapeStore.getState();

      updateState({ shapeTexts: { ...shapeTexts, [id]: { ...shapeTexts[id], ...updates } } });

      const isFresh = await buildBaseShape(category);

      if (isFresh) applyOptions();
    },
    [id],
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => handleChange({ text: e.target.value }),
    [handleChange],
  );

  const handleFontSizeChange = useCallback((fontSize: number) => handleChange({ fontSize }), [handleChange]);
  const handleOutlineOffsetChange = useCallback(
    (outlineOffset: number) => handleChange({ outlineOffset }),
    [handleChange],
  );
  const handleFontChange = useCallback(
    (font: { family: string; postscriptName: string; style: string }) => handleChange({ font }),
    [handleChange],
  );

  return (
    <GroupControl enabled hideSwitch id={id} title={t.shape_text}>
      <div className={styles.content}>
        <Input onChange={handleTextChange} placeholder={t.shape_text_placeholder} value={textDraft} />
        <FontSelect font={shapeText.font} onChange={handleFontChange} />
        <NumberControl
          defaultValue={defaults.fontSize}
          label={t.font_size}
          max={300}
          min={20}
          onChange={handleFontSizeChange}
          step={1}
          unit="px"
          value={shapeText.fontSize}
          withSlider={false}
        />
        <NumberControl
          defaultValue={defaults.outlineOffset}
          label={t.outline_offset ?? 'Outline offset'}
          max={10}
          min={0.5}
          onChange={handleOutlineOffsetChange}
          step={0.5}
          unit="mm"
          value={shapeText.outlineOffset}
        />
      </div>
    </GroupControl>
  );
};

ShapeTextGroup.displayName = 'ShapeTextGroup';

export default memo(ShapeTextGroup);
