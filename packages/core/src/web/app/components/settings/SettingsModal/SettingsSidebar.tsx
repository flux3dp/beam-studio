import React from 'react';

import classNames from 'classnames';

import styles from './SettingsModal.module.scss';
import type { SettingCategory, SettingCategoryConfig } from './types';

interface SettingsSidebarProps {
  categories: SettingCategoryConfig[];
  onCategorySelect: (category: SettingCategory) => void;
  selectedCategory: SettingCategory;
}

const SettingsSidebar = ({
  categories,
  onCategorySelect,
  selectedCategory,
}: SettingsSidebarProps): React.JSX.Element => {
  const visibleCategories = categories.filter((cat) => cat.visible !== false);

  return (
    <div className={styles.sidebar}>
      {visibleCategories.map((category) => (
        <div
          className={classNames(styles['sidebar-item'], {
            [styles.selected]: category.key === selectedCategory,
          })}
          key={category.key}
          onClick={() => onCategorySelect(category.key)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onCategorySelect(category.key);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <span className={styles.icon}>{category.icon}</span>
          <span className={styles.label}>{category.label}</span>
        </div>
      ))}
    </div>
  );
};

export default SettingsSidebar;
