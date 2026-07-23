import React from 'react';

import type { ButtonProps } from 'antd';
import { Button } from 'antd';
import classNames from 'classnames';

import styles from './ListButton.module.scss';

/** Antd Button with default config that looks like a menu/dropdown/option button */
const ListButton = ({ block = true, className, type = 'text', ...props }: ButtonProps) => {
  return <Button {...props} block={block} className={classNames(styles.button, className)} type={type} />;
};

export default ListButton;
