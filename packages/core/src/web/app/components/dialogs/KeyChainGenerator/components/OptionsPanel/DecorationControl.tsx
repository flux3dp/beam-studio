import type { ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import { Switch } from 'antd';

import useI18n from '@core/helpers/useI18n';

import type { DecorationOptionValues, DecorationPathOptionDef } from '../../types';
import useKeychainShapeStore from '../../useKeychainShapeStore';

import GroupControl from './Controls/GroupControl';

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
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span>{t.emboss}</span>
        <Switch checked={decoration.emboss} onChange={handleEmbossChange} size="small" />
      </div>
    </GroupControl>
  );
};

DecorationControl.displayName = 'DecorationControl';

export default memo(DecorationControl);
