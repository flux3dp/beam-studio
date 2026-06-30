import React from 'react';

import classNames from 'classnames';

import styles from './ColorBlock.module.scss';

interface Props {
  active?: boolean;
  className?: string;
  color: string;
  id?: string;
  onClick?: (e: React.MouseEvent) => void;
  ref?: React.Ref<HTMLDivElement>;
  size?: 'defalut' | 'large' | 'mini' | 'small';
  stroke?: boolean;
}

const ColorBlock = ({
  active,
  className,
  color,
  id,
  onClick,
  ref,
  size = 'defalut',
  stroke = false,
}: Props): React.JSX.Element => {
  const isFullColor = color === 'fullcolor';
  const isCleared = color === 'none';

  return (
    <div className={classNames(className, styles.color, styles[size], { [styles.active]: active })} id={id} ref={ref}>
      <div
        className={classNames({
          [styles.clear]: isCleared,
          [styles['full-color']]: isFullColor,
        })}
        onClick={onClick}
        style={
          isFullColor || isCleared
            ? undefined
            : stroke
              ? {
                  boxShadow: `#cecece 0px 0px 0px 0.5px inset, ${color} 0px 0px 0px 4.5px inset, #cecece 0px 0px 0px 5px inset`,
                }
              : { backgroundColor: color }
        }
      />
    </div>
  );
};

export default ColorBlock;
