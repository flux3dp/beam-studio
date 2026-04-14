import type { ReactNode } from 'react';
import React, { memo, useCallback } from 'react';

import useI18n from '@core/helpers/useI18n';

import type { SizeDimension } from '../../types';
import useKeychainShapeStore from '../../useKeychainShapeStore';

import GroupControl from './Controls/GroupControl';
import NumberControl from './Controls/NumberControl';

const SizeGroup = (): ReactNode => {
  const { keychain_generator: t } = useI18n();
  const calculatedSize = useKeychainShapeStore((s) => s.calculatedSize);

  const handleChange = useCallback(async (dimension: SizeDimension, value: number) => {
    const { applyOptions, buildBaseShape, category, updateState } = useKeychainShapeStore.getState();

    updateState({ size: { dimension, value } });

    const isFresh = await buildBaseShape(category);

    if (isFresh) applyOptions();
  }, []);

  return (
    <GroupControl enabled hideSwitch title={t.size} tooltip={t.size_tooltip}>
      <NumberControl
        label={t.size_width}
        max={200}
        min={5}
        onChange={(val) => handleChange('width', val)}
        step={1}
        unit="mm"
        value={calculatedSize.width}
        withSlider={false}
      />
      <NumberControl
        label={t.size_height}
        max={200}
        min={5}
        onChange={(val) => handleChange('height', val)}
        step={1}
        unit="mm"
        value={calculatedSize.height}
        withSlider={false}
      />
    </GroupControl>
  );
};

SizeGroup.displayName = 'SizeGroup';

export default memo(SizeGroup);
