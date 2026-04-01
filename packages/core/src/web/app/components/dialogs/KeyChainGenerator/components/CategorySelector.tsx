import React from 'react';

import classNames from 'classnames';

import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import type { KeyChainCategory } from '../types';

import styles from './CategorySelector.module.scss';

interface CategorySelectorProps {
  categories: KeyChainCategory[];
  currentCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
}

const CategorySelector = ({
  categories,
  currentCategoryId,
  onCategoryChange,
}: CategorySelectorProps): React.JSX.Element => {
  const { keychain_generator: t } = useI18n();
  const isMobile = useIsMobile();

  return (
    <div className={classNames(styles['category-selector'], { [styles.mobile]: isMobile })}>
      {categories.map((category) => (
        <div
          className={classNames(styles['category-item'], {
            [styles.selected]: category.id === currentCategoryId,
          })}
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onCategoryChange(category.id);
            }
          }}
          role="button"
          tabIndex={0}
          title={t.types[category.nameKey]}
        >
          {category.thumbnail ? (
            <img alt={t.types[category.nameKey]} src={category.thumbnail} />
          ) : (
            <div className={styles.placeholder}>{t.types[category.nameKey]}</div>
          )}
        </div>
      ))}
    </div>
  );
};

CategorySelector.displayName = 'CategorySelector';

export default CategorySelector;
