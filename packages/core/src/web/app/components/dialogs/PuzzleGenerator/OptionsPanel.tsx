import React from 'react';

import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';
import PropertyRenderer from './PropertyRenderer';
import type { PuzzleState, PuzzleTypeConfig } from './types';

interface Props {
  onNestedStateChange: <K extends 'border' | 'image'>(key: K, updates: Partial<PuzzleState[K]>) => void;
  onStateChange: (updates: Partial<PuzzleState>) => void;
  state: PuzzleState;
  typeConfig: PuzzleTypeConfig;
}

const OptionsPanel = ({ onNestedStateChange, onStateChange, state, typeConfig }: Props): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();

  // Get translated type name
  const getTypeName = (nameKey: string): string => {
    const parts = nameKey.split('.');

    if (parts.length === 2 && parts[0] === 'types') {
      const typeKey = parts[1] as keyof typeof t.types;

      return t.types?.[typeKey] ?? nameKey;
    }

    return nameKey;
  };

  return (
    <div className={styles['options-panel']}>
      {/* Header with puzzle type name */}
      <div className={styles['options-header']}>{getTypeName(typeConfig.nameKey)}</div>

      {/* Dynamic property controls */}
      <div className={styles['options-content']}>
        {typeConfig.properties.map((property) => (
          <PropertyRenderer
            key={property.key}
            onNestedStateChange={onNestedStateChange}
            onStateChange={onStateChange}
            property={property}
            state={state}
          />
        ))}
      </div>
    </div>
  );
};

export default OptionsPanel;
