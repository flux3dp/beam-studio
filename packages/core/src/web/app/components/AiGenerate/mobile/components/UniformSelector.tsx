import React, { memo } from 'react';

import { CloseOutlined, LeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';

import styles from './UniformSelector.module.scss';

export interface SelectorOption<T> {
  description?: string;
  icon?: React.ReactNode;
  label: string;
  value: T;
}

export type SelectorVariant = 'compact' | 'default' | 'detailed';

interface Props<T> {
  columns?: 1 | 2;
  onClose: () => void;
  onSelect: (value: T) => void;
  options: Array<SelectorOption<T>>;
  selectedValue: T;
  title: string;
  variant?: SelectorVariant;
}

const UnmemorizedUniformSelector = <T extends number | string>({
  columns = 2,
  onClose,
  onSelect,
  options,
  selectedValue,
  title,
  variant = 'default',
}: Props<T>) => {
  const handleSelect = (value: T) => {
    onSelect(value);
    onClose();
  };

  return (
    <div className={styles.selector}>
      {/* Header */}
      <div className={styles.header}>
        <Button className={styles['back-button']} icon={<LeftOutlined />} onClick={onClose} type="text" />
        <span className={styles.title}>{title}</span>
        <Button className={styles['close-button']} icon={<CloseOutlined />} onClick={onClose} type="text" />
      </div>

      {/* Options Grid */}
      <div className={styles.grid} data-columns={columns}>
        {options.map((option) => {
          const isSelected = selectedValue === option.value;

          return (
            <div
              className={classNames(styles.card, styles[`card-${variant}`], { [styles.selected]: isSelected })}
              key={String(option.value)}
              onClick={() => handleSelect(option.value)}
            >
              {variant === 'default' && option.icon && <div className={styles['icon-wrapper']}>{option.icon}</div>}
              <span className={styles.label}>{option.label}</span>
              {variant === 'detailed' && option.description && (
                <span className={styles.description}>{option.description}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const UniformSelector = memo(UnmemorizedUniformSelector) as typeof UnmemorizedUniformSelector;

export default UniformSelector;
