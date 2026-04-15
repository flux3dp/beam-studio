import type { ReactNode } from 'react';
import React, { memo } from 'react';

import classNames from 'classnames';

import styles from './IconSelectorGrid.module.scss';

export interface IconSelectorItem {
  icon: ReactNode;
  key: string;
}

interface IconSelectorGridProps {
  className?: string;
  items: IconSelectorItem[];
  onSelect: (key: string) => void;
  /** Extra slots rendered before the selectable items (e.g. "current shape" slot). */
  prefix?: ReactNode;
  selectedKey: string;
  /** Extra slots rendered after the selectable items (e.g. "more" button). */
  suffix?: ReactNode;
}

const IconSelectorGrid = ({
  className,
  items,
  onSelect,
  prefix,
  selectedKey,
  suffix,
}: IconSelectorGridProps): ReactNode => (
  <div className={classNames(styles.grid, className)}>
    {prefix}
    {items.map((item) => (
      <button
        className={classNames(styles.item, { [styles.selected]: item.key === selectedKey })}
        key={item.key}
        onClick={() => onSelect(item.key)}
        type="button"
      >
        <div className={styles.icon}>{item.icon}</div>
      </button>
    ))}
    {suffix}
  </div>
);

IconSelectorGrid.displayName = 'IconSelectorGrid';

export default memo(IconSelectorGrid);
