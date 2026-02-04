import React from 'react';

import classNames from 'classnames';

import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';
import type { ShapeType } from './shapeGenerators';
import type { PuzzleTypeConfig } from './types';
import { resolveTypeName } from './utils';

interface TypeSelectorProps {
  currentTypeId: ShapeType;
  onTypeChange: (typeId: ShapeType) => void;
  puzzleTypes: PuzzleTypeConfig[];
}

const TypeSelector = ({ currentTypeId, onTypeChange, puzzleTypes }: TypeSelectorProps): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();

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
          title={resolveTypeName(t, puzzleType.nameKey)}
        >
          {puzzleType.thumbnail ? (
            <img alt={resolveTypeName(t, puzzleType.nameKey)} src={puzzleType.thumbnail} />
          ) : (
            <div className={styles.placeholder}>{resolveTypeName(t, puzzleType.nameKey)}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TypeSelector;
