import React, { useEffect, useRef } from 'react';

import classNames from 'classnames';

import type { SettingCategory, SettingCategoryConfig } from '../types';

import styles from './MobileSettingsModal.module.scss';

interface Props {
  categories: SettingCategoryConfig[];
  onCategorySelect: (category: SettingCategory) => void;
  selectedCategory: SettingCategory;
}

const MobileCategoryTabs = ({ categories, onCategorySelect, selectedCategory }: Props): React.JSX.Element => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selectedTabRef.current || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const tab = selectedTabRef.current;
    const scrollLeft = tab.offsetLeft - container.offsetWidth / 2 + tab.offsetWidth / 2;

    container.scrollTo({ behavior: 'smooth', left: Math.max(0, scrollLeft) });
  }, [selectedCategory]);

  return (
    <div className={styles['mobile-tabs-container']} ref={scrollContainerRef}>
      <div className={styles['mobile-tabs-scroll']}>
        {categories.map((category) => {
          const isSelected = category.key === selectedCategory;

          return (
            <button
              className={classNames(styles['mobile-tab'], { [styles.selected]: isSelected })}
              key={category.key}
              onClick={() => onCategorySelect(category.key)}
              ref={isSelected ? selectedTabRef : null}
              type="button"
            >
              <span className={styles['mobile-tab-icon']}>{category.icon}</span>
              <span className={styles['mobile-tab-label']}>{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileCategoryTabs;
