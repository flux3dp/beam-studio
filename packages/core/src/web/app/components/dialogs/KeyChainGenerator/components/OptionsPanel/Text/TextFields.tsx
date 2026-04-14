import type { ReactNode } from 'react';
import React, { memo } from 'react';

import { Input } from 'antd';

import useI18n from '@core/helpers/useI18n';

import NumberControl from '../Controls/NumberControl';

import FontSelect from './FontSelect';

interface TextFieldsProps {
  contentValue: string;
  defaults: { fontSize: number; letterSpacing: number; lineSpacing: number };
  extraFields?: ReactNode;
  onContentChange: (evt: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFontChange: (font: { family: string; postscriptName: string; style: string }) => void;
  onFontSizeChange: (fontSize: number) => void;
  onLetterSpacingChange: (letterSpacing: number) => void;
  onLineSpacingChange: (lineSpacing: number) => void;
  values: {
    font: { family: string; postscriptName: string; style: string };
    fontSize: number;
    letterSpacing: number;
    lineSpacing: number;
  };
}

const TextFields = ({
  contentValue,
  defaults,
  onContentChange,
  onFontChange,
  onFontSizeChange,
  onLetterSpacingChange,
  onLineSpacingChange,
  values,
}: TextFieldsProps): ReactNode => {
  const { keychain_generator: t } = useI18n();

  return (
    <>
      <Input.TextArea
        autoSize={{ maxRows: 4, minRows: 2 }}
        onChange={onContentChange}
        placeholder={t.text_placeholder}
        value={contentValue}
      />
      <FontSelect font={values.font} onChange={onFontChange} />
      <NumberControl
        defaultValue={defaults.fontSize}
        label={t.font_size}
        max={300}
        min={10}
        onChange={onFontSizeChange}
        step={1}
        unit="px"
        value={values.fontSize}
        withSlider={false}
      />
      <NumberControl
        defaultValue={defaults.letterSpacing}
        label={t.letter_spacing}
        max={20}
        min={-5}
        onChange={onLetterSpacingChange}
        step={0.5}
        unit="px"
        value={values.letterSpacing}
        withSlider={false}
      />
      <NumberControl
        defaultValue={defaults.lineSpacing}
        label={t.line_spacing}
        max={5}
        min={0.5}
        onChange={onLineSpacingChange}
        step={0.1}
        unit="x"
        value={values.lineSpacing}
        withSlider={false}
      />
    </>
  );
};

TextFields.displayName = 'TextFields';

export default memo(TextFields);
