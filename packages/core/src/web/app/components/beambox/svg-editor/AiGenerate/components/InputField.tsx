import React, { memo } from 'react';

import { Input } from 'antd';

import type { InputField } from '@core/helpers/api/ai-image-config';

// We reuse the same styles to ensure visual consistency (border, spacing, char-count)
import styles from './InputField.module.scss';

interface Props {
  field: InputField;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  value: string;
}

const UnmemorizedInputField = ({ field, onChange, onKeyDown, rows = 3, value }: Props) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles['input-container']}>
        <Input.TextArea
          className={styles.textarea}
          maxLength={field.maxLength}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onKeyUp={(e) => e.stopPropagation()}
          placeholder={field.placeholder}
          rows={rows}
          style={{ resize: 'none' }}
          value={value}
        />

        <div className={styles['bottom-bar']}>
          {field.maxLength && (
            <span className={styles['char-count']}>
              {value.length} / {field.maxLength}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(UnmemorizedInputField);
