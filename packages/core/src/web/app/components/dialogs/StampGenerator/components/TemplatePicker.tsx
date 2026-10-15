import React, { memo } from 'react';

import classNames from 'classnames';

import { getVisibleTemplates } from '../templates';
import type { TemplateCategory } from '../types';

import styles from './TemplatePicker.module.scss';

interface TemplatePickerProps {
  category?: TemplateCategory;
  currentTemplateId?: string;
  onSelect: (templateId: string) => void;
}

const TemplatePicker = ({ category, currentTemplateId, onSelect }: TemplatePickerProps): React.JSX.Element => {
  return (
    <div className={styles.picker}>
      {getVisibleTemplates()
        .filter((template) => template.category === category)
        .map((template) => {
          return (
            <button
              className={classNames(styles.item, { [styles.active]: template.id === currentTemplateId })}
              key={template.id}
              onClick={() => onSelect(template.id)}
            >
              <img alt={template.id} src={template.thumbnail} />
            </button>
          );
        })}
    </div>
  );
};

TemplatePicker.displayName = 'TemplatePicker';

export default memo(TemplatePicker);
