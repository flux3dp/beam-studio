import classNames from 'classnames';
import React from 'react';

import styles from './ColorBlock.module.scss';

interface Props {
  id?: string;
  className?: string;
  size?: 'mini' | 'small' | 'defalut' | 'large';
  color: string;
  onClick?: (e: React.MouseEvent) => void;
}

const ColorBlock = ({ id, className, size = 'defalut', color, onClick }: Props): JSX.Element => {
  const isFullColor = color === 'fullcolor';
  const isCleared = color === 'none';

  return (
    <div id={id} className={classNames(className, styles.color, styles[size])}>
      <div
        className={classNames({ [styles['full-color']]: isFullColor, [styles.clear]: isCleared })}
        style={isFullColor || isCleared ? undefined : { backgroundColor: color }}
        onClick={onClick}
      />
    </div>
  );
};

export default ColorBlock;
