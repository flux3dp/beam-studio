import React from 'react';

import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';
import PropertyRenderer from './PropertyRenderer';
import type { PuzzleState, PuzzleStateUpdate, PuzzleTypeConfig } from './types';
import { resolveTypeName } from './utils';

interface OptionsPanelProps {
  onNestedStateChange: <K extends 'border' | 'image'>(key: K, updates: Partial<PuzzleState[K]>) => void;
  onStateChange: (updates: PuzzleStateUpdate) => void;
  state: PuzzleState;
  typeConfig: PuzzleTypeConfig;
}

const OptionsPanel = ({
  onNestedStateChange,
  onStateChange,
  state,
  typeConfig,
}: OptionsPanelProps): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();

  return (
    <div className={styles['options-panel']}>
      <div className={styles['options-header']}>{resolveTypeName(t, typeConfig.nameKey)}</div>
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
