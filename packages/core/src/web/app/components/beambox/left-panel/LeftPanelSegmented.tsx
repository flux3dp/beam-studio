import React from 'react';
import type { ReactNode } from 'react';

import classNames from 'classnames';

import styles from './LeftPanelSegmented.module.scss';

interface Props<T = number> {
  onChange?: (value: T) => Promise<void> | void;
  options: Array<{
    label: ReactNode;
    title?: string;
    value: T;
  }>;
  value: T;
}

const LeftPanelSegmented = ({ onChange, options, value }: Props) => {
  return (
    <div className={styles.container}>
      {options.map(({ label, title, value: optionValue }) => (
        <div
          className={classNames(styles.option, { [styles.active]: optionValue === value })}
          key={optionValue}
          onClick={() => onChange?.(optionValue)}
          title={title}
        >
          {label}
        </div>
      ))}
    </div>
  );
};

export default LeftPanelSegmented;
