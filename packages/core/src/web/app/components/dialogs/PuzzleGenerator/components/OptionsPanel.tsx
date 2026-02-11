import React from 'react';

import classNames from 'classnames';

import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import type { NestedStateKey, PuzzleState, PuzzleStateUpdate, PuzzleTypeConfig } from '../types';
import { resolveTypeName } from '../utils';

import styles from './OptionsPanel.module.scss';
import PropertyRenderer from './PropertyRenderer';

interface OptionsPanelProps {
  onNestedStateChange: <K extends NestedStateKey>(key: K, updates: Partial<PuzzleState[K]>) => void;
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
  const isMobile = useIsMobile();

  return (
    <div className={classNames(styles['options-panel'], { [styles.mobile]: isMobile })}>
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

OptionsPanel.displayName = 'OptionsPanel';

export default OptionsPanel;
