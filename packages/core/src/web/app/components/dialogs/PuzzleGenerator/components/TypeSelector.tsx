import React from 'react';

import classNames from 'classnames';

import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import type { PuzzleTypeConfig, ShapeType } from '../types';
import { resolveTypeName } from '../utils';

import styles from './TypeSelector.module.scss';

interface TypeSelectorProps {
  currentTypeId: ShapeType;
  onTypeChange: (typeId: ShapeType) => void;
  puzzleTypes: PuzzleTypeConfig[];
}

const TypeSelector = ({ currentTypeId, onTypeChange, puzzleTypes }: TypeSelectorProps): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();
  const isMobile = useIsMobile();

  return (
    <div className={classNames(styles['type-selector'], { [styles.mobile]: isMobile })}>
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

TypeSelector.displayName = 'TypeSelector';

export default TypeSelector;
