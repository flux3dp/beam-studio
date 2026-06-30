import React from 'react';

import classNames from 'classnames';

import styles from './FloatingButton.module.scss';

interface Props {
  active?: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

const FloatingButton = ({ active, icon, onClick, primary, ref }: Props): React.JSX.Element => {
  return (
    <div
      className={classNames(styles.button, primary ? styles.filled : styles.outlined, { [styles.active]: active })}
      onClick={onClick}
      ref={ref}
    >
      {icon}
    </div>
  );
};

export default FloatingButton;
