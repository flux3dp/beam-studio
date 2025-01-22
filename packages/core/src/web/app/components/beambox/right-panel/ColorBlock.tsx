import React from 'react';

import classNames from 'classnames';

import styles from './ColorBlock.module.scss';

interface Props {
  className?: string;
  color: string;
  id?: string;
  onClick?: (e: React.MouseEvent) => void;
  size?: 'defalut' | 'large' | 'mini' | 'small';
}

const ColorBlock = ({ className, color, id, onClick, size = 'defalut' }: Props): React.JSX.Element => {
  const isFullColor = color === 'fullcolor';
  const isCleared = color === 'none';

  return (
    <div className={classNames(className, styles.color, styles[size])} id={id}>
      <div
        className={classNames({ [styles.clear]: isCleared, [styles['full-color']]: isFullColor })}
        onClick={onClick}
        style={isFullColor || isCleared ? undefined : { backgroundColor: color }}
      />
    </div>
  );
};

export default ColorBlock;
