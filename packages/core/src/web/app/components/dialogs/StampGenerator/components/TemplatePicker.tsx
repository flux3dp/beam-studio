import React, { memo } from 'react';

import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import { STAMP_TEMPLATES } from '../templates';

import styles from './TemplatePicker.module.scss';

interface TemplatePickerProps {
  currentTemplateId?: string;
  onSelect: (templateId: string) => void;
}

const TemplatePicker = ({ currentTemplateId, onSelect }: TemplatePickerProps): React.JSX.Element => {
  const { stamp_generator: t } = useI18n();

  return (
    <div className={styles.picker}>
      {STAMP_TEMPLATES.map((template) => {
        const label = t.templates[template.nameKey];

        return (
          <button
            className={classNames(styles.item, { [styles.active]: template.id === currentTemplateId })}
            key={template.id}
            onClick={() => onSelect(template.id)}
            title={label}
          >
            {template.thumbnail ? (
              <img alt={label} src={template.thumbnail} />
            ) : (
              <div className={styles.placeholder}>{label}</div>
            )}
          </button>
        );
      })}
    </div>
  );
};

TemplatePicker.displayName = 'TemplatePicker';

export default memo(TemplatePicker);
