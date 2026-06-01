import type { ReactNode } from 'react';
import React, { memo } from 'react';

import classNames from 'classnames';

import type { OneOf } from '@core/interfaces/utils';

import styles from './IconSelectorGrid.module.scss';

export type IconSelectorItem = OneOf<{ innerHTML: string }, { icon: ReactNode }> & {
  key: string;
};

interface IconSelectorGridProps {
  className?: string;
  items: IconSelectorItem[];
  onSelect: (key: string) => void;
  /** Extra slots rendered before the selectable items (e.g. "current shape" slot). */
  prefix?: ReactNode;
  selectedKey: string;
  strokeIcon?: boolean;
  /** Extra slots rendered after the selectable items (e.g. "more" button). */
  suffix?: ReactNode;
}

const IconSelectorGrid = ({
  className,
  items,
  onSelect,
  prefix,
  selectedKey,
  strokeIcon,
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
        {item.innerHTML ? (
          <div
            className={classNames(styles.icon, { [styles.stroke]: strokeIcon })}
            dangerouslySetInnerHTML={{ __html: item.innerHTML }}
          />
        ) : (
          <div className={classNames(styles.icon, { [styles.stroke]: strokeIcon })}>{item.icon}</div>
        )}
      </button>
    ))}
    {suffix}
  </div>
);

IconSelectorGrid.displayName = 'IconSelectorGrid';

export default memo(IconSelectorGrid);
