import React from 'react';

import type { Style } from '@core/helpers/api/ai-image-config';

import styles from '../index.module.scss';
import type { ImageInput } from '../types';
import { handleTextAreaKeyDown } from '../types';
import { getInputFieldsForStyle } from '../utils/inputFields';

import InputField from './InputField';
import InputWithUpload from './InputField.upload';

interface Props {
  aiStyles: Style[];
  className?: string;
  imageInputs: ImageInput[];
  inputFields: Record<string, string>;
  onAddImage: (input: ImageInput) => void;
  onFieldChange: (key: string, value: string) => void;
  onRemoveImage: (id: string) => void;
  style: Style;
  styleId: string;
}

const InputFieldsSection = ({
  aiStyles,
  className,
  imageInputs,
  inputFields,
  onAddImage,
  onFieldChange,
  onRemoveImage,
  style,
  styleId,
}: Props) => {
  const fields = getInputFieldsForStyle(styleId, aiStyles);

  return (
    <>
      {fields.map((field) => {
        const isDescriptionWithUpload = field.key === 'description' && style?.modes?.includes('edit');

        return (
          <div className={className || styles.section} key={field.key}>
            <h3 className={styles['section-title']}>
              {field.label} {field.required && <span className={styles.required}>*</span>}
            </h3>
            {isDescriptionWithUpload ? (
              <InputWithUpload
                field={field}
                imageInputs={imageInputs}
                onAddImage={onAddImage}
                onChange={(value) => onFieldChange(field.key, value)}
                onKeyDown={handleTextAreaKeyDown}
                onRemoveImage={onRemoveImage}
                value={inputFields[field.key] || ''}
              />
            ) : (
              <InputField
                field={field}
                onChange={(value) => onFieldChange(field.key, value)}
                onKeyDown={handleTextAreaKeyDown}
                rows={field.key === 'description' ? 5 : 3}
                value={inputFields[field.key] || ''}
              />
            )}
          </div>
        );
      })}
    </>
  );
};

export default InputFieldsSection;
