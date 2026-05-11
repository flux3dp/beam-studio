import type { ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import useI18n from '@core/helpers/useI18n';

import type { DecorationOptionValues, DecorationPathOptionDef } from '../../types';
import useKeychainShapeStore from '../../useKeychainShapeStore';

import GroupCollapse from './Controls/GroupCollapse';
import SwitchControl from './Controls/SwitchControl';
import DecorationPathSelector from './DecorationPathSelector';

interface DecorationControlProps {
  optionDef: DecorationPathOptionDef;
}

const DecorationControl = ({ optionDef }: DecorationControlProps): ReactNode => {
  const { id, options } = optionDef;
  const decoration = useKeychainShapeStore((s) => s.state.decorationPaths[id]);
  const viewBox = useKeychainShapeStore((s) => s.category.defaultViewBox);
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

  const handleSelectKey = useCallback(
    (selectedKey: string) => handleChange({ enabled: true, selectedKey }),
    [handleChange],
  );
  const handleClear = useCallback(() => handleChange({ enabled: false, selectedKey: '' }), [handleChange]);
  const handleEmbossChange = useCallback((emboss: boolean) => handleChange({ emboss }), [handleChange]);

  return (
    <GroupCollapse title={t.decoration}>
      <DecorationPathSelector
        onClear={decoration.enabled ? handleClear : undefined}
        onSelect={handleSelectKey}
        options={options}
        selectedKey={decoration.selectedKey}
        viewBox={viewBox}
      />
      <SwitchControl
        disabled={!decoration.enabled}
        label={t.emboss}
        onChange={handleEmbossChange}
        value={decoration.emboss}
      />
    </GroupCollapse>
  );
};

DecorationControl.displayName = 'DecorationControl';

export default memo(DecorationControl);
