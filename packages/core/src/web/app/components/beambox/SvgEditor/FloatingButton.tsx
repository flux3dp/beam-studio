import React from 'react';

import classNames from 'classnames';

import styles from './FloatingButton.module.scss';

interface Props {
  active?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  ref?: React.Ref<HTMLDivElement>;
  title?: string;
}

const FloatingButton = ({ active, disabled, icon, onClick, primary, ref, title }: Props): React.JSX.Element => {
  return (
    <div
      className={classNames(styles.button, primary ? styles.filled : styles.outlined, {
        [styles.active]: active,
        [styles.disabled]: disabled,
      })}
      onClick={disabled ? undefined : onClick}
      ref={ref}
      title={title}
    >
      {icon}
    </div>
  );
};

export default FloatingButton;
