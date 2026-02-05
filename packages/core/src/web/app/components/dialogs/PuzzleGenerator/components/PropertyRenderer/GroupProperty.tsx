import React from 'react';

import { Switch } from 'antd';

import type { GroupPropertyDef, NestedStateKey, PuzzleState, PuzzleStateUpdate } from '../../types';

import styles from './PropertyRenderer.module.scss';

import type { BasePropertyProps } from './index';
import PropertyRenderer from './index';

interface GroupPropertyProps extends BasePropertyProps<GroupPropertyDef> {
  onNestedStateChange: <K extends NestedStateKey>(key: K, updates: Partial<PuzzleState[K]>) => void;
  onStateChange: (updates: PuzzleStateUpdate) => void;
  state: PuzzleState;
}

const GroupProperty = ({
  getLabel,
  getValue,
  onNestedStateChange,
  onStateChange,
  property,
  setValue,
  state,
}: GroupPropertyProps): React.JSX.Element => {
  // Find the toggle property if enabledBy is set
  const isEnabled = property.enabledBy ? (getValue(property.enabledBy) as boolean) : true;

  // Find the header toggle (the one that controls the group's enabled state)
  const toggleChild = property.enabledBy
    ? property.children.find((child) => child.key === property.enabledBy)
    : undefined;

  // Get other children (exclude only the header toggle)
  const contentChildren = property.children.filter((child) => child !== toggleChild);

  if (property.expandable) {
    return (
      <div className={styles['property-group']}>
        <div className={styles['group-header']}>
          <span className={styles['group-title']}>{getLabel(property.labelKey)}</span>
          {toggleChild && (
            <Switch
              checked={getValue(toggleChild.key) as boolean}
              onChange={(checked) => setValue(toggleChild.key, checked)}
            />
          )}
        </div>
        {isEnabled && contentChildren.length > 0 && (
          <div className={styles['group-content']}>
            {contentChildren.map((child) => (
              <PropertyRenderer
                key={child.key}
                onNestedStateChange={onNestedStateChange}
                onStateChange={onStateChange}
                property={child}
                state={state}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Non-expandable group - just render children inline
  return (
    <>
      {property.children.map((child) => (
        <PropertyRenderer
          key={child.key}
          onNestedStateChange={onNestedStateChange}
          onStateChange={onStateChange}
          property={child}
          state={state}
        />
      ))}
    </>
  );
};

export default GroupProperty;
