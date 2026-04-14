import type { ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import useI18n from '@core/helpers/useI18n';

import type { DecorationOptionValues, DecorationPathOptionDef } from '../../types';
import useKeychainShapeStore from '../../useKeychainShapeStore';

import GroupControl from './Controls/GroupControl';
import SwitchControl from './Controls/SwitchControl';

interface DecorationControlProps {
  optionDef: DecorationPathOptionDef;
}

const DecorationControl = ({ optionDef }: DecorationControlProps): ReactNode => {
  const { id } = optionDef;
  const decoration = useKeychainShapeStore((s) => s.state.decorationPaths[id]);
  const { keychain_generator: t } = useI18n();

  const handleChange = useCallback(
    (updates: Partial<DecorationOptionValues>) => {
      const {
        applyOptions,
        state: { decorationPaths: decorations },
        updateState,
      } = useKeychainShapeStore.getState();

      updateState({ decorationPaths: { ...decorations, [id]: { ...decorations[id], ...updates } } });
      applyOptions();
    },
    [id],
  );

  const handleEnabledChange = useCallback((enabled: boolean) => handleChange({ enabled }), [handleChange]);
  const handleEmbossChange = useCallback((emboss: boolean) => handleChange({ emboss }), [handleChange]);

  return (
    <GroupControl
      enabled={decoration.enabled}
      id={`decoration-${id}`}
      onToggle={handleEnabledChange}
      title={t.decoration}
    >
      <SwitchControl label={t.emboss} onChange={handleEmbossChange} value={decoration.emboss} />
    </GroupControl>
  );
};

DecorationControl.displayName = 'DecorationControl';

export default memo(DecorationControl);
