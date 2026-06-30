import React from 'react';

import type { ButtonProps } from 'antd';
import { Button } from 'antd';
import classNames from 'classnames';

import styles from './FlexButton.module.scss';

type Props = Pick<ButtonProps, 'children' | 'disabled' | 'icon' | 'id' | 'onClick' | 'size' | 'title'> & {
  active?: boolean;
};

// default: black text + gray border
// active: blue text + blue border + light blue background
const FlexButton = ({ active, children, ...props }: Props) => {
  return (
    <Button
      className={classNames(styles.button, { [styles.active]: active })}
      color={active ? 'primary' : 'default'}
      size={children ? undefined : 'large'}
      variant="outlined"
      {...props}
    >
      {children}
    </Button>
  );
};

export default FlexButton;
