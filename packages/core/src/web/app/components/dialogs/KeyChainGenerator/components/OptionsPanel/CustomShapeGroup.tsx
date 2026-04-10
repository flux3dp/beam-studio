import type { ReactNode } from 'react';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import useI18n from '@core/helpers/useI18n';

import type { CustomShapeOptionDef, CustomShapeOptionValues, ShapeElementPositionRef } from '../../types';
import useKeychainShapeStore from '../../useKeychainShapeStore';

import GroupControl from './controls/GroupControl';
import NumberControl from './controls/NumberControl';
import SelectControl from './controls/SelectControl';
import ElementPicker from './element/ElementPicker';
import TextFields from './text/TextFields';

interface CustomShapeGroupProps {
  optionDef: CustomShapeOptionDef;
}

const CustomShapeGroup = ({ optionDef }: CustomShapeGroupProps): ReactNode => {
  const { defaults } = optionDef;
  const shape = useKeychainShapeStore((s) => s.state.customShape);
  const { keychain_generator: t } = useI18n();

  // Local mirror so typing feels responsive without firing async rebuilds on every keystroke.
  const [textDraft, setTextDraft] = useState(shape.text);

  useEffect(() => {
    setTextDraft(shape.text);
  }, [shape.text]);

  const handleChange = useCallback(async (updates: Partial<CustomShapeOptionValues>) => {
    const {
      applyOptions,
      buildBaseShape,
      category,
      state: { customShape: shape },
      updateState,
    } = useKeychainShapeStore.getState();

    updateState({ customShape: { ...shape, ...updates } });

    const isFresh = await buildBaseShape(category);

    if (isFresh) applyOptions();
  }, []);

  const handleContentChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTextDraft(evt.target.value);
      handleChange({ text: evt.target.value });
    },
    [handleChange],
  );
  const handleFontSizeChange = useCallback((fontSize: number) => handleChange({ fontSize }), [handleChange]);
  const handleLetterSpacingChange = useCallback(
    (letterSpacing: number) => handleChange({ letterSpacing }),
    [handleChange],
  );
  const handleLineSpacingChange = useCallback((lineSpacing: number) => handleChange({ lineSpacing }), [handleChange]);
  const handleOutlineOffsetChange = useCallback(
    (outlineOffset: number) => handleChange({ outlineOffset }),
    [handleChange],
  );
  const handleFontChange = useCallback(
    (font: { family: string; postscriptName: string; style: string }) => handleChange({ font }),
    [handleChange],
  );

  const handleElementShapeChange = useCallback(
    (shapeKey: string) => {
      handleChange({ element: { ...shape.element, shapeKey } });
    },
    [handleChange, shape.element],
  );

  const handlePositionRefChange = useCallback(
    (positionRef: ShapeElementPositionRef) => {
      handleChange({ element: { ...shape.element, positionRef } });
    },
    [handleChange, shape.element],
  );

  const textValues = useMemo(
    () => ({
      font: shape.font,
      fontSize: shape.fontSize,
      letterSpacing: shape.letterSpacing,
      lineSpacing: shape.lineSpacing,
    }),
    [shape.font, shape.fontSize, shape.letterSpacing, shape.lineSpacing],
  );

  const positionRefOptions = [
    { label: t.position_ref_left_center, value: 'leftCenter' as const },
    { label: t.position_ref_right_center, value: 'rightCenter' as const },
    { label: t.position_ref_top_center, value: 'topCenter' as const },
    { label: t.position_ref_bottom_center, value: 'bottomCenter' as const },
  ];

  return (
    <>
      <ElementPicker onChange={handleElementShapeChange} selectedKey={shape.element.shapeKey} title={t.element} />
      {shape.element.shapeKey && (
        <SelectControl
          label={t.position_ref}
          onChange={handlePositionRefChange}
          options={positionRefOptions}
          value={shape.element.positionRef}
        />
      )}
      <GroupControl enabled hideSwitch title={t.text}>
        <TextFields
          contentValue={textDraft}
          defaults={defaults}
          onContentChange={handleContentChange}
          onFontChange={handleFontChange}
          onFontSizeChange={handleFontSizeChange}
          onLetterSpacingChange={handleLetterSpacingChange}
          onLineSpacingChange={handleLineSpacingChange}
          values={textValues}
        />
      </GroupControl>
      <NumberControl
        defaultValue={defaults.outlineOffset}
        label={t.outline_offset ?? 'Outline offset'}
        max={10}
        min={0.5}
        onChange={handleOutlineOffsetChange}
        step={0.5}
        unit="mm"
        value={shape.outlineOffset}
      />
    </>
  );
};

CustomShapeGroup.displayName = 'CustomShapeGroup';

export default memo(CustomShapeGroup);
