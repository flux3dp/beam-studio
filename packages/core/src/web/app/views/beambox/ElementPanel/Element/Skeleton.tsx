import React, { memo } from 'react';

import classNames from 'classnames';

import styles from './Element.module.scss';

interface Props {
  count?: number;
}

const Skeleton = ({ count = 1 }: Props) => {
  return Array.from({ length: count }, (_, i) => <div className={classNames(styles.icon, styles.loading)} key={i} />);
};

export default memo(Skeleton);
