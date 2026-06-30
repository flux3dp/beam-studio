import React from 'react';

import type { ButtonProps } from 'antd';
import classNames from 'classnames';

import Divider from '@core/app/components/common/Divider';
import ListButton from '@core/app/components/common/ListButton';

import styles from './ListButtonGroup.module.scss';

interface Props {
  children?: React.ReactNode;
  items?: Array<ButtonProps | { type: 'divider' }>;
  size?: 'large' | 'middle';
}

const ListButtonGroup = ({ children, items, size = 'middle' }: Props) => {
  return (
    <div className={classNames(styles.container, styles[size])}>
      {items?.map((item, index) =>
        item.type === 'divider' ? <Divider key={index} /> : <ListButton key={index} size={size} {...item} />,
      )}
      {children}
    </div>
  );
};

export default ListButtonGroup;
