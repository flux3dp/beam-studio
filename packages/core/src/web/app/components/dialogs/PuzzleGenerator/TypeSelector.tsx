import React from 'react';

import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';
import type { PuzzleTypeConfig } from './types';

interface Props {
  currentTypeId: string;
  onTypeChange: (typeId: string) => void;
  puzzleTypes: PuzzleTypeConfig[];
}

const TypeSelector = ({ currentTypeId, onTypeChange, puzzleTypes }: Props): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();

  // Helper to get translated type name
  const getTypeName = (nameKey: string): string => {
    // nameKey format: 'types.circle_jigsaw' -> t.types?.circle_jigsaw
    const parts = nameKey.split('.');

    if (parts.length === 2 && parts[0] === 'types') {
      const typeKey = parts[1] as keyof typeof t.types;

      return t.types?.[typeKey] ?? nameKey;
    }

    return nameKey;
  };

  return (
    <div className={styles['type-selector']}>
      {puzzleTypes.map((puzzleType) => (
        <div
          className={classNames(styles['type-item'], {
            [styles.selected]: puzzleType.id === currentTypeId,
          })}
          key={puzzleType.id}
          onClick={() => onTypeChange(puzzleType.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onTypeChange(puzzleType.id);
            }
          }}
          role="button"
          tabIndex={0}
          title={getTypeName(puzzleType.nameKey)}
        >
          {puzzleType.thumbnail ? (
            <img alt={getTypeName(puzzleType.nameKey)} src={puzzleType.thumbnail} />
          ) : (
            <div className={styles.placeholder}>{getTypeName(puzzleType.nameKey)}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TypeSelector;
